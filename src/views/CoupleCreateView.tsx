import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, ArrowRight, ArrowLeft, Sparkles, Shield, AlertCircle, KeyRound } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmotionChip } from '../components/EmotionChip';
import { ConflictCategory, EmotionType, GenderType, StoryInputState, CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';
import { CATEGORIES, EMOTIONS } from '../data/mockData';
import { createCoupleSession } from '../services/coupleService';

interface CoupleCreateViewProps {
  initialStoryState?: Partial<StoryInputState>;
  onSessionCreated: (session: CoupleSessionPublicState, auth: LocalCoupleSessionAuth) => void;
  onGoToJoinWithCode: () => void;
  onBack: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CoupleCreateView: React.FC<CoupleCreateViewProps> = ({
  initialStoryState,
  onSessionCreated,
  onGoToJoinWithCode,
  onBack,
  onNotify,
}) => {
  const [name, setName] = useState('من');
  const [storyText, setStoryText] = useState(initialStoryState?.storyText || '');
  const [category, setCategory] = useState<ConflictCategory | null>(initialStoryState?.category || null);
  const [emotion, setEmotion] = useState<EmotionType | null>(initialStoryState?.emotion || null);
  const [gender, setGender] = useState<GenderType | null>(initialStoryState?.gender || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleToggleCategory = (cat: ConflictCategory) => {
    setCategory((prev) => (prev === cat ? null : cat));
  };

  const handleToggleEmotion = (emo: EmotionType) => {
    setEmotion((prev) => (prev === emo ? null : emo));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('لطفاً نام یا لقب خودت رو وارد کن 🤍');
      return;
    }

    const cleanStory = storyText.trim();
    if (cleanStory.length > 0 && cleanStory.length < 20) {
      setErrorMessage('اگر ماجرا رو می‌نویسی، یکم بیشتر برامون تعریف کن (حداقل ۲۰ کاراکتر) 🤍');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await createCoupleSession({
        name: cleanName,
        story: cleanStory || undefined,
        category: category || null,
        emotion: emotion || null,
        gender: gender || null,
      });

      onNotify('جلسه دونفره با موفقیت ایجاد شد 🤍', 'success');
      onSessionCreated(result.session, {
        sessionId: result.session.id,
        joinCode: result.session.joinCode,
        role: 'participantA',
        token: result.token,
        name: cleanName,
      });
    } catch (err: any) {
      console.error('Error creating couple session:', err);
      setErrorMessage(err?.message || 'خطا در ایجاد جلسه. لطفاً دوباره امتحان کنید.');
      onNotify(err?.message || 'یه مشکلی پیش اومد 🤍', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <button
          onClick={onGoToJoinWithCode}
          className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100/80 px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>کد دعوت داری؟ ورود به جلسه</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-200"
        >
          <Users className="w-7 h-7" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]">
          شروع تحلیل دونفره
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          یک جلسه خصوصی ایجاد کن و لینک دعوت رو برای طرف مقابلت بفرست تا هرکدوم جداگانه دیدگاهتون رو بنویسید.
        </p>
      </div>

      {/* Main Creation Card */}
      <Card className="border-purple-200 bg-white p-6 md:p-8 space-y-6">
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Participant A Name Input */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-[#2D2A32] mb-1.5">
              نام یا لقب شما:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="مثلاً نیما، سارا یا من"
              maxLength={30}
              className="w-full p-3.5 rounded-2xl bg-[#FAF8FC] border border-purple-200/80 text-sm text-[#2D2A32] focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:bg-white transition-all"
            />
            <span className="text-[11px] text-[#64748B] mt-1 block">
              این اسم فقط برای تفکیک دو نفر در جلسه استفاده می‌شود.
            </span>
          </div>

          {/* Story Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                شرح دیدگاه شما از ماجرا (اختیاری):
              </label>
              <span className="text-[11px] text-[#64748B]">
                {storyText.length > 0 ? `${storyText.length} کاراکتر` : 'می‌تونی بعداً هم بنویسی'}
              </span>
            </div>
            <textarea
              value={storyText}
              onChange={(e) => {
                setStoryText(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="دیدگاهت رو بنویس تا بعد از ورود طرف مقابل، پاسخ‌های هر دو نفر در کنار هم قرار بگیره..."
              rows={4}
              className="w-full p-3.5 rounded-2xl bg-[#FAF8FC] border border-purple-200/80 text-sm text-[#2D2A32] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:bg-white transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Gender Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32]">
                شما:
              </label>
              <span className="text-[11px] text-[#64748B]">اختیاری</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGender((prev) => (prev === 'female' ? null : 'female'))}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200'
                    : 'bg-white border-purple-200/80 text-[#2D2A32] hover:bg-rose-50/40'
                }`}
              >
                <span>👩 دخترم</span>
              </button>
              <button
                type="button"
                onClick={() => setGender((prev) => (prev === 'male' ? null : 'male'))}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-200'
                    : 'bg-white border-purple-200/80 text-[#2D2A32] hover:bg-blue-50/40'
                }`}
              >
                <span>👨 پسرم</span>
              </button>
            </div>
          </div>

          {/* Category Chips (Optional) */}
          <div>
            <label className="block text-xs font-bold text-[#2D2A32] mb-1.5">
              موضوع اصلی (اختیاری):
            </label>
            <div className="flex flex-wrap gap-1.5">
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

          {/* Emotion Chips (Optional) */}
          <div>
            <label className="block text-xs font-bold text-[#2D2A32] mb-1.5">
              احساس فعلی شما (اختیاری):
            </label>
            <div className="flex flex-wrap gap-1.5">
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

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium p-3 rounded-xl bg-rose-50 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              icon={<Sparkles className="w-4 h-4 text-amber-300" />}
            >
              {isSubmitting ? 'در حال ایجاد جلسه...' : 'ساخت جلسه و دریافت لینک دعوت'}
            </Button>
          </div>
        </form>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-[#64748B]">
          <Shield className="w-4 h-4 text-purple-700 shrink-0" />
          <span>
            پاسخ‌های شما تا زمانی که طرف مقابل هم دیدگاه خودش را ثبت نکند کاملاً محفوظ و مخفی می‌ماند.
          </span>
        </div>
      </Card>
    </div>
  );
};
