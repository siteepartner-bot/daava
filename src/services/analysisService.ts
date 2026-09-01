import {
  ConflictInput,
  ConflictAnalysisResult,
  ConflictCategory,
  EmotionType,
  ResponseTone,
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
    const formatted = new Intl.DateTimeFormat('fa-IR', options).format(now);
    return formatted;
  } catch {
    return 'امروز';
  }
}

/**
 * Intelligent Mock Conflict Analyzer
 * Analyzes story text, category, and emotion, and generates a deep, non-judgmental,
 * empathetic breakdown of the conflict.
 * 
 * NOTE: In Phase 3, this function interface can seamlessly switch to Gemini API
 * without altering any UI components.
 */
export async function analyzeConflict(input: ConflictInput): Promise<ConflictAnalysisResult> {
  // Simulate network/AI processing delay (2.2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2200));

  const text = input.storyText.trim();
  const category: ConflictCategory = input.category || detectCategoryFromText(text);
  const emotion: EmotionType = input.emotion || detectEmotionFromText(text);

  const id = 'ar-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const timestamp = Date.now();
  const date = getPersianFormattedDate();

  // Dynamic tailored generators based on inputs
  const result: ConflictAnalysisResult = generateTailoredAnalysis({
    id,
    timestamp,
    date,
    text,
    category,
    emotion,
    mode: input.mode,
  });

  return result;
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

interface GeneratorParams {
  id: string;
  timestamp: number;
  date: string;
  text: string;
  category: ConflictCategory;
  emotion: EmotionType;
  mode: 'solo' | 'couple';
}

function generateTailoredAnalysis({
  id,
  timestamp,
  date,
  text,
  category,
  emotion,
}: GeneratorParams): ConflictAnalysisResult {
  // Extract a brief core story summary
  let storySummary = 'اختلاف پیرامون نحوه ارتباط و هماهنگی انتظارات متقابل';
  if (text.length > 50) {
    storySummary = text.slice(0, 60) + '...';
  } else if (text.length > 0) {
    storySummary = text;
  }

  // 1. 🔴 اتفاق اصلی (mainEvent)
  let mainEvent = '';
  switch (category) {
    case 'سوءتفاهم':
      mainEvent =
        'به نظر می‌رسد یک پیام، تاخیر یا رفتاری که نیت منفی پشت آن نبوده، با توجه به پیش‌زمینه‌های ذهنی، به عنوان بی‌توجهی یا کم‌ارزش شمرده شدن تفسیر شده است.';
      break;
    case 'اعتماد':
      mainEvent =
        'اختلاف حول محور شفافیت و اطمینان خاطر رخ داده است؛ جایی که عدم وضوح در رفتار یا اطلاعات، حس ناامنی یا پنهان‌کاری را در طرفین بیدار کرده است.';
      break;
    case 'خانواده':
      mainEvent =
        'مرزهای میان تصمیم‌گیری‌های دونفره و تعاملات خانوادگی دچار چالش شده و این احساس ایجاد شده که اولویت‌بندی‌ها هماهنگ نیستند.';
      break;
    case 'دوستی':
      mainEvent =
        'تغییر در سطح توجه، وقت‌گذاشتن یا انتظارات از رفاقت باعث شده حس کنید تعادل و مرام گذشته در این رابطه کم‌رنگ شده است.';
      break;
    case 'ارتباط':
      mainEvent =
        'نحوه و زمان بیان یک خواسته به گونه‌ای بوده که به جای شنیده شدن اصل حرف، لحن یا واکنش اولیه توجه‌ها را به سمت بحث و جبهه‌گیری برده است.';
      break;
    case 'رابطه':
    default:
      mainEvent =
        'اختلاف از جایی آغاز شده که یکی از طرفین نیاز به توجه، درک یا همراهی بیشتری داشته، اما این پیام با شیوه پاسخ‌گویی متفاوتی از سوی طرف مقابل مواجه شده است.';
      break;
  }

  // 2. 💭 چیزی که احتمالاً تو احساس کردی (userEmotion)
  let userPerspective = '';
  switch (emotion) {
    case 'عصبانی':
      userPerspective =
        'احساس کردی حقت نادیده گرفته شده و مرزهایت رعایت نشده است. خشم تو در واقع یک واکنش دفاعی بوده تا از ارزش‌های شخصی‌ات محافظت کنی و صدایت شنیده شود.';
      break;
    case 'ناامید':
      userPerspective =
        'احساس کردی تلاش‌هایت برای بهبود رابطه به نتیجه نمی‌رسد یا انتظارات منطقی‌ات مکرراً برآورده نمی‌شود، که منجر به دلسردی و خستگی روحی شده است.';
      break;
    case 'مضطرب':
      userPerspective =
        'احساس ناامنی و نگرانی از آینده رابطه یا ترس از به وجود آمدن فاصله و قهر طولانی‌مدت، باعث شده ذهنت مدام سناریوهای منفی را مرور کند.';
      break;
    case 'گیج':
      userPerspective =
        'احساس کردی رفتار طرف مقابل برایت غیرمنتظره و غیرمنطقی است و نمی‌توانی دلیل واقعی تغییر لحن یا سردی ناگهانی او را درک کنی.';
      break;
    case 'دلتنگ':
      userPerspective =
        'بیش از هر چیز دلت برای گرما، خنده‌ها و صمیمیت روزهای خوب تنگ شده و ناراحتی‌ات بیشتر فریادی برای بازگشت نزدیکی عاطفی است تا جنگیدن.';
      break;
    case 'ناراحت':
    default:
      userPerspective =
        'احساس نادیده گرفته شدن، کم‌ارزش شمرده شدن احساساتت و این حس دردناک که شاید برای طرف مقابل آن‌قدر که او برای تو مهم است، در اولویت نیستی.';
      break;
  }

  // 3. 🧩 چیزی که ممکنه طرف مقابل برداشت کرده باشه (possibleOtherPerspective)
  let partnerPerspective = '';
  switch (category) {
    case 'اعتماد':
      partnerPerspective =
        'احتمالاً حس کرده بدون دلیل کافی مورد قضاوت و بی‌اعتمادی قرار گرفته و این موضوع باعث شده به جای توضیح دادن، در خود فرو برود یا لحن تندی بگیرد.';
      break;
    case 'خانواده':
      partnerPerspective =
        'احتمالاً احساس کرده در یک دوراهی سخت میان رضایت خانواده و همراهی با تو گیر افتاده و فشاری بیش از توانش را تحمل می‌کند.';
      break;
    case 'سوءتفاهم':
      partnerPerspective =
        'احتمالاً فکر کرده منظورش کاملاً واضح بوده یا تصور کرده تو از پیش او را قضاوت کرده‌ای و به قصد و نیت واقعی‌اش اهمیتی نداده‌ای.';
      break;
    default:
      partnerPerspective =
        'احتمالاً درگیر مشغله، خستگی یا فشارهای روانی خاص خودش بوده و پیام یا واکنش تو را به عنوان سرزنش، کنترل‌گری یا ناسپاسی نسبت به زحماتش تعبیر کرده است.';
      break;
  }

  // 4. ⚡ تایم‌لاین تشدید (Timeline: اتفاق -> برداشت -> واکنش -> تشدید)
  const escalation = [
    {
      step: 1,
      title: 'اتفاق',
      description: 'وقوع یک رویداد اولیه، تاخیر، سکوت یا گفتن جمله‌ای در شرایط خستگی یا ناهمزمانی.',
      icon: 'MessageSquareOff',
    },
    {
      step: 2,
      title: 'برداشت',
      description: 'تو حس کردی مورد بی‌توجهی قرار گرفتی، و طرف مقابل حس کرد مورد انتقاد و سرزنش ناعادلانه واقع شده است.',
      icon: 'Brain',
    },
    {
      step: 3,
      title: 'واکنش',
      description: 'ورود لحن‌های تدافعی یا پیام‌های کوتاه و سرد که تمرکز را از حل موضوع اصلی به دفاع از خود تغییر داد.',
      icon: 'Zap',
    },
    {
      step: 4,
      title: 'تشدید دعوا',
      description: 'کشیده شدن بحث از یک ماجرای خاص به موضوعات گذشته، ایجاد حس فاصله و سکوت سنگین میان دو طرف.',
      icon: 'Flame',
    },
  ];

  // 5. ⚖️ بررسی منصفانه (رفتار کاربر و طرف مقابل با ۳ وضعیت)
  const userBehavior = {
    understandable:
      'نیاز به احترام، شفافیت و داشتن احساس امنیت و آرامش در رابطه کاملاً به‌حق و طبیعی است.',
    improvable:
      'بیان شفاف خواسته و ابراز مستقیم احساسات در زمان آرامش، بدون استفاده از تعمیم‌های کلی («تو همیشه...» یا «هیچ‌وقت...»).',
    escalationRisk:
      'نسبت دادن نیت منفی به طرف مقابل قبل از شنیدن توضیحات کامل او، که او را به جبهه‌گیری وادار می‌کند.',
  };

  const otherBehavior = {
    understandable:
      'نیاز به فضای شخصی، تمرکز روی کار یا زمان خواستن برای پردازش احساسات در شرایط شلوغ و پرفشار.',
    improvable:
      'یک پیام کوتاه و محترمانه جهت اطلاع‌رسانی («الان درگیرم، سر فرصت حتماً صحبت می‌کنیم») که مانع از ابهام و نگرانی شود.',
    escalationRisk:
      'پاسخ تدافعی دادن به دلخوری‌ها یا نادیده گرفتن احساسات طرف مقابل به جای شنیدن نیاز نهفته در پشت کلام او.',
  };

  // 6. 💡 نیاز مشترک (commonNeed)
  const commonNeed =
    'هر دو نفر احتمالاً می‌خواستید احساس کنید برای طرف مقابل مهم، معتبر و باارزش هستید و دوست دارید رابطه‌تان در محیطی امن و بدون تنش ادامه پیدا کند.';

  // 7. پیشنهادات پیام با ۵ لحن
  const suggestedResponses: Record<ResponseTone, string> = {
    calm: 'من نمی‌خوام بحثمون بیشتر بشه. دوست دارم بدون دعوا بفهمم چی ناراحتت کرده و خودمم توضیح بدم چه حسی داشتم.',
    intimate:
      'من واقعاً دوستت دارم و رابطه قشنگمون برام باارزشه. وقتی ازت بی‌خبر می‌مونم حس دلتنگی و تنهایی می‌کنم، ولی می‌دونم تو هم سرت شلوغ بوده. بیا سر فرصت با آرامش با هم چای بخوریم و گپ بزنیم.',
    direct:
      'برای من مهمه که در جریان شرایط همدیگه باشیم تا سوءتفاهم پیش نیاد. اگر مشغله داری، یک پیام کوتاه هم کافیه. من دنبال مقصر نیستم، فقط می‌خوام با هم هماهنگ‌تر باشیم.',
    emotional:
      'راستش وقتی اون اتفاق افتاد حس کردم مثل قبل برات اولویت ندارم و این موضوع خیلی دلم رو شکست. دوست دارم باهات حرف بزنم تا خیالم از رابطه‌مون راحت بشه.',
    friendly:
      'می‌دونم روز شلوغی برای هر دوتامون بوده و شاید لحنمون در اون لحظه مناسب نبود. بیا بحث رو کنار بذاریم و با آرامش با هم صحبت کنیم.',
  };

  const suggestedAction =
    'قبل از شروع مکالمه، چند دقیقه به خودتان زمان بدهید تا احساسات شدید فروکش کند. هنگام صحبت، تمرکز را روی احساس خود («من حس کردم...») بگذارید نه سرزنش طرف مقابل («تو کردی...»).';

  return {
    id,
    timestamp,
    date,
    category,
    emotion,
    storySummary,
    mainEvent,
    userEmotion: userPerspective,
    possibleOtherPerspective: partnerPerspective,
    trigger: 'وقوع رویداد اولیه و سوءبرداشت از نیت طرفین',
    escalation,
    userBehavior,
    otherBehavior,
    commonNeed,
    suggestedResponses,
    suggestedAction,
  };
}
