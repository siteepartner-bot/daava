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

/**
 * Real Gemini Conflict Analyzer via Secure Server-Side Endpoint
 */
export async function analyzeConflict(input: ConflictInput): Promise<ConflictAnalysisResult> {
  const text = input.storyText.trim();
  const category: ConflictCategory = input.category || detectCategoryFromText(text);
  const emotion: EmotionType = input.emotion || detectEmotionFromText(text);

  let response: Response;
  try {
    response = await fetch('/api/analyze', {
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
  } catch (netErr: any) {
    console.error('Network error during analysis request:', netErr);
    throw new Error('عدم دسترسی به اینترنت یا قطع ارتباط با سرور.');
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
