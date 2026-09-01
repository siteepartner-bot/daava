import {
  ConflictAnalysisResult,
  ConflictCategory,
  EmotionType,
  SavedConflictRecord,
  ResponseTone,
} from '../types';

export const SAMPLE_STORIES = [
  {
    title: 'دیر جواب دادن به پیام‌ها',
    category: 'سوءتفاهم' as ConflictCategory,
    emotion: 'ناراحت' as EmotionType,
    text: 'از صبح منتظر بودم جوابم رو بده، ولی چند ساعت خبری نشد در حالی که آنلاین بود. وقتی پیام داد عصبانی شدم و گفتم اصلاً برات مهم نیستم، اونم گفت همیشه دنبال بهانه‌ای و مکالمه قطع شد.',
  },
  {
    title: 'فراموشی یک قول مشترک',
    category: 'رابطه' as ConflictCategory,
    emotion: 'ناامید' as EmotionType,
    text: 'قرار بود آخر هفته با هم بریم بیرون، ولی برنامه‌اش رو با دوستاش هماهنگ کرد و گفت یادش رفته بود. وقتی اعتراض کردم گفت تو همش محدودم می‌کنی و قدر کارهام رو نمی‌دونی.',
  },
  {
    title: 'دخالت در تصمیم‌گیری‌های شخصی',
    category: 'خانواده' as ConflictCategory,
    emotion: 'عصبانی' as EmotionType,
    text: 'در مورد یک تصمیم کاری با خانواده‌اش صحبت کرده بود بدون اینکه اول به من بگه. حس کردم به من اعتماد نداره و نظرم براش ارزشی نداره.',
  },
];

export const CATEGORIES: { label: ConflictCategory; description: string; emoji: string }[] = [
  { label: 'رابطه', description: 'مسائل عاطفی و تعهد', emoji: '❤️' },
  { label: 'دوستی', description: 'روابط دوستانه و رفاقت', emoji: '🤝' },
  { label: 'خانواده', description: 'خانواده و نزدیکان', emoji: '🏡' },
  { label: 'اعتماد', description: 'صداقت، تعهد و اطمینان خاطر', emoji: '🛡️' },
  { label: 'سوءتفاهم', description: 'برداشت‌های متفاوت از یک حرف', emoji: '💭' },
  { label: 'ارتباط', description: 'نحوه گفت‌وگو و بیان احساسات', emoji: '💬' },
];

export const EMOTIONS: { label: EmotionType; colorClass: string; emoji: string }[] = [
  { label: 'عصبانی', colorClass: 'bg-rose-50 text-rose-700 border-rose-200', emoji: '🔥' },
  { label: 'ناراحت', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', emoji: '💧' },
  { label: 'ناامید', colorClass: 'bg-slate-100 text-slate-700 border-slate-300', emoji: '🍂' },
  { label: 'مضطرب', colorClass: 'bg-teal-50 text-teal-700 border-teal-200', emoji: '⚡' },
  { label: 'گیج', colorClass: 'bg-amber-50 text-amber-700 border-amber-200', emoji: '🌀' },
  { label: 'دلتنگ', colorClass: 'bg-purple-50 text-purple-700 border-purple-200', emoji: '✨' },
];

export const TONE_LABELS: Record<ResponseTone, { label: string; emoji: string; desc: string }> = {
  intimate: { label: 'صمیمی', emoji: '❤️', desc: 'گرم، پذیرنده و با ابراز علاقه' },
  calm: { label: 'آروم', emoji: '😌', desc: 'متین، متعادل و بدون تنش' },
  direct: { label: 'مستقیم', emoji: '🗣️', desc: 'شفاف، محترمانه و دقیق' },
  emotional: { label: 'احساسی', emoji: '🥺', desc: 'آسیب‌پذیر، از صمیم قلب و صادقانه' },
  friendly: { label: 'دوستانه', emoji: '🙂', desc: 'سبک، همدلانه و ملایم' },
};

export const DEFAULT_ANALYSIS_RESULT: ConflictAnalysisResult = {
  id: 'ar-892',
  timestamp: Date.now() - 3600000,
  date: 'امروز، ۱۴:۳۰',
  category: 'سوءتفاهم',
  emotion: 'ناراحت',
  storySummary: 'چند ساعت بی‌خبری و تاخیر در پاسخ‌گویی به پیام در پیام‌رسان',
  mainEvent:
    'به نظر می‌رسد اختلاف از زمانی شروع شده که تاخیر در پاسخ‌گویی به پیام با مشغله‌های روزمره همزمان شد و فرصت توضیح زودهنگام وجود نداشت.',
  userEmotion:
    'احساس نادیده گرفته شدن و کم‌رنگ شدن اهمیتت در رابطه، که باعث شد این تاخیر را به عنوان نشانه‌ای از بی‌توجهی تعبیر کنی.',
  possibleOtherPerspective:
    'احتمالاً درگیر فشار کاری یا خستگی روزمره بوده و پیام تند تو را به عنوان سرزنش و بی‌انصافی نسبت به تلاش‌هایش برداشت کرده است.',
  trigger: 'تاخیر در پاسخ‌گویی بدون اطلاع قبلی',
  escalation: [
    {
      step: 1,
      title: 'اتفاق',
      description: 'چند ساعت بی‌خبری و تاخیر در پاسخ‌گویی به پیام، بدون اطلاع قبلی.',
      icon: 'MessageSquareOff',
    },
    {
      step: 2,
      title: 'برداشت',
      description: 'تو حس کردی بی‌اهمیتی، و او حس کرد که مورد سوءظن و کنترل قرار گرفته است.',
      icon: 'Brain',
    },
    {
      step: 3,
      title: 'واکنش',
      description: 'ارسال پیام با لحن دلخور و پاسخی کوتاه و تدافعی از طرف مقابل.',
      icon: 'Zap',
    },
    {
      step: 4,
      title: 'تشدید دعوا',
      description: 'انتقال موضوع از یک تاخیر ساده به بحث‌های کلی‌تر پیرامون تعهد و نحوه درک متقابل.',
      icon: 'Flame',
    },
  ],
  userBehavior: {
    understandable: 'انتظار دریافت پاسخ، احترام به وقت و حس امنیت خاطر در رابطه کاملاً طبیعی و موجه است.',
    improvable: 'بیان مستقیم احساس دلتنگی یا نگرانی به جای ابراز آن با کنایه، سکوت سنگین یا قضاوت زودهنگام.',
    escalationRisk: 'نسبت دادن انگیزه بد به طرف مقابل پیش از شنیدن توضیحات او، که او را به موضع دفاعی می‌کشاند.',
  },
  otherBehavior: {
    understandable: 'نیاز به تمرکز روی کار یا نیاز به فضای شخصی موقت برای بازیابی انرژی در شرایط شلوغ کاری.',
    improvable: 'یک اطلاع‌رسانی ۵ ثانیه‌ای ساده («سرم شلوغه، بهت زنگ می‌زنم») که مانع سوءتفاهم و ابهام می‌شود.',
    escalationRisk: 'پاسخ تدافعی به دلخوری تو به جای شنیدن نیاز نهفته در پشت کلامت.',
  },
  commonNeed:
    'هر دو نفر احتمالاً می‌خواستید احساس کنید برای طرف مقابل مهم، باارزش و قابل اعتماد هستید و دوست دارید رابطه‌تان در آرامش ادامه یابد.',
  suggestedResponses: {
    calm: 'من نمی‌خوام بحثمون بیشتر بشه. فقط می‌خوام بفهمم چی ناراحتت کرده و خودمم بتونم توضیح بدم چه حسی داشتم.',
    intimate:
      'من واقعاً دوستت دارم و رابطه قشنگمون برام باارزشه. وقتی ازت بی‌خبر می‌مونم حس تنهایی می‌کنم، ولی می‌دونم تو هم سرت شلوغ بوده. بیا سر فرصت با آرامش با هم چای بخوریم و صحبت کنیم.',
    direct:
      'برای من مهمه که در جریان کارهات باشم تا نگران نشم. اگر مشغله داری، یک پیام کوتاه هم کافیه. من دنبال مقصر نیستم، فقط می‌خوام با هم هماهنگ‌تر باشیم.',
    emotional:
      'راستش وقتی پاسخم رو دیر دادی حس کردم برات مثل قبل مهم نیستم و این موضوع منو خیلی دلشکسته کرد. دوست داشتم باهات حرف بزنم تا خیالم از رابطه‌مون راحت بشه.',
    friendly:
      'می‌دونم روز شلوغی برای هر دوتامون بوده و شاید لحنمون مناسب نبود. بیا از اول شروع کنیم و با آرامش با هم گپ بزنیم.',
  },
  suggestedAction:
    'قبل از ارسال هر پیامی، اجازه دهید تب‌وتاب احساسی آرام شود. مکالمه را با همدلی آغاز کنید.',
  coupleComparison: {
    userSummary: {
      mainEmotion: 'ناراحتی و احساس نادیده گرفته شدن',
      desiredNeed: 'توجه، شفافیت و حس امنیت عاطفی',
      perceivedMessage: 'بی‌اهمیتی، دور شدن و کم‌توجهی',
    },
    partnerSummary: {
      mainEmotion: 'ناامیدی و احساس درک نشدن',
      desiredNeed: 'اطمینان خاطر، فضا و درک شرایط کاری',
      perceivedMessage: 'سرزنش، کنترل‌گری و بی‌اعتمادی',
    },
    commonGround:
      'هر دو نفر می‌خواستید احساس کنید برای طرف مقابل مهم، دوست‌داشتنی و قابل اعتماد هستید و آرامش در رابطه حفظ شود.',
    sampleDialogue: [
      {
        speaker: 'user',
        name: 'تو',
        text: 'من عذرخواهی می‌کنم اگر لحنم تند بود. فقط وقتی پاسخم رو دیر دادی، حس کردم برات مثل قبل اولویت ندارم.',
      },
      {
        speaker: 'partner',
        name: 'طرف مقابل',
        text: 'ممنونم که احساست رو گفتی. من واقعاً درگیر کار بودم ولی حق داشتی نگران بشی، باید زودتر خبر می‌دادم.',
      },
      {
        speaker: 'user',
        name: 'تو',
        text: 'خیلی خوشحالم که می‌تونیم بدون دعوا با هم صحبت کنیم 🤍',
      },
    ],
  },
};

export const MOCK_HISTORY: SavedConflictRecord[] = [
  {
    id: 'h-101',
    timestamp: Date.now() - 86400000 * 2,
    date: '۲ روز پیش',
    mode: 'solo',
    category: 'سوءتفاهم',
    emotion: 'ناراحت',
    story: 'تاخیر در پاسخ به پیام‌ها و سوءتعبیر بی‌توجهی',
    analysis: DEFAULT_ANALYSIS_RESULT,
  },
];
