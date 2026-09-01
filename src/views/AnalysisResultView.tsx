import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Zap,
  ArrowLeft,
  ArrowRight,
  Scale,
  Lightbulb,
  RotateCcw,
  Users,
  Heart,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AnalysisTimeline } from '../components/AnalysisTimeline';
import { FairEvaluation } from '../components/FairEvaluation';
import { ConflictAnalysisResult, AnalysisMode } from '../types';

interface AnalysisResultViewProps {
  data: ConflictAnalysisResult;
  mode: AnalysisMode;
  isGuest?: boolean;
  onNavigateToAuth?: () => void;
  onProceedToResponse: () => void;
  onProceedToCouple?: () => void;
  onReanalyze: () => void;
  onBack: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  data,
  mode,
  isGuest = false,
  onNavigateToAuth,
  onProceedToResponse,
  onProceedToCouple,
  onReanalyze,
  onBack,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Top Breadcrumbs / Back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>ویرایش شرح ماجرا</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-100/80 text-purple-900 px-3 py-1 rounded-full font-medium">
            مرحله ۲ از ۳: واکاوی علل اختلاف
          </span>
        </div>
      </div>

      {/* Guest Save Prompt */}
      {isGuest && (
        <Card className="p-4 bg-gradient-to-r from-amber-50 via-orange-50/80 to-purple-50/50 border-amber-200 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-center sm:text-right">
            <span className="text-xl">🤍</span>
            <span>برای ذخیره دائمی این تحلیل وارد حسابت شو 🤍</span>
          </div>
          {onNavigateToAuth && (
            <Button
              size="sm"
              variant="primary"
              onClick={onNavigateToAuth}
              className="shrink-0 text-xs py-1.5 px-3 shadow-xs"
            >
              ورود / ثبت‌نام
            </Button>
          )}
        </Card>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50/40 to-purple-50 rounded-3xl p-6 md:p-8 border border-purple-200/80 text-center relative overflow-hidden soft-shadow">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-[#7E57C2] text-xs font-bold mb-3 border border-purple-100 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تحلیل بی‌طرفانه هوش مصنوعی</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32] mb-2">
            تحلیل دعوای شما
          </h2>

          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            «این تحلیل برای کمک به درک بهتر ماجراست، نه تعیین مقصر.»
          </p>
        </motion.div>
      </div>

      {/* 3 Core Analytical Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* Card 1: 🔴 اتفاق اصلی */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full bg-white border-rose-100/90 hover:border-rose-200">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-rose-100/60">
              <span className="text-base">🔴</span>
              <h3 className="text-sm md:text-base font-bold text-[#2D2A32]">اتفاق اصلی</h3>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-normal">
              {data.mainEvent || data.storySummary}
            </p>
          </Card>
        </motion.div>

        {/* Card 2: 💭 چیزی که احتمالاً تو احساس کردی */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full bg-white border-purple-100/90 hover:border-purple-200">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-100/60">
              <span className="text-base">💭</span>
              <h3 className="text-sm md:text-base font-bold text-[#2D2A32]">
                چیزی که احتمالاً تو احساس کردی
              </h3>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-normal">
              {data.userEmotion}
            </p>
          </Card>
        </motion.div>

        {/* Card 3: 🧩 چیزی که ممکنه طرف مقابل برداشت کرده باشه */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full bg-white border-amber-100/90 hover:border-amber-200">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-100/60">
              <span className="text-base">🧩</span>
              <h3 className="text-sm md:text-base font-bold text-[#2D2A32]">
                چیزی که ممکنه طرف مقابل برداشت کرده باشه
              </h3>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-normal">
              {data.possibleOtherPerspective}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Section: ⚡ نقطه‌ای که دعوا تشدید شد (Timeline) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="bg-white border-purple-200/80">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-100">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-[#2D2A32]">
                ⚡ دعوا چطور تشدید شد؟
              </h3>
              <p className="text-xs text-[#64748B]">
                روند تبدیل یک اتفاق اولیه به تنش و سوءبرداشت
              </p>
            </div>
          </div>

          <AnalysisTimeline steps={data.escalation} />
        </Card>
      </motion.div>

      {/* Section: ⚖️ بررسی منصفانه */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2 px-1">
          <Scale className="w-5 h-5 text-purple-700" />
          <h3 className="text-base md:text-lg font-bold text-[#2D2A32]">
            ⚖️ بررسی منصفانه رفتارها
          </h3>
        </div>

        <FairEvaluation
          userEvaluation={data.userBehavior}
          partnerEvaluation={data.otherBehavior}
        />
      </motion.div>

      {/* Section: 💡 نیاز مشترک */}
      {data.commonNeed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-purple-50/90 via-pink-50/40 to-purple-50/80 border-purple-200/90 p-5 md:p-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#7E57C2] text-amber-200 flex items-center justify-center shrink-0 shadow-xs">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm md:text-base font-extrabold text-purple-950 flex items-center gap-2">
                  <span>💡 نیاز مشترک پشت این اختلاف</span>
                </h4>
                <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                  {data.commonNeed}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Action Navigation Footer */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-purple-100">
        <Button
          variant="ghost"
          size="md"
          className="w-full sm:w-auto text-[#64748B] hover:text-[#7E57C2]"
          onClick={onReanalyze}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          تحلیل دوباره
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {mode === 'couple' && onProceedToCouple && (
            <Button
              variant="outline"
              size="lg"
              onClick={onProceedToCouple}
              icon={<Users className="w-4 h-4" />}
            >
              مشاهده مقایسه دونفره
            </Button>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto min-w-[200px]"
            onClick={onProceedToResponse}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            حالا چی بگم؟
          </Button>
        </div>
      </div>
    </div>
  );
};
