import React from 'react';
import { motion } from 'motion/react';
import { User, Users, Sparkles, ArrowRight, ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AnalysisMode } from '../types';

interface SelectModeViewProps {
  onSelectMode: (mode: AnalysisMode) => void;
  onBack: () => void;
}

export const SelectModeView: React.FC<SelectModeViewProps> = ({ onSelectMode, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors mb-6 cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>بازگشت به صفحه اصلی</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#2D2A32] mb-3"
        >
          از کجا شروع کنیم؟
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-[#64748B] max-w-md mx-auto"
        >
          مسیر تحلیلی را انتخاب کن که با شرایط فعلی‌ات هماهنگ‌تر است.
        </motion.p>
      </div>

      {/* Two Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Solo Analysis Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card
            hoverEffect
            className="h-full flex flex-col justify-between p-6 md:p-7 border-purple-200/80 bg-white"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#2D2A32] mb-2">فقط من</h3>
              <p className="text-xs md:text-sm text-[#64748B] leading-relaxed mb-6">
                اگر می‌خواهی اول از دید خودت ماجرا را بررسی کنیم و آرام‌تر شوی.
              </p>

              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>بررسی احساسات و نیازهای پنهان خودت</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>تولید متن‌های آماده پاسخ با لحن‌های مختلف</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>کاملاً خصوصی و بدون نیاز به دعوت طرف مقابل</span>
                </li>
              </ul>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => onSelectMode('solo')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              شروع تحلیل شخصی
            </Button>
          </Card>
        </motion.div>

        {/* Couple Analysis Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card
            hoverEffect
            className="h-full flex flex-col justify-between p-6 md:p-7 border-purple-300/90 bg-gradient-to-b from-purple-50/50 via-white to-pink-50/40 relative overflow-hidden"
          >
            {/* Recommended Badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#7E57C2] text-white shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                پیشنهاد ما
              </span>
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#2D2A32] mb-2">
                من و طرف مقابلم
              </h3>
              <p className="text-xs md:text-sm text-[#64748B] leading-relaxed mb-6">
                اگر می‌خواهید هر دو طرف ماجرا را جداگانه بررسی کنید و نقطه مشترک را پیدا کنید.
              </p>

              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>مقایسه دیدگاه‌ها بدون سرزنش و قضاوت</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>پاسخ‌ها تا اتمام هر دو نفر مخفی می‌ماند</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>کشف وجه اشتراک پنهان میان هر دو طرف</span>
                </li>
              </ul>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              className="bg-[#7E57C2] hover:bg-[#6C47B2]"
              onClick={() => onSelectMode('couple')}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              شروع تحلیل دونفره
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* Trust reassurance */}
      <div className="mt-8 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-purple-600" />
        <span>در هر دو حالت، تمرکز بر تفاهم، آرامش و درک عمیق‌تر است.</span>
      </div>
    </div>
  );
};
