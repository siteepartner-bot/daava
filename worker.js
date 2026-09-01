/**
 * Cloudflare Worker for Gemini Conflict Analyzer
 * 
 * Supports:
 * - POST /api/analyze (یا POST /) -> تحلیل کامل دعوا
 * - POST /api/suggest-replies -> تولید ۵ لحن پیام یا بازتولید یک لحن
 * - POST /api/rewrite-reply -> بازنویسی پیام بر اساس دستور کاربر
 */

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

    if (request.method === 'POST') {
      try {
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

        const body = await request.json().catch(() => ({}));
        const pathname = url.pathname;

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
