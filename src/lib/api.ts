import { AdAccount } from '../types';

export const API_BASE = '/api';

export async function fetchAccounts(): Promise<AdAccount[]> {
  try {
    const res = await fetch(`${API_BASE}/accounts`);
    const text = await res.text();
    if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.status}`);
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('Invalid JSON from /api/accounts:', text.substring(0, 100));
      return [];
    }
  } catch (error) {
    console.warn(error);
    return [];
  }
}

export async function saveAccounts(accounts: AdAccount[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/accounts/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts }),
    });
    return res.ok;
  } catch (error) {
    console.warn(error);
    return false;
  }
}

export async function updateAccount(id: string, updates: Partial<AdAccount>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch (error) {
    console.warn(error);
    return false;
  }
}
