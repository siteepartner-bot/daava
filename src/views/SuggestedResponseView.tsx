import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Users,
  Sparkles,
  HeartHandshake,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ChatBubble } from '../components/ChatBubble';
import { ConflictAnalysisResult, AnalysisMode, ResponseTone } from '../types';
import { suggestReplies, rewriteReply } from '../services/analysisService';

interface SuggestedResponseViewProps {
  data: ConflictAnalysisResult;
  mode: AnalysisMode;
  onProceedToEnding: () => void;
  onProceedToCoupleInvite: () => void;
  onBack: () => void;
  onReanalyze: () => void;
  onNotify: (msg: string) => void;
  onUpdateResponses?: (updated: Record<ResponseTone, string>) => void;
}

export const SuggestedResponseView: React.FC<SuggestedResponseViewProps> = ({
  data,
  mode,
  onProceedToEnding,
  onProceedToCoupleInvite,
  onBack,
  onReanalyze,
  onNotify,
  onUpdateResponses,
}) => {
  const [activeTone, setActiveTone] = useState<ResponseTone>('calm');
  const [currentResponses, setCurrentResponses] = useState<Record<ResponseTone, string>>(
    data.suggestedResponses || {
      calm: 'من نمی‌خوام بحثمون بیشتر بشه. فقط می‌خوام بفهمم چی ناراحتت کرده و خودمم بتونم با آرامش توضیح بدم.',
      intimate: 'من واقعاً دوستت دارم و رابطه‌مون برام باارزشه. بیا با هم بشینیم و با آرامش و محبت حرف بزنیم.',
      direct: 'برای من مهمه که در جریان شرایط باشم تا سوءتفاهم پیش نیاد. دنبال مقصر نیستم، فقط شفافیت می‌خوام.',
      emotional: 'راستش وقتی اون اتفاق افتاد حس تنهایی و دلشکستگی کردم. دوست داشتم باهات حرف بزنم تا خیالم راحت بشه.',
      friendly: 'می‌دونم روز شلوغی برای هر دوتامون بوده. بیا بحث رو کنار بذاریم و با مهربانی با هم گپ بزنیم.',
    }
  );

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Regenerate only the active tone using Gemini AI
  const handleRegenerateTone = async (tone: ResponseTone) => {
    if (isRegenerating || isRewriting) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const result = await suggestReplies({
        story: data.storySummary || data.mainEvent,
        summary: data.storySummary,
        category: data.category,
        emotion: data.emotion,
        trigger: data.trigger,
        commonNeed: data.commonNeed,
        userEmotion: data.userEmotion,
        possibleOtherPerspective: data.possibleOtherPerspective,
        suggestedAction: data.suggestedAction,
        tone,
      });

      const updated = {
        ...currentResponses,
        [tone]: result[tone] || result.calm || currentResponses[tone],
      };

      setCurrentResponses(updated);
      if (onUpdateResponses) onUpdateResponses(updated);
      onNotify('پیام جدید با هوش مصنوعی ساخته شد ✨');
    } catch (err: any) {
      console.error('Failed to regenerate response:', err);
      setError('نتونستم پیام رو بسازم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Rewrite active message with user custom instruction
  const handleRewriteMessage = async (tone: ResponseTone, instruction: string) => {
    if (isRewriting || isRegenerating || !instruction.trim()) return;
    setIsRewriting(true);
    setError(null);

    const originalMsg = currentResponses[tone] || '';
    const conflictContext = `${data.storySummary || ''} | نیاز مشترک: ${data.commonNeed || ''}`;

    try {
      const rewrittenMsg = await rewriteReply(
        originalMsg,
        tone,
        instruction.trim(),
        conflictContext
      );

      const updated = {
        ...currentResponses,
        [tone]: rewrittenMsg,
      };

      setCurrentResponses(updated);
      if (onUpdateResponses) onUpdateResponses(updated);
      onNotify('پیام طبق دستورت تغییر کرد ✨');
    } catch (err: any) {
      console.error('Failed to rewrite reply:', err);
      setError('نتونستم پیام رو بسازم 🤍 یه مشکل موقت پیش اومده. دوباره امتحان کن.');
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به تحلیل دعوا</span>
        </button>

        <span className="text-xs bg-purple-100/90 text-purple-900 px-3 py-1 rounded-full font-medium">
          مرحله ۳ از ۳: پیشنهاد پاسخ آرامش‌بخش
        </span>
      </div>

      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]"
        >
          حالا چی بگم؟
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs sm:text-sm text-[#64748B] leading-relaxed"
        >
          بر اساس چیزی که گفتی، چند مدل جواب برات آماده کردم.
        </motion.p>
      </div>

      {/* Main Interactive Chat Bubble with 5 Tone Switcher, Regenerate & Rewrite */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ChatBubble
          responses={currentResponses}
          activeTone={activeTone}
          onToneChange={setActiveTone}
          onRegenerateTone={handleRegenerateTone}
          onRewriteMessage={handleRewriteMessage}
          isRegenerating={isRegenerating}
          isRewriting={isRewriting}
          error={error}
          onClearError={() => setError(null)}
          onCopySuccess={() => onNotify('پیام کپی شد ✓')}
        />
      </motion.div>

      {/* Psychology Tips Box */}
      <Card className="bg-purple-50/50 border-purple-100 p-4 md:p-5">
        <h4 className="text-xs md:text-sm font-bold text-purple-950 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>نکته طلایی برای ارسال پیام:</span>
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed list-disc list-inside">
          <li>پیام را در زمانی بفرست که طرف مقابل فرصت کافی برای خواندن و فکر کردن داشته باشد.</li>
          <li>از اضافه کردن کلمات تند مانند «همیشه» یا «هیچ‌وقت» خودداری کن.</li>
          <li>هدف از این پیام، باز کردن در گفت‌وگوست، نه اثبات حقانیت.</li>
        </ul>
      </Card>

      {/* Bottom CTA Choices */}
      <div className="pt-4 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="md"
            className="text-[#64748B] hover:text-[#7E57C2]"
            onClick={onReanalyze}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            تحلیل دوباره
          </Button>

          {mode === 'couple' && (
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onProceedToCoupleInvite}
              icon={<Users className="w-4 h-4 text-purple-700" />}
            >
              دعوت به گفت‌وگوی دونفره
            </Button>
          )}
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
          onClick={onProceedToEnding}
          icon={<HeartHandshake className="w-4 h-4" />}
        >
          تکمیل و شروع گفت‌وگو 🤍
        </Button>
      </div>
    </div>
  );
};
