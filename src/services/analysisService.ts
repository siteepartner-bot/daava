import {
  ConflictInput,
  ConflictAnalysisResult,
  ConflictCategory,
  EmotionType,
  ResponseTone,
  TimelineStep,
} from '../types';

/**
 * Format current date in Persian readable format
 */
export function getPersianFormattedDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  };
  try {
    return new Intl.DateTimeFormat('fa-IR', options).format(now);
  } catch {
    return 'امروز';
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

/**
 * Real Gemini Conflict Analyzer via Secure Server-Side Endpoint
 */
export async function analyzeConflict(input: ConflictInput): Promise<ConflictAnalysisResult> {
  const text = input.storyText.trim();
  const category: ConflictCategory = input.category || detectCategoryFromText(text);
  const emotion: EmotionType = input.emotion || detectEmotionFromText(text);

  const { primary: primaryEndpoint, fallback: fallbackEndpoint } = getApiEndpoints('/api/analyze');

  let response: Response | null = null;
  let lastError: any = null;

  // Try primary endpoint first
  try {
    response = await fetch(primaryEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        story: text,
        category,
        emotion,
        gender: input.gender || null,
      }),
    });
  } catch (err) {
    lastError = err;
  }

  // If primary failed and fallback exists, try fallback
  if ((!response || !response.ok) && fallbackEndpoint && fallbackEndpoint !== primaryEndpoint) {
    try {
      const fallbackResp = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story: text,
          category,
          emotion,
          gender: input.gender || null,
        }),
      });
      if (fallbackResp.ok) {
        response = fallbackResp;
      }
    } catch {
      // Keep original response or error
    }
  }

  if (!response) {
    console.error('Network error during analysis request:', lastError);
    throw new Error('عدم دسترسی به اینترنت یا قطع ارتباط با سرور هوش مصنوعی.');
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignored
    }
    const errMsg = errorData.message || 'خطا در دریافت تحلیل از سرور هوش مصنوعی.';
    console.error('API responded with error:', response.status, errorData);
    throw new Error(errMsg);
  }

  const resultPayload = await response.json();
  if (!resultPayload.success || !resultPayload.data) {
    throw new Error('ساختار پاسخ هوش مصنوعی نامعتبر است.');
  }

  const geminiData = resultPayload.data;

  const id = 'ar-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const timestamp = Date.now();
  const date = getPersianFormattedDate();

  // Normalize escalation steps
  const defaultIcons = ['MessageSquareOff', 'Brain', 'Zap', 'Flame'];
  const rawSteps = Array.isArray(geminiData.escalationSteps) ? geminiData.escalationSteps : [];
  
  const escalation: TimelineStep[] = [
    {
      step: 1,
      title: rawSteps[0]?.title || 'اتفاق',
      description: rawSteps[0]?.description || geminiData.trigger || 'رویداد اولیه آغازگر بحث',
      icon: defaultIcons[0],
    },
    {
      step: 2,
      title: rawSteps[1]?.title || 'برداشت',
      description: rawSteps[1]?.description || geminiData.possibleOtherPerspective || 'تفاوت در برداشت و تلقی از پیام',
      icon: defaultIcons[1],
    },
    {
      step: 3,
      title: rawSteps[2]?.title || 'واکنش',
      description: rawSteps[2]?.description || 'واکنش تدافعی یا دلخورانه به اتفاق رخ داده',
      icon: defaultIcons[2],
    },
    {
      step: 4,
      title: rawSteps[3]?.title || 'تشدید دعوا',
      description: rawSteps[3]?.description || 'گسترش اختلاف به موضوعات کلی‌تر و ایجاد فاصله',
      icon: defaultIcons[3],
    },
  ];

  // Normalize suggested responses
  const suggestedResponses: Record<ResponseTone, string> = {
    calm:
      geminiData.suggestedResponses?.calm ||
      'من نمی‌خوام بحثمون بیشتر بشه. فقط می‌خوام بفهمم چی ناراحتت کرده و خودمم بتونم با آرامش توضیح بدم.',
    intimate:
      geminiData.suggestedResponses?.intimate ||
      'من واقعاً دوستت دارم و رابطه‌مون برام باارزشه. بیا با هم بشینیم و با آرامش و محبت حرف بزنیم.',
    direct:
      geminiData.suggestedResponses?.direct ||
      'برای من مهمه که در جریان شرایط باشم تا سوءتفاهم پیش نیاد. دنبال مقصر نیستم، فقط شفافیت می‌خوام.',
    emotional:
      geminiData.suggestedResponses?.emotional ||
      'راستش وقتی اون اتفاق افتاد حس تنهایی و دلشکستگی کردم. دوست داشتم باهات حرف بزنم تا خیالم راحت بشه.',
    friendly:
      geminiData.suggestedResponses?.friendly ||
      'می‌دونم روز شلوغی برای هر دوتامون بوده. بیا بحث رو کنار بذاریم و با مهربانی با هم گپ بزنیم.',
  };

  const normalizedResult: ConflictAnalysisResult = {
    id,
    timestamp,
    date,
    category,
    emotion,
    storySummary: geminiData.summary || text.slice(0, 60) + '...',
    mainEvent: geminiData.mainEvent || geminiData.summary || 'اتفاق اصلی بررسی شد.',
    userEmotion: geminiData.userEmotion || 'احساسات شما بررسی شد.',
    possibleOtherPerspective: geminiData.possibleOtherPerspective || 'دیدگاه احتمالی طرف مقابل بررسی شد.',
    trigger: geminiData.trigger || 'رویداد اولیه آغازگر بحث',
    escalation,
    userBehavior: {
      understandable:
        geminiData.userBehavior?.understandable ||
        'نیاز به احترام، شفافیت و داشتن حس امنیت در رابطه کاملاً طبیعی و موجه است.',
      improvable:
        geminiData.userBehavior?.improvable ||
        'بیان آرام خواسته‌ها در زمان مناسب و پرهیز از قضاوت زودهنگام.',
      escalationRisk:
        geminiData.userBehavior?.escalationRisk ||
        'نسبت دادن نیت منفی به طرف مقابل قبل از شنیدن توضیحات کامل او.',
    },
    otherBehavior: {
      understandable:
        geminiData.otherBehavior?.understandable ||
        'نیاز به تمرکز روی کار یا زمان خواستن برای پردازش احساسات در شرایط شلوغ.',
      improvable:
        geminiData.otherBehavior?.improvable ||
        'اطلاع‌رسانی کوتاه به طرف مقابل برای جلوگیری از ایجاد ابهام و نگرانی.',
      escalationRisk:
        geminiData.otherBehavior?.escalationRisk ||
        'پاسخ تدافعی دادن به دلخوری‌ها به جای شنیدن نیاز نهفته در پشت کلام.',
    },
    commonNeed:
      geminiData.commonNeed ||
      'هر دو نفر می‌خواستید احساس کنید برای طرف مقابل مهم، دوست‌داشتنی و قابل اعتماد هستید و آرامش در رابطه حفظ شود.',
    suggestedResponses,
    suggestedAction:
      geminiData.suggestedAction ||
      'قبل از شروع صحبت، اجازه دهید تب‌وتاب احساسی آرام شود و مکالمه را با همدلی آغاز کنید.',
  };

  return normalizedResult;
}

export interface SuggestRepliesParams {
  story?: string;
  category?: ConflictCategory | null;
  emotion?: EmotionType | null;
  gender?: string | null;
  summary?: string;
  trigger?: string;
  commonNeed?: string;
  userEmotion?: string;
  possibleOtherPerspective?: string;
  suggestedAction?: string;
  tone?: ResponseTone;
}

/**
 * Step 4: Suggest 5 responses or regenerate 1 response using Gemini AI
 */
export async function suggestReplies(params: SuggestRepliesParams): Promise<Record<ResponseTone, string>> {
  const { primary, fallback } = getApiEndpoints('/api/suggest-replies');

  let response: Response | null = null;
  let lastError: any = null;

  try {
    response = await fetch(primary, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    lastError = err;
  }

  if ((!response || !response.ok) && fallback && fallback !== primary) {
    try {
      const fallbackResp = await fetch(fallback, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (fallbackResp.ok) {
        response = fallbackResp;
      }
    } catch {
      // Ignored
    }
  }

  if (!response) {
    throw new Error('عدم دسترسی به اینترنت یا قطع ارتباط با سرور.');
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignored
    }
    throw new Error(errorData.message || 'نتونستم پیام رو بسازم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.');
  }

  const result = await response.json();
  if (!result.success || !result.replies) {
    throw new Error('پاسخ دریافت شده از هوش مصنوعی نامعتبر است.');
  }

  return result.replies;
}

/**
 * Step 4: Rewrite single reply based on user instruction using Gemini AI
 */
export async function rewriteReply(
  originalMessage: string,
  tone: ResponseTone,
  userInstruction: string,
  conflictContext?: string
): Promise<string> {
  const { primary, fallback } = getApiEndpoints('/api/rewrite-reply');

  let response: Response | null = null;
  let lastError: any = null;

  const payload = {
    originalMessage,
    tone,
    userInstruction,
    conflictContext,
  };

  try {
    response = await fetch(primary, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    lastError = err;
  }

  if ((!response || !response.ok) && fallback && fallback !== primary) {
    try {
      const fallbackResp = await fetch(fallback, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (fallbackResp.ok) {
        response = fallbackResp;
      }
    } catch {
      // Ignored
    }
  }

  if (!response) {
    throw new Error('عدم دسترسی به اینترنت یا سرور.');
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignored
    }
    throw new Error(errorData.message || 'نتونستم پیام رو بسازم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.');
  }

  const result = await response.json();
  if (!result.success || !result.message) {
    throw new Error('پاسخ نامعتبر دریافت شد.');
  }

  return result.message;
}

function detectCategoryFromText(text: string): ConflictCategory {
  const t = text.toLowerCase();
  if (t.includes('پیام') || t.includes('زنگ') || t.includes('حرف') || t.includes('گفتم') || t.includes('جواب')) {
    return 'ارتباط';
  }
  if (t.includes('پنهان') || t.includes('دروغ') || t.includes('شک') || t.includes('اعتماد')) {
    return 'اعتماد';
  }
  if (t.includes('مامان') || t.includes('بابا') || t.includes('خانواده') || t.includes('خواهر') || t.includes('برادر')) {
    return 'خانواده';
  }
  if (t.includes('دوست') || t.includes('رفیق') || t.includes('اکیپ')) {
    return 'دوستی';
  }
  if (t.includes('قصد') || t.includes('برداشت') || t.includes('منظور') || t.includes('اشتباه')) {
    return 'سوءتفاهم';
  }
  return 'رابطه';
}

function detectEmotionFromText(text: string): EmotionType {
  const t = text.toLowerCase();
  if (t.includes('داد') || t.includes('عصبانی') || t.includes('فریاد') || t.includes('خشم')) {
    return 'عصبانی';
  }
  if (t.includes('گریه') || t.includes('بغض') || t.includes('غم') || t.includes('دلشکسته')) {
    return 'ناراحت';
  }
  if (t.includes('امید') || t.includes('خسته') || t.includes('بی‌فایده') || t.includes('ناامید')) {
    return 'ناامید';
  }
  if (t.includes('استرس') || t.includes('نگران') || t.includes('ترس') || t.includes('اضطراب')) {
    return 'مضطرب';
  }
  if (t.includes('نمی‌دونم') || t.includes('گیج') || t.includes('تعجب') || t.includes('چرا')) {
    return 'گیج';
  }
  return 'دلتنگ';
}
