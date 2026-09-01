/**
 * Cloudflare Worker for Gemini Conflict Analyzer
 * 
 * Supports:
 * - POST /api/analyze (یا POST /) -> تحلیل کامل دعوا
 * - POST /api/suggest-replies -> تولید ۵ لحن پیام یا بازتولید یک لحن
 * - POST /api/rewrite-reply -> بازنویسی پیام بر اساس دستور کاربر
 * - POST /api/couple/create -> ایجاد جلسه دونفره
 * - POST /api/couple/join -> ورود نفر دوم به جلسه
 * - GET /api/couple/:id -> دریافت وضعیت جلسه (امن و با حفظ حریم خصوصی)
 * - POST /api/couple/:id/submit -> ثبت دیدگاه نفر اول یا دوم
 * - POST /api/couple/:id/leave -> خروج از جلسه
 */

// In-memory sessions store for Worker instance
const workerCoupleSessions = new Map();
const workerJoinCodes = new Map();

function generateJoinCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!workerJoinCodes.has(code)) {
      return code;
    }
  }
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function getSessionFromStore(idOrCode, env) {
  const lookupKey = (idOrCode || '').trim().toUpperCase();
  let sessionId = workerJoinCodes.get(lookupKey) || idOrCode.trim();

  // Try in-memory
  let session = workerCoupleSessions.get(sessionId);
  if (session) return session;

  // Try Cloudflare KV if bound
  const kv = env?.COUPLE_KV || env?.ARAMKON_KV || env?.KV;
  if (kv) {
    try {
      if (lookupKey.length === 6) {
        const resolvedId = await kv.get('code:' + lookupKey);
        if (resolvedId) sessionId = resolvedId;
      }
      const raw = await kv.get('session:' + sessionId);
      if (raw) {
        const parsed = JSON.parse(raw);
        workerCoupleSessions.set(parsed.id, parsed);
        workerJoinCodes.set(parsed.joinCode.toUpperCase(), parsed.id);
        return parsed;
      }
    } catch (err) {
      console.warn('KV read error:', err);
    }
  }

  // Linear search fallback in memory
  for (const s of workerCoupleSessions.values()) {
    if (s.joinCode.toUpperCase() === lookupKey || s.id === idOrCode) {
      return s;
    }
  }

  return null;
}

async function saveSessionToStore(session, env) {
  workerCoupleSessions.set(session.id, session);
  workerJoinCodes.set(session.joinCode.toUpperCase(), session.id);

  const kv = env?.COUPLE_KV || env?.ARAMKON_KV || env?.KV;
  if (kv) {
    try {
      const ttl = 86400; // 24 hours
      await Promise.all([
        kv.put('session:' + session.id, JSON.stringify(session), { expirationTtl: ttl }),
        kv.put('code:' + session.joinCode.toUpperCase(), session.id, { expirationTtl: ttl }),
      ]);
    } catch (err) {
      console.warn('KV save error:', err);
    }
  }
}

async function deleteSessionFromStore(session, env) {
  if (!session) return;
  workerCoupleSessions.delete(session.id);
  workerJoinCodes.delete(session.joinCode.toUpperCase());

  const kv = env?.COUPLE_KV || env?.ARAMKON_KV || env?.KV;
  if (kv) {
    try {
      await Promise.all([
        kv.delete('session:' + session.id),
        kv.delete('code:' + session.joinCode.toUpperCase()),
      ]);
    } catch (err) {
      console.warn('KV delete error:', err);
    }
  }
}

function sanitizeSessionForPublic(session, requesterRole) {
  const isACompleted = Boolean(session.participantA?.completed);
  const isBCompleted = Boolean(session.participantB?.completed);
  const isReady = isACompleted && isBCompleted;

  return {
    id: session.id,
    joinCode: session.joinCode,
    status: isReady ? 'ready_for_analysis' : session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    participantA: {
      name: session.participantA.name,
      completed: isACompleted,
      completedAt: session.participantA.completedAt,
    },
    participantB: session.participantB
      ? {
          name: session.participantB.name,
          completed: isBCompleted,
          completedAt: session.participantB.completedAt,
        }
      : null,
    isParticipantACompleted: isACompleted,
    isParticipantBCompleted: isBCompleted,
    isReadyForAnalysis: isReady,
    yourRole: requesterRole,
    yourCompleted:
      requesterRole === 'participantA'
        ? isACompleted
        : requesterRole === 'participantB'
        ? isBCompleted
        : false,
    sharedAnalysis: isReady ? session.sharedAnalysis || null : null,
    analyzedAt: session.analyzedAt || null,
  };
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const normalizedPath = (url.pathname || '/').replace(/\/+$/, '') || '/';

    // Health check endpoint
    if (request.method === 'GET' && (normalizedPath === '/api/health' || normalizedPath === '' || normalizedPath === '/')) {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'Gemini Conflict Analyzer Worker',
          hasApiKey: Boolean(env?.GEMINI_API_KEY),
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Couple Session: GET /api/couple/:id or /couple/:id
    if (request.method === 'GET' && (normalizedPath.startsWith('/api/couple/') || normalizedPath.startsWith('/couple/'))) {
      const parts = normalizedPath.split('/');
      const sessionIdOrCode = parts[parts.length - 1];
      const authHeader = request.headers.get('Authorization') || '';
      const token = (authHeader.replace(/^Bearer\s+/i, '') || url.searchParams.get('token') || '').trim();

      const session = await getSessionFromStore(sessionIdOrCode, env);

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'SESSION_NOT_FOUND', message: 'جلسه پیدا نشد.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (session.expiresAt < Date.now()) {
        return new Response(
          JSON.stringify({ error: 'SESSION_EXPIRED', message: 'این جلسه دیگه فعال نیست 🤍' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let role;
      if (token) {
        if (session.participantA?.token === token) role = 'participantA';
        else if (session.participantB?.token === token) role = 'participantB';
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: sanitizeSessionForPublic(session, role),
          yourRole: role,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'POST') {
      try {
        const body = await request.json().catch(() => ({}));

        // Couple Session: POST /api/couple/create or /couple/create
        if (normalizedPath === '/api/couple/create' || normalizedPath === '/couple/create') {
          const { name, story, category, emotion, gender } = body;
          const cleanName = (typeof name === 'string' && name.trim()) || 'نفر اول';
          const cleanStory = (typeof story === 'string' && story.trim()) || '';
          const hasStory = cleanStory.length >= 20;

          const sessionId = 'cs_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
          const joinCode = generateJoinCode();
          const tokenA = 'tok_' + Math.random().toString(36).substring(2, 15);
          const now = Date.now();
          const expiresAt = now + 24 * 60 * 60 * 1000;

          const participantA = {
            id: 'pA',
            name: cleanName,
            token: tokenA,
            story: hasStory ? cleanStory : undefined,
            category: category || null,
            emotion: emotion || null,
            gender: gender || null,
            completed: hasStory,
            completedAt: hasStory ? now : undefined,
            createdAt: now,
          };

          const session = {
            id: sessionId,
            joinCode,
            createdAt: now,
            updatedAt: now,
            expiresAt,
            status: hasStory ? 'participant_a_completed' : 'waiting',
            participantA,
            participantB: null,
          };

          await saveSessionToStore(session, env);

          return new Response(
            JSON.stringify({
              success: true,
              session: sanitizeSessionForPublic(session, 'participantA'),
              token: tokenA,
              role: 'participantA',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Couple Session: POST /api/couple/join or /couple/join
        if (normalizedPath === '/api/couple/join' || normalizedPath === '/couple/join') {
          const { joinCodeOrId, name } = body;
          if (!joinCodeOrId) {
            return new Response(
              JSON.stringify({ error: 'INVALID_CODE', message: 'کد دعوت نامعتبر است.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const session = await getSessionFromStore(joinCodeOrId, env);

          if (!session) {
            return new Response(
              JSON.stringify({ error: 'SESSION_NOT_FOUND', message: 'جلسه‌ای با این کد دعوت پیدا نشد.' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (session.expiresAt < Date.now()) {
            return new Response(
              JSON.stringify({ error: 'SESSION_EXPIRED', message: 'این جلسه دیگه فعال نیست 🤍' }),
              { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const cleanName = (typeof name === 'string' && name.trim()) || 'همراه';
          const now = Date.now();

          if (!session.participantB) {
            const tokenB = 'tok_' + Math.random().toString(36).substring(2, 15);
            session.participantB = {
              id: 'pB',
              name: cleanName,
              token: tokenB,
              completed: false,
              createdAt: now,
            };
            session.updatedAt = now;

            await saveSessionToStore(session, env);

            return new Response(
              JSON.stringify({
                success: true,
                session: sanitizeSessionForPublic(session, 'participantB'),
                token: tokenB,
                role: 'participantB',
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (cleanName && cleanName !== 'همراه' && !session.participantB.completed) {
            session.participantB.name = cleanName;
            await saveSessionToStore(session, env);
          }

          return new Response(
            JSON.stringify({
              success: true,
              session: sanitizeSessionForPublic(session, 'participantB'),
              token: session.participantB.token,
              role: 'participantB',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Couple Session: POST /api/couple/:id/submit or /couple/:id/submit
        if ((normalizedPath.startsWith('/api/couple/') || normalizedPath.startsWith('/couple/')) && normalizedPath.endsWith('/submit')) {
          const parts = normalizedPath.split('/');
          const sessionIdOrCode = parts[parts.length - 2];
          const { token, role, name, story, category, emotion, gender } = body;

          if (!story || typeof story !== 'string' || story.trim().length < 20) {
            return new Response(
              JSON.stringify({ error: 'INVALID_STORY', message: 'یکم بیشتر برامون تعریف کن تا بهتر بفهمیم 🤍' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const session = await getSessionFromStore(sessionIdOrCode, env);

          if (!session) {
            return new Response(
              JSON.stringify({ error: 'SESSION_NOT_FOUND', message: 'جلسه پیدا نشد.' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const now = Date.now();
          let targetRole = (role === 'participantA' || role === 'participantB') ? role : (session.participantA.token === token ? 'participantA' : 'participantB');

          if (targetRole === 'participantA') {
            if (name) session.participantA.name = name.trim();
            session.participantA.story = story.trim();
            session.participantA.category = category || null;
            session.participantA.emotion = emotion || null;
            session.participantA.gender = gender || null;
            session.participantA.completed = true;
            session.participantA.completedAt = now;
          } else {
            if (!session.participantB) {
              session.participantB = {
                id: 'pB',
                name: (name && name.trim()) || 'همراه',
                token: token || 'tok_' + Math.random().toString(36).substring(2, 10),
                completed: true,
                completedAt: now,
                createdAt: now,
              };
            } else {
              if (name) session.participantB.name = name.trim();
              session.participantB.completed = true;
              session.participantB.completedAt = now;
            }
            session.participantB.story = story.trim();
            session.participantB.category = category || null;
            session.participantB.emotion = emotion || null;
            session.participantB.gender = gender || null;
          }

          session.updatedAt = now;

          const isACompleted = Boolean(session.participantA?.completed);
          const isBCompleted = Boolean(session.participantB?.completed);
          if (isACompleted && isBCompleted) session.status = 'ready_for_analysis';
          else if (isACompleted) session.status = 'participant_a_completed';
          else if (isBCompleted) session.status = 'participant_b_completed';

          await saveSessionToStore(session, env);

          return new Response(
            JSON.stringify({
              success: true,
              session: sanitizeSessionForPublic(session, targetRole),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Couple Session: POST /api/couple/:id/leave or /couple/:id/leave
        if ((normalizedPath.startsWith('/api/couple/') || normalizedPath.startsWith('/couple/')) && normalizedPath.endsWith('/leave')) {
          const parts = normalizedPath.split('/');
          const sessionIdOrCode = parts[parts.length - 2];
          const session = await getSessionFromStore(sessionIdOrCode, env);

          if (session) {
            await deleteSessionFromStore(session, env);
          }

          return new Response(
            JSON.stringify({ success: true, message: 'از جلسه خارج شدید.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Couple Session: POST /api/couple/analyze or /couple/analyze
        if (normalizedPath === '/api/couple/analyze' || normalizedPath === '/couple/analyze') {
          const { sessionIdOrCode, token, forceReanalyze } = body;
          const authHeader = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
          const authToken = authHeader || token || '';

          if (!sessionIdOrCode) {
            return new Response(
              JSON.stringify({ error: 'INVALID_SESSION', message: 'شناسه یا کد جلسه معتبر نیست.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const session = await getSessionFromStore(sessionIdOrCode, env);
          if (!session) {
            return new Response(
              JSON.stringify({ error: 'SESSION_NOT_FOUND', message: 'جلسه مورد نظر پیدا نشد.' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          let requesterRole;
          if (authToken) {
            if (session.participantA?.token === authToken) requesterRole = 'participantA';
            else if (session.participantB?.token === authToken) requesterRole = 'participantB';
          }

          const isACompleted = Boolean(session.participantA?.completed && session.participantA?.story);
          const isBCompleted = Boolean(session.participantB?.completed && session.participantB?.story);

          if (!isACompleted || !isBCompleted) {
            return new Response(
              JSON.stringify({ error: 'NOT_READY', message: 'هنوز هر دو نفر دیدگاه خود را ثبت نکرده‌اند.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (session.sharedAnalysis && forceReanalyze !== true) {
            return new Response(
              JSON.stringify({
                success: true,
                sharedAnalysis: session.sharedAnalysis,
                session: sanitizeSessionForPublic(session, requesterRole),
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const apiKey = env?.GEMINI_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({
                error: 'GEMINI_API_KEY_MISSING',
                message: 'متغیر GEMINI_API_KEY در تنظیمات Worker کلودفلر تعریف نشده است.',
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const pA = session.participantA;
          const pB = session.participantB;
          const category = pA.category || pB.category || 'ارتباط و رابطه';

          const systemInstruction = `تو یک میانجی تحلیلی و روان‌شناس روابط کاملاً بی‌طرف، آرامش‌بخش، منصف و همدل هستی.
دو نفر که درگیر یک اختلاف عاطفی یا گفتگویی شده‌اند، روایت خود از ماجرا را به صورت جداگانه ثبت کرده‌اند.

روایت نفر اول (شرکت‌کننده A):
نام/لقب: ${pA.name || 'نفر اول'}
جنسیت: ${pA.gender === 'female' ? 'خانم' : pA.gender === 'male' ? 'آقا' : 'مشخص‌نشده'}
احساس انتخاب‌شده: ${pA.emotion || 'نامشخص'}
شرح روایت: ${pA.story}

روایت نفر دوم (شرکت‌کننده B):
نام/لقب: ${pB.name || 'نفر دوم'}
جنسیت: ${pB.gender === 'female' ? 'خانم' : pB.gender === 'male' ? 'آقا' : 'مشخص‌نشده'}
احساس انتخاب‌شده: ${pB.emotion || 'نامشخص'}
شرح روایت: ${pB.story}

موضوع کلان رابطه: ${category}

قوانین حیاتی تحلیل بی‌طرفانه (Strict Privacy & Neutrality):
۱. طرف هیچ‌کدام از طرفین را نگیر و به هیچ وجه دنبال مقصر یا «حق با کیست» نگرد.
۲. دو روایت را به عنوان دو «برداشت و دیدگاه شخصی» در نظر بگیر، نه حقیقت مطلق یا ادعای ثابتی.
۳. اگر دو نفر یک اتفاق را متفاوت تعریف کرده‌اند، اختلاف روایت و برداشت متفاوتشان را با احترام مشخص کن.
۴. چیزی که در داده‌ها وجود ندارد را به عنوان واقعیت قطعی بیان نکن.
۵. درباره نیت داخلی افراد حدس قطعی نزن و حتماً از عبارت‌های «ممکن است»، «به نظر می‌رسد»، «احتمالاً» استفاده کن.
۶. رفتار آسیب‌زا یا توهین‌آمیز را توجیه نکن اما قضاوت شخصیتی هم نکن.
۷. در صورت وجود نشانه‌های تهدید یا خشونت، امنیت افراد را اولویت قرار بده.
۸. هدف تحلیل برنده کردن هیچ‌کس نیست، بلکه هموار کردن مسیر گفتگو و درک متقابل است.
۹. خروجی باید دقیقاً و فقط طبق JSON Schema تعریف‌شده باشد.`;

          const promptText = `لطفاً روایت هر دو نفر را بررسی کن و تحلیل مشترک دونفره، منصفانه و ساختاریافته را به زبان فارسی و فرمت JSON ارائه بده.`;

          const candidateModels = ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
          let parsedAnalysis = null;

          for (const model of candidateModels) {
            try {
              const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: promptText }] }],
                  systemInstruction: { parts: [{ text: systemInstruction }] },
                  generationConfig: {
                    temperature: 0.3,
                    responseMimeType: 'application/json',
                  },
                }),
              });

              if (!res.ok) continue;

              const data = await res.json();
              const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textOut) {
                try {
                  parsedAnalysis = JSON.parse(textOut);
                } catch {
                  const match = textOut.match(/\{[\s\S]*\}/);
                  if (match) parsedAnalysis = JSON.parse(match[0]);
                }
              }

              if (parsedAnalysis) break;
            } catch (err) {
              console.warn(`Worker gemini call error with model ${model}:`, err);
            }
          }

          if (!parsedAnalysis) {
            return new Response(
              JSON.stringify({ error: 'ANALYSIS_FAILED', message: 'نتونستیم تحلیل مشترک رو انجام بدیم 🤍' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          session.sharedAnalysis = parsedAnalysis;
          session.analyzedAt = Date.now();
          session.updatedAt = Date.now();
          await saveSessionToStore(session, env);

          return new Response(
            JSON.stringify({
              success: true,
              sharedAnalysis: session.sharedAnalysis,
              session: sanitizeSessionForPublic(session, requesterRole),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const apiKey = env?.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error: 'GEMINI_API_KEY_MISSING',
              message: 'متغیر GEMINI_API_KEY در تنظیمات Worker کلودفلر تعریف نشده است.',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Models supported on Google Gemini API
        const candidateModels = [
          'gemini-3.7-flash',
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
        ];

        // ---------------------------------------------------------------------------------
        // 1. REWRITE REPLY ENDPOINT (/api/rewrite-reply)
        // ---------------------------------------------------------------------------------
        if (normalizedPath === '/api/rewrite-reply' || body.action === 'rewrite') {
          const { originalMessage, tone, userInstruction, conflictContext } = body;

          if (!originalMessage || typeof originalMessage !== 'string') {
            return new Response(
              JSON.stringify({
                error: 'INVALID_INPUT',
                message: 'پیام اصلی برای بازنویسی وجود ندارد.',
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (!userInstruction || typeof userInstruction !== 'string' || !userInstruction.trim()) {
            return new Response(
              JSON.stringify({
                error: 'INVALID_INSTRUCTION',
                message: 'لطفاً مشخص کن که چطور می‌خواهی پیام تغییر کند.',
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const rewritePrompt = `تو یک دستیار هوشمند و نویسنده پیام‌های انسانی برای کاهش تنش در روابط هستی.
وظیفه تو این است که یک پیام متنی را دقیقاً بر اساس دستور کاربر (مثلاً کوتاه‌تر کردن، خودمونی‌تر کردن، محکم‌تر کردن یا اضافه کردن لحن عذرخواهی) بازنویسی کنی.

قوانین:
1. پیام باید کاملاً طبیعی، صمیمانه و متناسب با چت پیام‌رسان (تلگرام / واتساپ) باشد.
2. از لحن خشک، رباتی، اداری یا کتابی پرهیز کن.
3. دستور کاربر را دقیق اعمال کن.
4. پیام بازنویسی‌شده نباید سرزنش‌گر یا تهاجمی باشد.

متن پیام فعلی:
«${originalMessage.trim()}»

لحن پایه: ${tone || 'مشخص نشده'}
زمینه ماجرا: ${conflictContext || 'اختلاف و نیاز به آشتی'}

دستور کاربر برای تغییر پیام:
«${userInstruction.trim()}»

فقط و فقط یک JSON معتبر به این شکل بازگردان:
{
  "message": "متن بازنویسی شده"
}`;

          let parsedResult = null;
          let lastError = null;

          for (const model of candidateModels) {
            try {
              const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
              const resp = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: rewritePrompt }] }],
                  generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                  },
                }),
              });

              if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(`Model ${model} error: ${resp.status} - ${errText}`);
              }

              const data = await resp.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                let clean = text.trim();
                if (clean.startsWith('```json')) {
                  clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
                } else if (clean.startsWith('```')) {
                  clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
                }
                parsedResult = JSON.parse(clean);
                break;
              }
            } catch (err) {
              lastError = err;
            }
          }

          if (!parsedResult || !parsedResult.message) {
            return new Response(
              JSON.stringify({
                error: 'AI_FAILED',
                message: 'نتونستم پیام رو بسازم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.',
                detail: lastError?.message,
              }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: parsedResult.message,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // ---------------------------------------------------------------------------------
        // 2. SUGGEST REPLIES ENDPOINT (/api/suggest-replies)
        // ---------------------------------------------------------------------------------
        if (normalizedPath === '/api/suggest-replies' || body.action === 'suggest_replies') {
          const {
            story,
            category,
            emotion,
            gender,
            summary,
            trigger,
            commonNeed,
            userEmotion,
            possibleOtherPerspective,
            suggestedAction,
            tone,
          } = body;

          const storyContent = story || summary || '';
          const genderLabel =
            gender === 'female' ? 'دختر (خانم)' : gender === 'male' ? 'پسر (آقا)' : 'مشخص نشده';

          const suggestPrompt = `تو یک نویسنده پیام‌های متنی همدلانه و بسیار طبیعی برای انسان‌ها در موقعیت‌های دلخوری و اختلاف هستی.
هدف تو نوشتن پیام‌هایی است که کاربر واقعاً بتواند آن‌ها را برای طرف مقابل ارسال کند تا تنش کم شود و گفت‌وگوی سالم شروع شود.

قوانین:
1. پیام‌ها باید کاملاً طبیعی، روان و محاوره‌ای باشند؛ مناسب ارسال در تلگرام یا واتساپ.
2. از ادبیات رسمی، کتابی و رباتی اکیداً خودداری کن.
3. طرف مقابل را سرزنش یا متهم نکن و هیچ توهینی به کار نبر.
4. هدف اصلی: کاهش تنش و باز کردن راه یک گفت‌وگوی آرام.

پنج لحن مشخص:
1. calm: متین، آرام، بدون پرخاش یا دفاع، تمرکز بر درک متقابل.
2. intimate: گرم، محبت‌آمیز، یادآوری ارزش رابطه و ابراز علاقه.
3. direct: شفاف، صریح، بدون سرزنش، روشن و محترمانه.
4. emotional: بیان احساسات و آسیب‌پذیری قلبی کاربر بدون متهم کردن طرف مقابل.
5. friendly: خودمانی، سبک، ساده، ملایم و صمیمی.

اطلاعات زمینه اختلاف:
- شرح ماجرا: ${storyContent}
- خلاصه: ${summary || 'مشخص نشده'}
- جرقه دلخوری: ${trigger || 'مشخص نشده'}
- احساس کاربر: ${emotion || userEmotion || 'مشخص نشده'}
- دیدگاه احتمالی طرف مقابل: ${possibleOtherPerspective || 'مشخص نشده'}
- نیاز مشترک: ${commonNeed || 'مشخص نشده'}
- جنسیت گوینده: ${genderLabel}
${tone ? `- لطفاً به‌طور ویژه روی تولید پیام برای لحن «${tone}» تمرکز کن.` : ''}

فقط و فقط یک JSON معتبر مطابق ساختار زیر بازگردان:
{
  "replies": {
    "calm": "پیام آرام",
    "intimate": "پیام صمیمی",
    "direct": "پیام مستقیم",
    "emotional": "پیام احساسی",
    "friendly": "پیام دوستانه"
  }
}`;

          let parsedResult = null;
          let lastError = null;

          for (const model of candidateModels) {
            try {
              const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
              const resp = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: suggestPrompt }] }],
                  generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                  },
                }),
              });

              if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(`Model ${model} error: ${resp.status} - ${errText}`);
              }

              const data = await resp.json();
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                let clean = text.trim();
                if (clean.startsWith('```json')) {
                  clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
                } else if (clean.startsWith('```')) {
                  clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
                }
                parsedResult = JSON.parse(clean);
                break;
              }
            } catch (err) {
              lastError = err;
            }
          }

          if (!parsedResult || !parsedResult.replies) {
            return new Response(
              JSON.stringify({
                error: 'AI_FAILED',
                message: 'نتونستم پیام رو بسازم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.',
                detail: lastError?.message,
              }),
              { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              replies: parsedResult.replies,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // ---------------------------------------------------------------------------------
        // 3. MAIN ANALYSIS ENDPOINT (/api/analyze or fallback POST)
        // ---------------------------------------------------------------------------------
        const { story, category, emotion, gender } = body;

        if (!story || typeof story !== 'string' || story.trim().length < 20) {
          return new Response(
            JSON.stringify({
              error: 'INVALID_INPUT',
              message: 'متن ماجرا باید حداقل ۲۰ کاراکتر داشته باشد.',
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const genderLabel =
          gender === 'female'
            ? 'دختر (خانم)'
            : gender === 'male'
            ? 'پسر (آقا)'
            : 'مشخص نشده';

        const systemInstruction = `تو یک میانجی بی‌طرف و مشاور همدل برای حل اختلافات انسانی هستی.
هدف تو پیدا کردن مقصر نیست.
هدف تو کمک به کاربر برای فهمیدن احساسات، نیازها، سوءتفاهم‌ها و عوامل تشدیدکننده اختلاف است.

اصول کلیدی:
1. بی‌طرفی مطلق: حق را به هیچ طرفی نده؛ هر دو دیدگاه را محترم بشمار.
2. اعتباربخشی به احساسات: احساسات هر دو طرف را معتبر و قابل درک بدان.
3. عدم قطعیت در تفسیر ذهن طرف مقابل: همیشه از عبارات احتیاطی مثل «احتمالاً»، «ممکن است» و «به نظر می‌رسد» برای تحلیل طرف مقابل استفاده کن.
4. تمرکز بر نیازهای اساسی: نیازهایی مثل احترام، امنیت عاطفی، شنیده شدن، شفافیت یا توجه.
5. بررسی منصفانه رفتارها: برای هر دو طرف هم نقاط قابل درک و هم رفتارهای تنش‌زا را مشخص کن.
6. تایم‌لاین منطقی تشدید: تفکیک دقیق ۴ گام (اتفاق، برداشت، واکنش، تشدید).
7. راهکار عملی و بدون سرزنش برای گفتگو و آشتی.
8. هدف، کاهش تنش و شروع گفت‌وگوی سالم است.
9. جنسیت کاربر را در تنظیم دقیق لحن پیام‌های پیشنهادی (از نظر ادب فارسی و پویایی‌های روان‌شناختی) لحاظ کن.

فقط و فقط یک JSON معتبر مطابق ساختار زیر بازگردان:
{
  "summary": "خلاصه کوتاه ماجرا در یک یا دو جمله",
  "mainEvent": "اتفاق اصلی و ریشه تنش",
  "userEmotion": "احساسات احتمالی کاربر",
  "possibleOtherPerspective": "احتمالاً طرف مقابل چه برداشتی داشته است",
  "trigger": "رویداد یا کلمه محرک آغازگر دلخوری",
  "escalationSteps": [
    { "step": 1, "title": "عنوان گام ۱", "description": "توضیح اتفاق اولیه" },
    { "step": 2, "title": "عنوان گام ۲", "description": "توضیح برداشت طرفین" },
    { "step": 3, "title": "عنوان گام ۳", "description": "توضیح واکنش کلامی یا رفتاری" },
    { "step": 4, "title": "عنوان گام ۴", "description": "توضیح تشدید تنش" }
  ],
  "userBehavior": {
    "understandable": "بخش قابل درک از رفتار کاربر",
    "improvable": "بخشی که می‌تواند بهتر باشد",
    "escalationRisk": "واکنشی که باعث تنش شد"
  },
  "otherBehavior": {
    "understandable": "بخش قابل درک از شرایط طرف مقابل",
    "improvable": "رفتاری که می‌توانست بهتر باشد",
    "escalationRisk": "رفتار یا پاسخی که سوءتفاهم ساخت"
  },
  "commonNeed": "نیاز عاطفی یا انسانی مشترک طرفین",
  "suggestedAction": "راهکار عملی و ملایم برای شروع گفتگو",
  "suggestedResponses": {
    "calm": "پیام با لحن متین و آرام",
    "intimate": "پیام با لحن صمیمی و محبت‌آمیز",
    "direct": "پیام با لحن مستقیم و شفاف",
    "emotional": "پیام با لحن احساسی و صادقانه",
    "friendly": "پیام با لحن دوستانه و سبک"
  }
}`;

        const promptText = `${systemInstruction}

داستان ماجرا:
${story.trim()}

جنسیت کاربر (گوینده داستان):
${genderLabel}

موضوع:
${category || 'مشخص نشده'}

احساس ثبت‌شده:
${emotion || 'مشخص نشده'}

لطفاً خروجی را دقیقاً در قالب JSON معتبر تولید کن.`;

        let parsedResult = null;
        let lastError = null;

        for (const model of candidateModels) {
          try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const resp = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.4,
                },
              }),
            });

            if (!resp.ok) {
              const errText = await resp.text();
              throw new Error(`Model ${model} error: ${resp.status} - ${errText}`);
            }

            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              let clean = text.trim();
              if (clean.startsWith('```json')) {
                clean = clean.replace(/^```json\s*/, '').replace(/```\s*$/, '');
              } else if (clean.startsWith('```')) {
                clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
              }
              parsedResult = JSON.parse(clean);
              break;
            }
          } catch (err) {
            lastError = err;
          }
        }

        if (!parsedResult) {
          return new Response(
            JSON.stringify({
              error: 'AI_FAILED',
              message: 'خطا در دریافت پاسخ از هوش مصنوعی جمینای.',
              detail: lastError?.message,
            }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: parsedResult,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: 'SERVER_ERROR',
            message: err?.message || 'خطای غیرمنتظره در سرور.',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(JSON.stringify({ error: 'NOT_FOUND' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
