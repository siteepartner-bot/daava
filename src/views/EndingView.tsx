import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, MessageCircle, RotateCcw, CheckCircle, Share2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TwoMinuteChallenge } from '../components/TwoMinuteChallenge';
import { AppView } from '../types';

interface EndingViewProps {
  onStartNew: () => void;
  onOpenAbout: () => void;
  onNotify: (msg: string) => void;
}

export const EndingView: React.FC<EndingViewProps> = ({ onStartNew, onOpenAbout, onNotify }) => {
  const [conversationStarted, setConversationStarted] = useState(false);

  const handleStartConversation = () => {
    setConversationStarted(true);
    onNotify('آرزوی مکالمه‌ای پر از صلح و مهر برای شما 🤍');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 space-y-8 text-center">
      {/* Calm Zen Visual Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-100 to-pink-100 text-purple-700 flex items-center justify-center shadow-xs">
          <span className="text-3xl">🤍</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2D2A32] leading-tight sm:leading-snug max-w-xl mx-auto">
          دعوا شاید هنوز کامل حل نشده باشه،
          <br />
          <span className="text-[#7E57C2]">ولی الان همدیگه رو بهتر می‌فهمید.</span>
        </h2>

        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          اختلاف‌نظر در هر رابطه‌ای طبیعی است؛ مهم این است که اجازه ندهیم سوءتفاهم جایگزین عشق و
          احترام شود.
        </p>
      </motion.div>

      {/* Main Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-xs mx-auto"
      >
        {!conversationStarted ? (
          <Button
            size="lg"
            variant="primary"
            fullWidth
            onClick={handleStartConversation}
            icon={<MessageCircle className="w-5 h-5" />}
          >
            یک گفت‌وگوی بهتر شروع کنیم
          </Button>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs md:text-sm font-semibold flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>آماده گفت‌وگوی آرام؛ صبور باشید و عمیقاً گوش دهید.</span>
          </div>
        )}
      </motion.div>

      {/* 2-Minute Challenge Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-right"
      >
        <TwoMinuteChallenge onComplete={() => onNotify('چالش ۲ دقیقه‌ای با موفقیت انجام شد! 🌸')} />
      </motion.div>

      {/* Final Reset / New Analysis Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-6 border-t border-purple-100 flex flex-wrap items-center justify-center gap-4 text-xs text-[#64748B]"
      >
        <button
          onClick={onStartNew}
          className="inline-flex items-center gap-1 text-[#7E57C2] font-semibold hover:underline cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>تحلیل یک موضوع جدید</span>
        </button>

        <span>•</span>

        <button
          onClick={onOpenAbout}
          className="hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          درباره فلسفه آروم شو
        </button>
      </motion.div>
    </div>
  );
};
