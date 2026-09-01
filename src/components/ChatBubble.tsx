import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  Sparkles,
  MessageCircleHeart,
  RotateCw,
  Wand2,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Button } from './Button';
import { ResponseTone } from '../types';
import { TONE_LABELS } from '../data/mockData';

interface ChatBubbleProps {
  responses: Record<ResponseTone, string>;
  activeTone: ResponseTone;
  onToneChange: (tone: ResponseTone) => void;
  onRegenerateTone: (tone: ResponseTone) => Promise<void>;
  onRewriteMessage: (tone: ResponseTone, instruction: string) => Promise<void>;
  isRegenerating: boolean;
  isRewriting: boolean;
  error: string | null;
  onClearError: () => void;
  onCopySuccess?: (text: string) => void;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  responses,
  activeTone,
  onToneChange,
  onRegenerateTone,
  onRewriteMessage,
  isRegenerating,
  isRewriting,
  error,
  onClearError,
  onCopySuccess,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [userInstruction, setUserInstruction] = useState('');

  const tones: ResponseTone[] = ['calm', 'intimate', 'direct', 'emotional', 'friendly'];

  const quickInstructions = [
    'کوتاه‌ترش کن',
    'خیلی خودمونی‌تر بنویس',
    'کمتر احساسی باشه',
    'یه مقدار محکم‌تر باشه',
    'طوری بنویس که حالت عذرخواهی داشته باشه',
  ];

  const handleCopy = async () => {
    const textToCopy = responses[activeTone] || '';
    if (!textToCopy) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (onCopySuccess) onCopySuccess(textToCopy);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      if (onCopySuccess) onCopySuccess(textToCopy);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRewriteSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInstruction.trim() || isRewriting || isRegenerating) return;
    onRewriteMessage(activeTone, userInstruction.trim());
    setUserInstruction('');
  };

  const handleQuickChipClick = (chip: string) => {
    if (isRewriting || isRegenerating) return;
    onRewriteMessage(activeTone, chip);
  };

  const isLoading = isRegenerating || isRewriting;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 5 Tone Selection Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#2D2A32]">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>لحن مورد نظرت رو انتخاب کن:</span>
          </div>
          <span className="text-[11px] text-[#64748B] hidden sm:inline">
            ۵ پیام واقعی و قابل ارسال
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {tones.map((toneKey) => {
            const toneInfo = TONE_LABELS[toneKey];
            const isSelected = activeTone === toneKey;
            return (
              <motion.button
                key={toneKey}
                type="button"
                whileTap={{ scale: 0.97 }}
                disabled={isLoading}
                onClick={() => {
                  onToneChange(toneKey);
                  onClearError();
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#7E57C2] text-white border-[#7E57C2] shadow-md shadow-purple-200 scale-[1.02]'
                    : 'bg-white text-slate-700 border-purple-100 hover:border-purple-300 hover:bg-purple-50/50'
                } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="text-base">{toneInfo.emoji}</span>
                <span>{toneInfo.label}</span>
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-[#64748B] mt-2 px-1">
          {TONE_LABELS[activeTone]?.desc || ''}
        </p>
      </div>

      {/* Error Message if API fails */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2"
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>نتونستم پیام رو بسازم 🤍</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            {error || 'یه مشکل موقت پیش اومده. دوباره امتحان کن.'}
          </p>
          <div className="pt-1 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white border-rose-300 text-rose-700 hover:bg-rose-100"
              onClick={() => {
                onClearError();
                onRegenerateTone(activeTone);
              }}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              دوباره تلاش کن
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Chat Bubble Box */}
      <div className="relative bg-gradient-to-br from-purple-50/90 via-white to-pink-50/40 rounded-3xl p-5 md:p-6 border border-purple-200/90 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3 text-xs text-purple-900 font-medium">
          <div className="flex items-center gap-1.5">
            <MessageCircleHeart className="w-4 h-4 text-purple-600" />
            <span className="font-bold">
              متن پیشنهادی با لحن «{TONE_LABELS[activeTone]?.label}» {TONE_LABELS[activeTone]?.emoji}
            </span>
          </div>
          <span className="text-[11px] bg-purple-100/90 text-purple-800 px-2.5 py-0.5 rounded-full font-medium">
            آماده ارسال
          </span>
        </div>

        {/* Message Content with Loading States */}
        <div className="relative min-h-[110px] flex items-center">
          <AnimatePresence mode="wait">
            {isRegenerating ? (
              <motion.div
                key="loading-regenerate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center justify-center py-6 gap-2 text-center text-purple-900"
              >
                <RotateCw className="w-6 h-6 text-purple-600 animate-spin" />
                <span className="text-xs sm:text-sm font-medium">
                  دارم یه مدل دیگهش می‌نویسم...
                </span>
              </motion.div>
            ) : isRewriting ? (
              <motion.div
                key="loading-rewrite"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center justify-center py-6 gap-2 text-center text-purple-900"
              >
                <Wand2 className="w-6 h-6 text-purple-600 animate-spin" />
                <span className="text-xs sm:text-sm font-medium">
                  دارم طبق دستورت تغییرش می‌دم...
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={activeTone + (responses[activeTone] || '')}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="w-full text-sm md:text-base text-[#2D2A32] leading-relaxed md:leading-loose font-normal p-4 bg-white rounded-2xl border border-purple-100/90 shadow-2xs select-all whitespace-pre-wrap"
              >
                «{responses[activeTone] || 'پیامی برای این لحن موجود نیست.'}»
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions inside Bubble: Copy & Regenerate */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mt-4 pt-3.5 border-t border-purple-100/80">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onRegenerateTone(activeTone)}
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-purple-600' : ''}`} />
            <span>دوباره بنویس</span>
          </button>

          <Button
            size="sm"
            variant={copied ? 'success' : 'primary'}
            disabled={isLoading || !responses[activeTone]}
            onClick={handleCopy}
            icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'کپی شد ✓' : 'کپی متن'}
          </Button>
        </div>
      </div>

      {/* "می‌خوای تغییرش بدم؟" Interactive Section */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs sm:text-sm font-bold text-[#2D2A32] flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-purple-600" />
            <span>می‌خوای تغییرش بدم؟</span>
          </h4>
          <span className="text-[11px] text-[#64748B]">
            با هوش مصنوعی شخصی‌سازیش کن
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickInstructions.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickChipClick(chip)}
              className="text-[11px] sm:text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-100 hover:bg-purple-100 hover:border-purple-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Custom Instruction Input Form */}
        <form onSubmit={handleRewriteSubmit} className="flex gap-2">
          <input
            type="text"
            value={userInstruction}
            onChange={(e) => setUserInstruction(e.target.value)}
            placeholder="مثلاً کوتاه‌ترش کن، خودمونی‌تر بنویس یا کمتر احساسی باشه..."
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-purple-100 bg-[#FAF8F5]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all placeholder:text-slate-400"
          />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!userInstruction.trim() || isLoading}
            icon={isRewriting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          >
            تغییر بده ✨
          </Button>
        </form>
      </div>
    </div>
  );
};
