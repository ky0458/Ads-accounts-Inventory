/**
 * FB API Integration Utilities
 */

export const FB_GRAPH_URL = 'https://graph.facebook.com/v19.0';
import { AdAccount } from '../types';

export interface FBConfig {
  accessToken: string;
  businessId?: string;
}

const FIELDS = 'account_id,name,account_status,currency,timezone_name,funding_source_details,spend_cap,amount_spent,business';

/**
 * Normalizes FB status to our App status
 */
export function normalizeFBStatus(fbStatusInt: number): import('../types').FBAccountStatus {
  switch (fbStatusInt) {
    case 1: return 'ACTIVE';
    case 2: return 'DISABLED';
    case 3: return 'UNSETTLED';
    case 7:
    case 8:
    case 9: return 'IN_REVIEW';
    default: return 'DISABLED';
  }
}

/**
 * Map raw FB Graph API response to our AdAccount format.
 */
export function parseFBAccount(raw: any): AdAccount {
  // Try to determine limit from spend_cap or mock to -1 (No limit) if 0 or undefined
  const rawLimit = raw.spend_cap ? parseInt(raw.spend_cap) : 0;
  const limit = rawLimit === 0 ? -1 : Math.round(rawLimit / 100);

  let paymentCard = '';
  if (raw.funding_source_details && raw.funding_source_details.display_string) {
    paymentCard = raw.funding_source_details.display_string;
  }

  return {
    id: `act_${raw.account_id}`,
    name: raw.name || `Tài khoản ${raw.account_id}`,
    fbStatus: normalizeFBStatus(raw.account_status),
    inventoryStatus: 'IN_STOCK',
    importDate: new Date().toISOString(),
    linkedPartners: raw.business ? [{ id: raw.business.id, name: raw.business.name || raw.business.id }] : [],
    paymentCard,
    limit,
    accountType: raw.business ? 'REGULAR' : 'REGULAR', // Can be enhanced with VO detection logic
    accountScope: raw.business ? 'BM' : 'PERSONAL',
    timezone: raw.timezone_name || 'UTC',
    currency: raw.currency || 'USD',
    spend: raw.amount_spent ? parseFloat(raw.amount_spent) / 100 : 0
  };
}

/**
 * Fetches ALL ad accounts the user has access to (Personal + All BMs)
 */
export async function fetchAccountById(actId: string, token: string): Promise<Partial<AdAccount> | null> {
  try {
    const res = await fetch(`${FB_GRAPH_URL}/${actId}?fields=${FIELDS}&access_token=${token}`);
    const fbData = await res.json();
    if (!fbData.error && fbData.account_id) {
      const parsed = parseFBAccount(fbData);
      return {
        name: parsed.name,
        fbStatus: parsed.fbStatus,
        linkedPartners: parsed.linkedPartners,
        paymentCard: parsed.paymentCard,
        limit: parsed.limit,
        timezone: parsed.timezone,
        currency: parsed.currency,
        spend: parsed.spend,
      };
    }
  } catch (e) {
    console.warn(`Fetch error for ${actId}`, e);
  }
  return null;
}

export async function fetchAllUserAccounts(token: string): Promise<AdAccount[]> {
  if (!token) throw new Error('Missing Access Token');

  let allAccounts: any[] = [];
  const seenIds = new Set<string>();

  const addAccounts = (accounts: any[]) => {
    if (!accounts) return;
    accounts.forEach(acc => {
      if (!seenIds.has(acc.account_id)) {
        seenIds.add(acc.account_id);
        allAccounts.push(acc);
      }
    });
  };

  try {
    // 1. Fetch Personal Ad Accounts
    try {
      const pRes = await fetch(`${FB_GRAPH_URL}/me/adaccounts?fields=${FIELDS}&limit=100&access_token=${token}`);
      const pData = await pRes.json();
      if (pData.data) addAccounts(pData.data);
    } catch (e) {
      console.warn('Could not fetch personal ad accounts', e);
    }

    // 2. Fetch User's Business Managers
    const bmRes = await fetch(`${FB_GRAPH_URL}/me/businesses?fields=id,name&limit=100&access_token=${token}`);
    const bmData = await bmRes.json();
    
    if (bmData.data) {
      // 3. For all BMs, fetch client and owned accounts in parallel
      const bmPromises = bmData.data.map(async (bm: any) => {
        const fetchClient = async () => {
          try {
            const res = await fetch(`${FB_GRAPH_URL}/${bm.id}/client_ad_accounts?fields=${FIELDS}&limit=100&access_token=${token}`);
            const data = await res.json();
            if (data.data) addAccounts(data.data);
          } catch (e) {
            console.warn(`Error fetching client accounts for BM ${bm.id}`);
          }
        };

        const fetchOwned = async () => {
          try {
            const res = await fetch(`${FB_GRAPH_URL}/${bm.id}/owned_ad_accounts?fields=${FIELDS}&limit=100&access_token=${token}`);
            const data = await res.json();
            if (data.data) addAccounts(data.data);
          } catch (e) {
            console.warn(`Error fetching owned accounts for BM ${bm.id}`);
          }
        };

        await Promise.all([fetchClient(), fetchOwned()]);
      });

      await Promise.all(bmPromises);
    }
  } catch (error) {
    console.error('Failed to sync from FB API:', error);
    throw new Error('Không thể kết nối API. Token có thể đã hết hạn hoặc thiếu quyền.');
  }

  return allAccounts.map(parseFBAccount);
}

