import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Sparkles, MessageCircleHeart } from 'lucide-react';
import { Button } from './Button';
import { ResponseTone } from '../types';
import { TONE_LABELS } from '../data/mockData';

interface ChatBubbleProps {
  responses: Record<ResponseTone, string>;
  onToneChange?: (tone: ResponseTone) => void;
  className?: string;
  onCopySuccess?: (text: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  responses,
  onToneChange,
  className = '',
  onCopySuccess,
}) => {
  const [activeTone, setActiveTone] = useState<ResponseTone>('calm');
  const [copied, setCopied] = useState(false);

  const handleToneSelect = (tone: ResponseTone) => {
    setActiveTone(tone);
    if (onToneChange) onToneChange(tone);
  };

  const handleCopy = () => {
    const textToCopy = responses[activeTone];
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    if (onCopySuccess) onCopySuccess(textToCopy);
    setTimeout(() => setCopied(false), 2500);
  };

  const tones: ResponseTone[] = ['intimate', 'calm', 'direct', 'emotional', 'friendly'];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tone Selection Bar */}
      <div>
        <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#2D2A32] mb-2.5">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>لحن گفت‌وگو را انتخاب کن:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tones.map((toneKey) => {
            const toneInfo = TONE_LABELS[toneKey];
            const isSelected = activeTone === toneKey;
            return (
              <motion.button
                key={toneKey}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleToneSelect(toneKey)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs md:text-sm font-medium transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#7E57C2] text-white border-[#7E57C2] shadow-sm shadow-purple-200'
                    : 'bg-white text-slate-700 border-purple-100 hover:border-purple-300 hover:bg-purple-50/50'
                }`}
              >
                <span>{toneInfo.emoji}</span>
                <span>{toneInfo.label}</span>
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-[#64748B] mt-1.5">
          {TONE_LABELS[activeTone].desc}
        </p>
      </div>

      {/* Main Chat Bubble Box */}
      <div className="relative bg-gradient-to-br from-purple-50/90 via-white to-pink-50/50 rounded-3xl p-5 md:p-6 border border-purple-200/80 soft-shadow">
        <div className="flex items-center justify-between gap-2 mb-3 text-xs text-purple-900 font-medium">
          <div className="flex items-center gap-1.5">
            <MessageCircleHeart className="w-4 h-4 text-purple-600" />
            <span>متن پیشنهادی با لحن «{TONE_LABELS[activeTone].label}»</span>
          </div>
          <span className="text-[11px] bg-purple-100/80 text-purple-800 px-2.5 py-0.5 rounded-full">
            آماده ارسال
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTone}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-sm md:text-base text-[#2D2A32] leading-relaxed md:leading-loose font-normal p-4 bg-white rounded-2xl border border-purple-100/90 shadow-xs select-all"
          >
            «{responses[activeTone]}»
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-100/60">
          <span className="text-xs text-[#64748B]">
            می‌توانی این پیام را کپی کنی یا با کلمات خودت تغییر دهی.
          </span>
          <Button
            size="sm"
            variant={copied ? 'success' : 'primary'}
            onClick={handleCopy}
            icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'کپی شد!' : 'کپی متن'}
          </Button>
        </div>
      </div>
    </div>
  );
};
