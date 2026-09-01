import React from 'react';
import { motion } from 'motion/react';
import { Users, ArrowRight, ArrowLeft, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { CoupleComparison } from '../components/CoupleComparison';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AnalysisResultData } from '../types';

interface CoupleComparisonViewProps {
  data: AnalysisResultData;
  onProceedToEnding: () => void;
  onBack: () => void;
}

export const CoupleComparisonView: React.FC<CoupleComparisonViewProps> = ({
  data,
  onProceedToEnding,
  onBack,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به صفحه دعوت</span>
        </button>

        <span className="text-xs bg-pink-100/80 text-purple-900 px-3 py-1 rounded-full font-medium">
          تحلیل و تطبیق دونفره
        </span>
      </div>

      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/70 text-purple-800 text-xs font-semibold mb-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>هر دو دیدگاه در یک قاب</span>
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]">
          حالا ببینیم هرکدومتون چی برداشت کردید
        </h2>

        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          دیدن ماجرا از زاویه نگاه طرف مقابل، کلید حل هر سوءتفاهمی است.
        </p>
      </div>

      {/* Main Couple Comparison Component */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <CoupleComparison comparisonData={data.coupleComparison} />
      </motion.div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-[#64748B]">
          هر دو طرف اکنون تصویری روشن‌تر و همدلانه‌تر از احساسات یکدیگر دارند.
        </p>

        <Button
          size="lg"
          variant="primary"
          className="w-full sm:w-auto min-w-[220px]"
          onClick={onProceedToEnding}
          icon={<Heart className="w-4 h-4 text-pink-300" />}
        >
          پایان تحلیل و شروع گفت‌وگو 🤍
        </Button>
      </div>
    </div>
  );
};
