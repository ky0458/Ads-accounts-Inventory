import { AdAccount } from '../types';

export const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('auth_token');
  const headers: any = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Keep sending username for audit log convenience (although backend could use JWT)
  const userStr = localStorage.getItem('auth_user');
  let username = 'Unknown';
  if (userStr) {
    try {
      username = JSON.parse(userStr).username;
    } catch(e) {}
  }
  headers['x-user-name'] = username;

  return headers;
}

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
      headers: getHeaders(),
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
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch (error) {
    console.warn(error);
    return false;
  }
}
