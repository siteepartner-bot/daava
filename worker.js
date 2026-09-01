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

    // Health check endpoint
    if (request.method === 'GET' && (url.pathname === '/api/health' || url.pathname === '/')) {
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

    // Couple Session: GET /api/couple/:id
    if (request.method === 'GET' && url.pathname.startsWith('/api/couple/')) {
      const parts = url.pathname.split('/');
      const sessionIdOrCode = parts[parts.length - 1];
      const authHeader = request.headers.get('Authorization') || '';
      const token = (authHeader.replace(/^Bearer\s+/i, '') || url.searchParams.get('token') || '').trim();

      const lookupKey = sessionIdOrCode.trim().toUpperCase();
      const sessionId = workerJoinCodes.get(lookupKey) || sessionIdOrCode.trim();
      const session = workerCoupleSessions.get(sessionId);

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
        const pathname = url.pathname;
        const body = await request.json().catch(() => ({}));

        // Couple Session: POST /api/couple/create
        if (pathname === '/api/couple/create') {
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

          workerCoupleSessions.set(sessionId, session);
          workerJoinCodes.set(joinCode.toUpperCase(), sessionId);

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

        // Couple Session: POST /api/couple/join
        if (pathname === '/api/couple/join') {
          const { joinCodeOrId, name } = body;
          if (!joinCodeOrId) {
            return new Response(
              JSON.stringify({ error: 'INVALID_CODE', message: 'کد دعوت نامعتبر است.' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const lookupKey = joinCodeOrId.trim().toUpperCase();
          const sessionId = workerJoinCodes.get(lookupKey) || joinCodeOrId.trim();
          const session = workerCoupleSessions.get(sessionId);

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

        // Couple Session: POST /api/couple/:id/submit
        if (pathname.startsWith('/api/couple/') && pathname.endsWith('/submit')) {
          const parts = pathname.split('/');
          const sessionIdOrCode = parts[parts.length - 2];
          const { token, role, name, story, category, emotion, gender } = body;

          if (!story || typeof story !== 'string' || story.trim().length < 20) {
            return new Response(
              JSON.stringify({ error: 'INVALID_STORY', message: 'یکم بیشتر برامون تعریف کن تا بهتر بفهمیم 🤍' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const lookupKey = sessionIdOrCode.trim().toUpperCase();
          const sessionId = workerJoinCodes.get(lookupKey) || sessionIdOrCode.trim();
          const session = workerCoupleSessions.get(sessionId);

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

          return new Response(
            JSON.stringify({
              success: true,
              session: sanitizeSessionForPublic(session, targetRole),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Couple Session: POST /api/couple/:id/leave
        if (pathname.startsWith('/api/couple/') && pathname.endsWith('/leave')) {
          const parts = pathname.split('/');
          const sessionIdOrCode = parts[parts.length - 2];
          const lookupKey = sessionIdOrCode.trim().toUpperCase();
          const sessionId = workerJoinCodes.get(lookupKey) || sessionIdOrCode.trim();

          const session = workerCoupleSessions.get(sessionId);
          if (session) {
            workerJoinCodes.delete(session.joinCode.toUpperCase());
            workerCoupleSessions.delete(sessionId);
          }

          return new Response(
            JSON.stringify({ success: true, message: 'از جلسه خارج شدید.' }),
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
          'gemini-3.5-flash',
          'gemini-3.6-flash',
          'gemini-3.5-flash-lite',
        ];

        // ---------------------------------------------------------------------------------
        // 1. REWRITE REPLY ENDPOINT (/api/rewrite-reply)
        // ---------------------------------------------------------------------------------
        if (pathname === '/api/rewrite-reply' || body.action === 'rewrite') {
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
        if (pathname === '/api/suggest-replies' || body.action === 'suggest_replies') {
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
