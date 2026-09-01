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

function getAuthApiEndpoints(route: string): { primary: string; fallback: string | null } {
  const CLOUDFLARE_WORKER_URL = 'https://frosty-tree-3857.sitee-partner.workers.dev';
  let savedWorkerUrl = '';
  if (typeof window !== 'undefined') {
    savedWorkerUrl = localStorage.getItem('custom_worker_api_url') || '';
  }

  const metaEnv = (import.meta as any)?.env;
  const configuredWorker = savedWorkerUrl || metaEnv?.VITE_WORKER_API_URL;

  let primaryEndpoint = route;
  let fallbackEndpoint: string | null = `${CLOUDFLARE_WORKER_URL}${route}`;

  if (configuredWorker) {
    const cleanUrl = configuredWorker.trim().replace(/\/+$/, '');
    primaryEndpoint = `${cleanUrl}${route}`;
    fallbackEndpoint = `${CLOUDFLARE_WORKER_URL}${route}`;
  } else if (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('workers.dev') ||
      window.location.hostname.includes('pages.dev'))
  ) {
    primaryEndpoint = `${CLOUDFLARE_WORKER_URL}${route}`;
    fallbackEndpoint = route;
  }

  return { primary: primaryEndpoint, fallback: fallbackEndpoint };
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

  const { primary, fallback } = getAuthApiEndpoints(route);

  let response: Response | null = null;
  let responseData: any = null;

  // 1. Try primary endpoint
  try {
    const res = await fetch(primary, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (res.ok || (res.status !== 404 && res.status < 500 && (data.message || data.error))) {
      response = res;
      responseData = data;
    }
  } catch {
    // Primary network error
  }

  // 2. Fallback if primary endpoint failed or gave 404/500
  if (!response && fallback && fallback !== primary) {
    try {
      const res = await fetch(fallback, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status < 500) {
        response = res;
        responseData = data;
      }
    } catch {
      // Fallback network error
    }
  }

  if (!response) {
    throw new Error('خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت را بررسی کنید.');
  }

  if (!response.ok) {
    throw new Error(responseData?.message || responseData?.error || 'خطایی در پردازش درخواست پیش آمد 🤍');
  }

  return responseData;
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
