export type AppView =
  | 'landing'
  | 'select-mode'
  | 'input-story'
  | 'loading-ai'
  | 'analysis-result'
  | 'suggested-response'
  | 'couple-invite'
  | 'couple-comparison'
  | 'ending'
  | 'history'
  | 'settings';

export type AnalysisMode = 'solo' | 'couple';

export type ConflictCategory =
  | 'رابطه'
  | 'دوستی'
  | 'خانواده'
  | 'اعتماد'
  | 'سوءتفاهم'
  | 'ارتباط';

export type EmotionType =
  | 'عصبانی'
  | 'ناراحت'
  | 'ناامید'
  | 'مضطرب'
  | 'گیج'
  | 'دلتنگ';

export type ResponseTone =
  | 'intimate' // ❤️ صمیمی
  | 'calm' // 😌 آروم
  | 'direct' // 🗣️ مستقیم
  | 'emotional' // 🥺 احساسی
  | 'friendly'; // 🙂 دوستانه

export interface ConflictInput {
  mode: AnalysisMode;
  storyText: string;
  category?: ConflictCategory | null;
  emotion?: EmotionType | null;
  partnerStoryText?: string;
  partnerEmotion?: EmotionType | null;
}

export interface StoryInputState {
  mode: AnalysisMode;
  storyText: string;
  category: ConflictCategory | null;
  emotion: EmotionType | null;
  partnerStoryText?: string;
  partnerEmotion?: EmotionType | null;
}

export interface BehaviorEvaluation {
  understandable: string; // 🟢 قابل درک
  improvable: string; // 🟡 قابل بهبود
  escalationRisk: string; // 🔴 ممکن است باعث تشدید بحث شده باشد
}

export interface TimelineStep {
  step: number;
  title: string;
  description: string;
  icon?: string;
}

export interface ConflictAnalysisResult {
  id: string;
  timestamp: number;
  date: string;
  category: ConflictCategory;
  emotion: EmotionType;
  storySummary: string; // خلاصه کوتاه ماجرا
  mainEvent: string; // 🔴 اتفاق اصلی
  userEmotion: string; // 💭 چیزی که احتمالاً تو احساس کردی
  possibleOtherPerspective: string; // 🧩 چیزی که ممکنه طرف مقابل برداشت کرده باشه
  trigger: string; // اتفاق / جرقه شروع
  escalation: TimelineStep[]; // ⚡ تایم‌لاین تشدید
  userBehavior: BehaviorEvaluation; // ⚖️ رفتار کاربر
  otherBehavior: BehaviorEvaluation; // ⚖️ رفتار طرف مقابل
  commonNeed: string; // 💡 نیاز مشترک
  suggestedResponses: Record<ResponseTone, string>; // پیشنهادات پیام با ۵ لحن
  suggestedAction: string; // اقدام یا توصیه کلیدی
  coupleComparison?: {
    userSummary: {
      mainEmotion: string;
      desiredNeed: string;
      perceivedMessage: string;
    };
    partnerSummary: {
      mainEmotion: string;
      desiredNeed: string;
      perceivedMessage: string;
    };
    commonGround: string;
    sampleDialogue: {
      speaker: 'user' | 'partner';
      name: string;
      text: string;
    }[];
  };
}

export interface SavedConflictRecord {
  id: string;
  timestamp: number;
  date: string;
  mode: AnalysisMode;
  story: string;
  category: ConflictCategory | null;
  emotion: EmotionType | null;
  analysis: ConflictAnalysisResult;
}

// Backward compatibility alias
export type AnalysisResultData = ConflictAnalysisResult;
export type HistoryItem = SavedConflictRecord;

