import { SavedConflictRecord } from '../types';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

export interface UserStats {
  personalAnalysesCount: number;
  coupleSessionsCount: number;
}

const AUTH_TOKEN_KEY = 'aramshkon_auth_token_v1';
const MIGRATED_FLAG_KEY = 'aramshkon_history_migrated_v1';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

async function authFetch(route: string, options: RequestInit = {}): Promise<any> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(route, { ...options, headers });
  } catch (err) {
    throw new Error('خطا در برقراری ارتباط با سرور. لطفاً اینترنت خود را بررسی کنید.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'خطایی در پردازش درخواست پیش آمد 🤍');
  }

  return data;
}

export async function registerUser(name: string, email: string, password: string) {
  const data = await authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function loginUser(email: string, password: string) {
  const data = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function fetchCurrentUserProfile() {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const data = await authFetch('/api/auth/me', { method: 'GET' });
    return data;
  } catch {
    setStoredToken(null);
    return null;
  }
}

export async function updateUserProfile(name: string) {
  return await authFetch('/api/auth/profile', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteUserAccount() {
  const data = await authFetch('/api/auth/account', {
    method: 'DELETE',
  });
  setStoredToken(null);
  return data;
}

export async function logoutUser() {
  try {
    await authFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
  setStoredToken(null);
}

export async function fetchUserHistory(): Promise<SavedConflictRecord[]> {
  try {
    const data = await authFetch('/api/history', { method: 'GET' });
    return data.history || [];
  } catch {
    return [];
  }
}

export async function syncLocalStorageHistoryOnce(localItems?: SavedConflictRecord[]) {
  if (typeof window === 'undefined') return null;
  const token = getStoredToken();
  if (!token) return null;

  const isMigrated = localStorage.getItem(MIGRATED_FLAG_KEY);
  if (isMigrated) {
    return await fetchUserHistory();
  }

  const itemsToSync = localItems || JSON.parse(localStorage.getItem('aramshkon_history_v1') || '[]');
  if (!itemsToSync || itemsToSync.length === 0) {
    localStorage.setItem(MIGRATED_FLAG_KEY, 'true');
    return await fetchUserHistory();
  }

  try {
    const data = await authFetch('/api/history/sync', {
      method: 'POST',
      body: JSON.stringify({ items: itemsToSync }),
    });
    localStorage.setItem(MIGRATED_FLAG_KEY, 'true');
    return data.history || null;
  } catch (err) {
    console.warn('Failed to sync local history:', err);
    return null;
  }
}

export async function savePersonalAnalysisRecord(item: {
  id?: string;
  story: string;
  category: string;
  emotion: string;
  gender?: string | null;
  analysis: any;
}) {
  const token = getStoredToken();
  if (!token) return null;
  try {
    await authFetch('/api/history/save', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return await fetchUserHistory();
  } catch {
    return null;
  }
}

export async function deletePersonalHistoryItem(id: string) {
  try {
    await authFetch(`/api/history/${id}`, { method: 'DELETE' });
    return await fetchUserHistory();
  } catch {
    return null;
  }
}

export async function clearAllPersonalHistory() {
  try {
    await authFetch('/api/history/clear', { method: 'DELETE' });
    return [];
  } catch {
    return [];
  }
}

// Export aliases
export { fetchUserHistory as getUserHistoryFromApi };
export { savePersonalAnalysisRecord as saveAnalysisToApi };
export { deletePersonalHistoryItem as deleteAnalysisFromApi };
export { clearAllPersonalHistory as clearUserHistoryFromApi };
