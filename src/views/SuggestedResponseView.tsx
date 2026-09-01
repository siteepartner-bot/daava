import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Users,
  Sparkles,
  HeartHandshake,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ChatBubble } from '../components/ChatBubble';
import { ConflictAnalysisResult, AnalysisMode, ResponseTone } from '../types';

interface SuggestedResponseViewProps {
  data: ConflictAnalysisResult;
  mode: AnalysisMode;
  onProceedToEnding: () => void;
  onProceedToCoupleInvite: () => void;
  onBack: () => void;
  onReanalyze: () => void;
  onNotify: (msg: string) => void;
}

export const SuggestedResponseView: React.FC<SuggestedResponseViewProps> = ({
  data,
  mode,
  onProceedToEnding,
  onProceedToCoupleInvite,
  onBack,
  onReanalyze,
  onNotify,
}) => {
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

        <span className="text-xs bg-purple-100/80 text-purple-900 px-3 py-1 rounded-full font-medium">
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
          اگه می‌خوای بحث رو آروم‌تر کنی، می‌تونی یکی از این پیام‌ها رو بفرستی:
        </motion.p>
      </div>

      {/* Main Interactive Chat Bubble with 5 Tone Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ChatBubble
          responses={data.suggestedResponses}
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
