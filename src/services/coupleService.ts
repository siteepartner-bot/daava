import { CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';

const SESSION_STORAGE_KEY = 'aramkon_active_couple_session';
const LOCAL_ROOMS_CACHE_KEY = 'aramkon_local_rooms_cache';

export function normalizeRoomCode(input: string): string {
  if (!input) return '';
  let str = input.trim();
  if (str.includes('join=') || str.includes('code=')) {
    const match = str.match(/[?&](join|code)=([a-zA-Z0-9_-]+)/i);
    if (match && match[2]) str = match[2];
  } else if (str.includes('/join/')) {
    const parts = str.split('/join/');
    if (parts[1]) str = parts[1].split(/[/?#]/)[0];
  }
  return str
    .replace(/[۰-۹]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase();
}

function saveLocalRoomCache(session: CoupleSessionPublicState, auth?: LocalCoupleSessionAuth) {
  try {
    const raw = localStorage.getItem(LOCAL_ROOMS_CACHE_KEY);
    const rooms = raw ? JSON.parse(raw) : {};
    rooms[session.id] = { session, auth };
    if (session.joinCode) {
      rooms[session.joinCode.toUpperCase()] = { session, auth };
    }
    localStorage.setItem(LOCAL_ROOMS_CACHE_KEY, JSON.stringify(rooms));
  } catch (e) {
    console.warn('Failed to save local room cache:', e);
  }
}

function getLocalRoomCache(codeOrId: string): { session: CoupleSessionPublicState; auth?: LocalCoupleSessionAuth } | null {
  try {
    const raw = localStorage.getItem(LOCAL_ROOMS_CACHE_KEY);
    if (!raw) return null;
    const rooms = JSON.parse(raw);
    const key = normalizeRoomCode(codeOrId);
    return rooms[key] || rooms[codeOrId] || null;
  } catch {
    return null;
  }
}

export function ensureNumeric4Digits(input: string): string {
  if (!input) return '1000';
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length === 4) return digitsOnly;
  if (digitsOnly.length > 4) return digitsOnly.substring(0, 4);
  // Hash non-numeric string deterministically into a 4-digit number (1000 - 9999)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 9000;
  }
  return (1000 + Math.abs(hash)).toString();
}

function getApiEndpoints(route: string): { primary: string; fallback: string | null } {
  let savedWorkerUrl = '';
  if (typeof window !== 'undefined') {
    savedWorkerUrl = localStorage.getItem('custom_worker_api_url') || '';
  }

  const metaEnv = (import.meta as any)?.env;
  const configuredWorker = savedWorkerUrl || metaEnv?.VITE_WORKER_API_URL;

  // Primary endpoint MUST be relative /api/... so it hits our Express backend directly
  let primaryEndpoint = route;
  let fallbackEndpoint: string | null = null;

  if (configuredWorker) {
    const cleanUrl = configuredWorker.trim().replace(/\/+$/, '');
    fallbackEndpoint = cleanUrl.endsWith('/api/analyze') || cleanUrl.endsWith('/api/suggest-replies') || cleanUrl.endsWith('/api/rewrite-reply')
      ? cleanUrl.replace(/\/api\/[a-z-]+$/, route)
      : `${cleanUrl}${route}`;
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
  let data: any = null;
  try {
    const response = await fetchWithFallback('/api/couple/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'خطا در ایجاد جلسه دونفره 🤍');
    }

    data = await response.json();
  } catch (err: any) {
    // If backend failed, create client-side fallback session
    console.warn('Backend create failed, creating local fallback room:', err);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const sId = 'cs_local_' + Math.random().toString(36).substring(2, 10);
    const token = Math.random().toString(36).substring(2, 15);
    const now = Date.now();
    const hasStory = Boolean(params.story && params.story.trim().length >= 20);

    const fallbackSession: CoupleSessionPublicState = {
      id: sId,
      joinCode: code,
      status: hasStory ? 'participant_a_completed' : 'waiting',
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
      participantA: {
        name: params.name || 'نفر اول',
        completed: hasStory,
        completedAt: hasStory ? now : undefined,
      },
      participantB: null,
      isParticipantACompleted: hasStory,
      isParticipantBCompleted: false,
      isReadyForAnalysis: false,
      yourRole: 'participantA',
      yourCompleted: hasStory,
      sharedAnalysis: null,
      analyzedAt: null,
    };

    const auth: LocalCoupleSessionAuth = {
      sessionId: sId,
      joinCode: code,
      role: 'participantA',
      token,
      name: params.name || 'نفر اول',
    };

    saveActiveSessionAuth(auth);
    saveLocalRoomCache(fallbackSession, auth);

    return {
      session: fallbackSession,
      token,
      role: 'participantA',
    };
  }

  if (!data || !data.success || !data.session) {
    throw new Error(data?.message || 'خطا در ساخت جلسه.');
  }

  if (data.session && data.session.joinCode) {
    data.session.joinCode = ensureNumeric4Digits(data.session.joinCode);
  }

  const auth: LocalCoupleSessionAuth = {
    sessionId: data.session.id,
    joinCode: data.session.joinCode,
    role: 'participantA',
    token: data.token,
    name: params.name || data.session.participantA.name,
  };

  // Cache auth & room locally
  saveActiveSessionAuth(auth);
  saveLocalRoomCache(data.session, auth);

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
  const cleanKey = normalizeRoomCode(params.joinCodeOrId);

  try {
    const response = await fetchWithFallback('/api/couple/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        joinCodeOrId: cleanKey || params.joinCodeOrId,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.session) {
        if (data.session.joinCode) {
          data.session.joinCode = ensureNumeric4Digits(data.session.joinCode);
        }
        const auth: LocalCoupleSessionAuth = {
          sessionId: data.session.id,
          joinCode: data.session.joinCode,
          role: data.role,
          token: data.token,
          name: params.name || (data.role === 'participantA' ? data.session.participantA.name : data.session.participantB?.name || ''),
        };
        saveActiveSessionAuth(auth);
        saveLocalRoomCache(data.session, auth);

        return {
          session: data.session,
          token: data.token,
          role: data.role,
        };
      }
    }
  } catch (err) {
    console.warn('Server join fetch failed, checking local cache:', err);
  }

  // Fallback to local room cache if available
  const cached = getLocalRoomCache(cleanKey || params.joinCodeOrId);
  if (cached) {
    const role: 'participantA' | 'participantB' =
      cached.auth?.token === params.existingToken
        ? cached.auth.role
        : 'participantB';

    const token = cached.auth?.token || 'tok_b_' + Math.random().toString(36).substring(2, 10);
    const updatedSession: CoupleSessionPublicState = {
      ...cached.session,
      participantB: cached.session.participantB || {
        name: params.name || 'همراه',
        completed: false,
      },
      yourRole: role,
    };

    const auth: LocalCoupleSessionAuth = {
      sessionId: updatedSession.id,
      joinCode: updatedSession.joinCode,
      role,
      token,
      name: params.name || 'همراه',
    };

    saveActiveSessionAuth(auth);
    saveLocalRoomCache(updatedSession, auth);

    return {
      session: updatedSession,
      token,
      role,
    };
  }

  throw new Error('اتاقی با این کد ۴ رقمی پیدا نشد. لطفاً کد را مجدداً بررسی کنید 🤍');
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

  const response = await fetchWithFallback(`/api/couple/${encodeURIComponent(sessionIdOrCode)}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 410) {
      throw new Error('این جلسه دیگه فعال نیست 🤍');
    }
    throw new Error(errData.message || 'خطا در دریافت وضعیت جلسه.');
  }

  const data = await response.json();
  if (!data.success || !data.session) {
    throw new Error(data.message || 'جلسه پیدا نشد.');
  }

  return data.session;
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
