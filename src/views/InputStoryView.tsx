import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, Wand2, MessageSquare, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmotionChip } from '../components/EmotionChip';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { ConflictCategory, EmotionType, AnalysisMode, StoryInputState, GenderType } from '../types';
import { CATEGORIES, EMOTIONS, SAMPLE_STORIES } from '../data/mockData';

interface InputStoryViewProps {
  mode: AnalysisMode;
  initialState?: Partial<StoryInputState>;
  onSubmit: (state: StoryInputState) => void;
  onBack: () => void;
}

export const InputStoryView: React.FC<InputStoryViewProps> = ({
  mode,
  initialState,
  onSubmit,
  onBack,
}) => {
  const [storyText, setStoryText] = useState(initialState?.storyText || '');
  const [category, setCategory] = useState<ConflictCategory | null>(
    initialState?.category !== undefined ? initialState.category : null
  );
  const [emotion, setEmotion] = useState<EmotionType | null>(
    initialState?.emotion !== undefined ? initialState.emotion : null
  );
  const [gender, setGender] = useState<GenderType | null>(
    initialState?.gender !== undefined ? initialState.gender : null
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
  }, [mode]);

  const handleApplySample = (sample: (typeof SAMPLE_STORIES)[0]) => {
    setStoryText(sample.text);
    setCategory(sample.category);
    setEmotion(sample.emotion);
    setErrorMessage('');
  };

  const handleToggleCategory = (cat: ConflictCategory) => {
    setCategory((prev) => (prev === cat ? null : cat));
  };

  const handleToggleEmotion = (emo: EmotionType) => {
    setEmotion((prev) => (prev === emo ? null : emo));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanText = storyText.trim();
    if (!cleanText || cleanText.length < 20) {
      setErrorMessage('یکم بیشتر برام تعریف کن تا بهتر بتونم کمکت کنم 🤍');
      return;
    }

    if (cleanText.length > 2500) {
      setErrorMessage('متنت خیلی طولانیه. لطفاً کمی خلاصه‌ترش کن تا بهتر بررسیش کنیم 🤍');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    onSubmit({
      mode,
      storyText: cleanText,
      category,
      emotion,
      gender,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>مرحله قبل</span>
        </button>

        <span className="text-xs font-semibold px-2.5 py-1 bg-purple-100/70 text-purple-900 rounded-full">
          {mode === 'couple' ? 'تحلیل دونفره — دیدگاه تو' : 'تحلیل شخصی'}
        </span>
      </div>

      <Card className="p-6 md:p-8 bg-white border-purple-200/80">
        {/* Title Header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32] mb-2">
            چی شد که دعوا کردید؟
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            لازم نیست مرتب یا رسمی بنویسی. هرطور راحتی تعریف کن.
          </p>
        </div>

        {/* Sample Story Quick Insert */}
        <div className="mb-5 p-3 rounded-2xl bg-purple-50/60 border border-purple-100/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-purple-600" />
              <span>یا یکی از نمونه‌های آماده را انتخاب کن:</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_STORIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySample(sample)}
                className="text-xs px-2.5 py-1 rounded-xl bg-white hover:bg-purple-100/70 text-purple-900 border border-purple-200/60 transition-colors cursor-pointer"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Story Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                شرح ماجرا و حرف‌هایی که ردوبدل شد:
              </label>
              <span className="text-[11px] text-[#64748B]">
                {storyText.length > 0 ? `${storyText.length} کاراکتر` : ''}
              </span>
            </div>

            <div className="relative">
              <textarea
                value={storyText}
                onChange={(e) => {
                  setStoryText(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="مثلاً: از صبح منتظر بودم جوابم رو بده، ولی چند ساعت جواب نداد. وقتی جواب داد عصبانی شدم و گفتم برات مهم نیستم..."
                rows={5}
                className="w-full p-4 rounded-2xl bg-[#FAF8FC] border border-purple-200/80 text-sm md:text-base text-[#2D2A32] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:bg-white transition-all resize-y leading-relaxed"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Gender Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                شما:
              </label>
              <span className="text-[11px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
                تاثیر در تحلیل و لحن پیام‌ها
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setGender((prev) => (prev === 'female' ? null : 'female'))}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200 shadow-xs'
                    : 'bg-white border-purple-200/80 text-[#2D2A32] hover:bg-rose-50/40 hover:border-rose-300'
                }`}
              >
                <span className="text-base">👩</span>
                <span>دخترم</span>
              </button>

              <button
                type="button"
                onClick={() => setGender((prev) => (prev === 'male' ? null : 'male'))}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-200 shadow-xs'
                    : 'bg-white border-purple-200/80 text-[#2D2A32] hover:bg-blue-50/40 hover:border-blue-300'
                }`}
              >
                <span className="text-base">👨</span>
                <span>پسرم</span>
              </button>

              {gender && (
                <button
                  type="button"
                  onClick={() => setGender(null)}
                  className="text-[11px] text-[#64748B] hover:text-purple-700 underline underline-offset-2 pr-1 transition-colors cursor-pointer"
                >
                  حذف انتخاب
                </button>
              )}
            </div>
          </div>

          {/* Conflict Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                این موضوع بیشتر مربوط به چیه؟
              </label>
              <span className="text-[11px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
                اختیاری
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <EmotionChip
                  key={cat.label}
                  label={cat.label}
                  emoji={cat.emoji}
                  selected={category === cat.label}
                  onClick={() => handleToggleCategory(cat.label)}
                />
              ))}
            </div>
          </div>

          {/* Emotion Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                الان چه حسی داری؟
              </label>
              <span className="text-[11px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
                اختیاری
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((emo) => (
                <EmotionChip
                  key={emo.label}
                  label={emo.label}
                  emoji={emo.emoji}
                  selected={emotion === emo.label}
                  onClick={() => handleToggleEmotion(emo.label)}
                />
              ))}
            </div>
          </div>

          {/* Bottom Bar: Progress & Submit Button */}
          <div className="pt-4 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-48">
              <ProgressIndicator currentStep={1} totalSteps={3} label="مرحله ۱ از ۳" />
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[200px]"
              icon={<Sparkles className="w-4 h-4 text-amber-300" />}
            >
              {isSubmitting ? 'در حال ارسال...' : 'تحلیل کن ✨'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
