import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmotionChip } from '../components/EmotionChip';
import { ConflictCategory, EmotionType, GenderType, CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';
import { CATEGORIES, EMOTIONS } from '../data/mockData';
import { submitCoupleStory } from '../services/coupleService';

interface CoupleStoryViewProps {
  session: CoupleSessionPublicState;
  auth: LocalCoupleSessionAuth;
  onStorySubmitted: (session: CoupleSessionPublicState) => void;
  onBack: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CoupleStoryView: React.FC<CoupleStoryViewProps> = ({
  session,
  auth,
  onStorySubmitted,
  onBack,
  onNotify,
}) => {
  const [storyText, setStoryText] = useState('');
  const [category, setCategory] = useState<ConflictCategory | null>(null);
  const [emotion, setEmotion] = useState<EmotionType | null>(null);
  const [gender, setGender] = useState<GenderType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleToggleCategory = (cat: ConflictCategory) => {
    setCategory((prev) => (prev === cat ? null : cat));
  };

  const handleToggleEmotion = (emo: EmotionType) => {
    setEmotion((prev) => (prev === emo ? null : emo));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanText = storyText.trim();
    if (!cleanText || cleanText.length < 10) {
      setErrorMessage('برای اینکه هوش مصنوعی بتونه دقیق تحلیلش کنه، لطفاً کمی بیشتر توضیح بده (حداقل ۱۰ کاراکتر) 🤍');
      return;
    }

    if (cleanText.length > 2500) {
      setErrorMessage('متنت کمی طولانیه. لطفاً خلاصه‌ترش کن تا بهتر بررسیش کنیم 🤍');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const updatedSession = await submitCoupleStory({
        sessionIdOrCode: session.id || session.joinCode,
        token: auth.token,
        role: auth.role,
        name: auth.name,
        story: cleanText,
        category,
        emotion,
        gender,
      });

      onNotify('دیدگاه شما با موفقیت ثبت شد ✓', 'success');
      onStorySubmitted(updatedSession);
    } catch (err: any) {
      console.error('Error submitting story:', err);
      setErrorMessage(err?.message || 'خطا در ثبت دیدگاه. لطفاً دوباره تلاش کنید.');
      onNotify(err?.message || 'خطا در ثبت دیدگاه 🤍', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <span className="text-xs bg-purple-100/80 text-purple-900 px-3 py-1 rounded-full font-medium">
          ثبت دیدگاه {auth.name ? `(${auth.name})` : ''}
        </span>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-200"
        >
          <Sparkles className="w-7 h-7 text-amber-200" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]">
          از نگاه تو چی شد؟
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          این بار می‌خوایم فقط از دید تو ماجرا رو بفهمیم. راحت و صادقانه بنویس.
        </p>
      </div>

      {/* Story Form Card */}
      <Card className="border-purple-200 bg-white p-6 md:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Story Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                روایت شما از اتفاق و احساسی که داشتید:
              </label>
              <span className="text-[11px] text-[#64748B]">
                {storyText.length > 0 ? `${storyText.length} کاراکتر` : ''}
              </span>
            </div>

            <textarea
              value={storyText}
              onChange={(e) => {
                setStoryText(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="مثلاً: من فکر می‌کردم کارم درسته، ولی وقتی لحن تندش رو دیدم ناراحت شدم و حس کردم قدر زحماتم دونسته نشده..."
              rows={5}
              className="w-full p-4 rounded-2xl bg-[#FAF8FC] border border-purple-200/80 text-sm md:text-base text-[#2D2A32] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:bg-white transition-all resize-y leading-relaxed"
            />

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Gender Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                شما:
              </label>
              <span className="text-[11px] text-[#64748B]">اختیاری</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setGender((prev) => (prev === 'female' ? null : 'female'))}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200 shadow-xs'
                    : 'bg-white border-purple-200/80 text-[#2D2A32] hover:bg-rose-50/40'
                }`}
              >
                <span>👩 دخترم</span>
              </button>

              <button
                type="button"
                onClick={() => setGender((prev) => (prev === 'male' ? null : 'male'))}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-200 shadow-xs'
                    : 'bg-white border-purple-200/80 text-[#2D2A32] hover:bg-blue-50/40'
                }`}
              >
                <span>👨 پسرم</span>
              </button>
            </div>
          </div>

          {/* Conflict Category Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                این موضوع بیشتر در چه زمینه‌ای بود؟
              </label>
              <span className="text-[11px] text-[#64748B]">اختیاری</span>
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                الان در چه حال و هوایی هستی؟
              </label>
              <span className="text-[11px] text-[#64748B]">اختیاری</span>
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

          {/* Submit Action with Double submit protection */}
          <div className="pt-3">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'در حال ثبت دیدگاه...' : 'ثبت دیدگاه من'}
            </Button>
          </div>
        </form>

        {/* Privacy Shield Note */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-[#64748B]">
          <Shield className="w-4 h-4 text-purple-700 shrink-0" />
          <span>
            پاسخ شما مستقیماً برای طرف مقابل ارسال نمی‌شود و فقط برای استخراج نقطه مشترک توسط هوش مصنوعی پردازش خواهد شد.
          </span>
        </div>
      </Card>
    </div>
  );
};
