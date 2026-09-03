import { CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

const SESSION_STORAGE_KEY = 'aramkon_active_couple_session';

async function getSessionFromFirestoreDirectly(
  sessionIdOrCode: string,
  token?: string
): Promise<CoupleSessionPublicState | null> {
  try {
    const cleanId = sessionIdOrCode.trim();
    const lookupKey = cleanId.toUpperCase();

    // 1. Try document ID directly
    const docRef = doc(db, 'couple_sessions', cleanId);
    const docSnap = await getDoc(docRef);
    let sessionData: any = null;

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data?.dataJson) sessionData = JSON.parse(data.dataJson);
    } else {
      // 2. Query by joinCode
      const q = query(collection(db, 'couple_sessions'), where('joinCode', '==', lookupKey));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const data = querySnap.docs[0].data();
        if (data?.dataJson) sessionData = JSON.parse(data.dataJson);
      }
    }

    if (!sessionData) return null;

    // Sanitize for public state
    let role: 'participantA' | 'participantB' | undefined;
    if (token) {
      if (sessionData.participantA?.token === token) role = 'participantA';
      else if (sessionData.participantB?.token === token) role = 'participantB';
    }

    const isACompleted = Boolean(sessionData.participantA?.completed);
    const isBCompleted = Boolean(sessionData.participantB?.completed);
    const isReady = isACompleted && isBCompleted;

    return {
      id: sessionData.id,
      joinCode: sessionData.joinCode,
      status: isReady ? 'ready_for_analysis' : sessionData.status,
      createdAt: sessionData.createdAt,
      expiresAt: sessionData.expiresAt,
      participantA: {
        name: sessionData.participantA.name,
        completed: isACompleted,
        completedAt: sessionData.participantA.completedAt,
      },
      participantB: sessionData.participantB
        ? {
            name: sessionData.participantB.name,
            completed: isBCompleted,
            completedAt: sessionData.participantB.completedAt,
          }
        : null,
      isParticipantACompleted: isACompleted,
      isParticipantBCompleted: isBCompleted,
      isReadyForAnalysis: isReady,
      yourRole: role,
      yourCompleted:
        role === 'participantA'
          ? isACompleted
          : role === 'participantB'
          ? isBCompleted
          : false,
      sharedAnalysis: isReady ? sessionData.sharedAnalysis || null : null,
      analyzedAt: sessionData.analyzedAt || null,
    };
  } catch (err) {
    console.warn('Direct Firestore fetch error:', err);
    return null;
  }
}

function getApiEndpoints(route: string): { primary: string; fallback: string | null } {
  const CLOUDFLARE_WORKER_URL = 'https://frosty-tree-3857.sitee-partner.workers.dev';
  let savedWorkerUrl = '';
  if (typeof window !== 'undefined') {
    savedWorkerUrl = localStorage.getItem('custom_worker_api_url') || '';
  }

  const metaEnv = (import.meta as any)?.env;
  const configuredWorker = savedWorkerUrl || metaEnv?.VITE_WORKER_API_URL;

  let primaryEndpoint = route;
  let fallbackEndpoint: string | null = CLOUDFLARE_WORKER_URL;

  if (configuredWorker) {
    const cleanUrl = configuredWorker.trim().replace(/\/+$/, '');
    primaryEndpoint = cleanUrl.endsWith('/api/analyze') || cleanUrl.endsWith('/api/suggest-replies') || cleanUrl.endsWith('/api/rewrite-reply')
      ? cleanUrl.replace(/\/api\/[a-z-]+$/, route)
      : `${cleanUrl}${route}`;
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

async function fetchWithFallback(
  route: string,
  options: RequestInit
): Promise<Response> {
  const { primary, fallback } = getApiEndpoints(route);
  let response: Response | null = null;
  let lastError: any = null;

  try {
    response = await fetch(primary, options);
  } catch (err) {
    lastError = err;
  }

  if ((!response || !response.ok) && fallback && fallback !== primary) {
    try {
      const fallbackUrl = fallback.startsWith('http') ? fallback : fallback;
      const fbResponse = await fetch(fallbackUrl, options);
      if (fbResponse.ok || !response) {
        return fbResponse;
      }
    } catch (fbErr) {
      console.warn('Fallback couple API fetch failed:', fbErr);
    }
  }

  if (!response) {
    throw lastError || new Error('خطا در برقراری ارتباط با سرور.');
  }

  return response;
}

/**
 * Persist active session auth tokens locally for seamless page refresh
 */
export function saveActiveSessionAuth(auth: LocalCoupleSessionAuth): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(auth));
  } catch (err) {
    console.warn('Failed to save session auth to sessionStorage:', err);
  }
}

export function getActiveSessionAuth(): LocalCoupleSessionAuth | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearActiveSessionAuth(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear session auth:', err);
  }
}

/**
 * 1. Create a new Couple Session
 */
export async function createCoupleSession(params: {
  name: string;
  story?: string;
  category?: string | null;
  emotion?: string | null;
  gender?: string | null;
}): Promise<{
  session: CoupleSessionPublicState;
  token: string;
  role: 'participantA';
}> {
  const response = await fetchWithFallback('/api/couple/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'خطا در ایجاد جلسه دونفره 🤍');
  }

  const data = await response.json();
  if (!data.success || !data.session) {
    throw new Error(data.message || 'خطا در ساخت جلسه.');
  }

  // Cache auth
  saveActiveSessionAuth({
    sessionId: data.session.id,
    joinCode: data.session.joinCode,
    role: 'participantA',
    token: data.token,
    name: params.name || data.session.participantA.name,
  });

  return {
    session: data.session,
    token: data.token,
    role: 'participantA',
  };
}

/**
 * 2. Join an existing Couple Session
 */
export async function joinCoupleSession(params: {
  joinCodeOrId: string;
  name: string;
  existingToken?: string;
}): Promise<{
  session: CoupleSessionPublicState;
  token: string;
  role: 'participantA' | 'participantB';
}> {
  const response = await fetchWithFallback('/api/couple/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'خطا در ورود به جلسه 🤍');
  }

  const data = await response.json();
  if (!data.success || !data.session) {
    throw new Error(data.message || 'خطا در ورود به جلسه.');
  }

  // Cache auth
  saveActiveSessionAuth({
    sessionId: data.session.id,
    joinCode: data.session.joinCode,
    role: data.role,
    token: data.token,
    name: params.name || (data.role === 'participantA' ? data.session.participantA.name : data.session.participantB?.name || ''),
  });

  return {
    session: data.session,
    token: data.token,
    role: data.role,
  };
}

/**
 * 3. Fetch latest session status (Used in Polling)
 */
export async function getCoupleSessionStatus(
  sessionIdOrCode: string,
  token?: string
): Promise<CoupleSessionPublicState> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithFallback(`/api/couple/${encodeURIComponent(sessionIdOrCode)}`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.session) {
        return data.session;
      }
    }
  } catch (err: any) {
    console.warn('API fetch for session status failed, trying Firestore direct:', err);
  }

  // Fallback directly to Firebase Firestore
  const directSession = await getSessionFromFirestoreDirectly(sessionIdOrCode, token);
  if (directSession) {
    return directSession;
  }

  throw new Error('جلسه پیدا نشد یا ارتباط با سرور برقرار نشد 🤍');
}

/**
 * 4. Submit participant perspective/story
 */
export async function submitCoupleStory(params: {
  sessionIdOrCode: string;
  token: string;
  role: 'participantA' | 'participantB';
  name?: string;
  story: string;
  category?: string | null;
  emotion?: string | null;
  gender?: string | null;
}): Promise<CoupleSessionPublicState> {
  const response = await fetchWithFallback(`/api/couple/${encodeURIComponent(params.sessionIdOrCode)}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: params.token,
      role: params.role,
      name: params.name,
      story: params.story,
      category: params.category,
      emotion: params.emotion,
      gender: params.gender,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'خطا در ثبت دیدگاه 🤍');
  }

  const data = await response.json();
  if (!data.success || !data.session) {
    throw new Error(data.message || 'خطا در ذخیره پاسخ.');
  }

  return data.session;
}

/**
 * 5. Leave couple session
 */
export async function leaveCoupleSession(sessionIdOrCode: string): Promise<void> {
  try {
    await fetchWithFallback(`/api/couple/${encodeURIComponent(sessionIdOrCode)}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.warn('Error sending leave session:', err);
  } finally {
    clearActiveSessionAuth();
  }
}

/**
 * 6. Analyze couple session (Step 6)
 */
export async function analyzeCoupleSession(params: {
  sessionIdOrCode: string;
  token?: string;
  forceReanalyze?: boolean;
}): Promise<{
  sharedAnalysis: any;
  session: CoupleSessionPublicState;
}> {
  const auth = getActiveSessionAuth();
  const token =
    params.token ||
    (auth?.sessionId === params.sessionIdOrCode || auth?.joinCode === params.sessionIdOrCode
      ? auth.token
      : undefined);

  const response = await fetchWithFallback('/api/couple/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      sessionIdOrCode: params.sessionIdOrCode,
      token,
      forceReanalyze: params.forceReanalyze || false,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'نتونستیم تحلیل مشترک رو انجام بدیم 🤍');
  }

  const data = await response.json();
  if (!data.success || !data.sharedAnalysis) {
    throw new Error(data.message || 'پاسخ معتبری از تحلیل دریافت نشد.');
  }

  return {
    sharedAnalysis: data.sharedAnalysis,
    session: data.session,
  };
}
