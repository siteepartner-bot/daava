import { CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';

const SESSION_STORAGE_KEY = 'aramkon_active_couple_session';

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
  const response = await fetch('/api/couple/create', {
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
  const response = await fetch('/api/couple/join', {
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

  const response = await fetch(`/api/couple/${encodeURIComponent(sessionIdOrCode)}`, {
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
  const response = await fetch(`/api/couple/${encodeURIComponent(params.sessionIdOrCode)}/submit`, {
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
    await fetch(`/api/couple/${encodeURIComponent(sessionIdOrCode)}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.warn('Error sending leave session:', err);
  } finally {
    clearActiveSessionAuth();
  }
}
