interface Env {
  GEMINI_API_KEY?: string;
}

type PagesFunction<T = unknown> = (context: {
  request: Request;
  env: T;
  next?: () => Promise<Response>;
  data?: Record<string, any>;
}) => Promise<Response> | Response;

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const apiKey =
      context.env?.GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY_MISSING',
          message: 'کلید GEMINI_API_KEY در تنظیمات Environment Variables کلودفلر یافت نشد.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = (await context.request.json().catch(() => ({}))) as any;
    const { story, category, emotion, gender } = body;

    if (!story || typeof story !== 'string' || story.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_INPUT',
          message: 'برای اینکه هوش مصنوعی بتونه دقیق تحلیلش کنه، لطفاً کمی بیشتر توضیح بده (حداقل ۱۰ کاراکتر) 🤍',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
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

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-2.5-flash'];
    let parsedResult: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
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
          throw new Error(`Model ${model} returned HTTP ${resp.status}: ${errText}`);
        }

        const data = (await resp.json()) as any;
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
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!parsedResult) {
      return new Response(
        JSON.stringify({
          error: 'AI_ANALYSIS_FAILED',
          message: 'خطا در ارتباط با هوش مصنوعی جمینای در کلودفلر.',
          detail: lastError?.message,
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedResult,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: 'SERVER_ERROR',
        message: err?.message || 'خطای غیرمنتظره در سرور.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
