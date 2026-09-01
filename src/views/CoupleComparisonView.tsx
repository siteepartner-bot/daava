import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  ArrowRight,
  Heart,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Scale,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { CoupleComparison } from '../components/CoupleComparison';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';
import { analyzeCoupleSession } from '../services/coupleService';

interface CoupleComparisonViewProps {
  session: CoupleSessionPublicState | null;
  auth: LocalCoupleSessionAuth | null;
  onProceedToEnding: () => void;
  onBack: () => void;
  onSessionUpdated?: (session: CoupleSessionPublicState) => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CoupleComparisonView: React.FC<CoupleComparisonViewProps> = ({
  session,
  auth,
  onProceedToEnding,
  onBack,
  onSessionUpdated,
  onNotify,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedAnalysis, setSharedAnalysis] = useState<any>(
    session?.sharedAnalysis || null
  );

  // Sync state if session updates
  useEffect(() => {
    if (session?.sharedAnalysis) {
      setSharedAnalysis(session.sharedAnalysis);
    }
  }, [session]);

  // Auto trigger analysis on mount if not analyzed yet and session is ready
  useEffect(() => {
    if (
      session &&
      !session.sharedAnalysis &&
      !sharedAnalysis &&
      !isAnalyzing &&
      !error
    ) {
      handleRunAnalysis(false);
    }
  }, [session?.id]);

  const handleRunAnalysis = async (forceReanalyze = false) => {
    if (!session) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await analyzeCoupleSession({
        sessionIdOrCode: session.id || session.joinCode,
        token: auth?.token,
        forceReanalyze,
      });

      setSharedAnalysis(res.sharedAnalysis);
      if (onSessionUpdated && res.session) {
        onSessionUpdated(res.session);
      }
      if (onNotify) {
        onNotify('تحلیل مشترک دونفره با موفقیت آماده شد 🤍', 'success');
      }
    } catch (err: any) {
      console.error('Error running couple analysis:', err);
      const msg = err.message || 'نتونستیم تحلیل مشترک رو انجام بدیم 🤍';
      setError(msg);
      if (onNotify) {
        onNotify(msg, 'error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pAName = session?.participantA?.name || 'نفر اول';
  const pBName = session?.participantB?.name || 'نفر دوم';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به وضعیت جلسه</span>
        </button>

        <span className="text-xs bg-purple-100/80 text-purple-900 px-3 py-1 rounded-full font-bold">
          تحلیل و میانجی‌گری دونفره 🤍
        </span>
      </div>

      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/80 text-purple-900 text-xs font-bold mb-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>تحلیل بی‌طرفانه هوش مصنوعی Gemini</span>
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]">
          تحلیل مشترک و بی‌طرفانه ماجرا
        </h2>

        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          دیدن ماجرا از زاویه نگاه طرف مقابل بدون سرزنش یا مقصرسازی، کلید حل هر سوءتفاهمی است.
        </p>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <Card className="p-8 md:p-12 text-center space-y-5 border-purple-200 bg-gradient-to-b from-purple-50/50 to-white shadow-sm">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-purple-200 animate-ping opacity-40" />
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md">
              <Brain className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-lg font-extrabold text-purple-950">
              در حال میانجی‌گری و تحلیل بی‌طرفانه...
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              هوش مصنوعی در حال بررسی روایت هر دو نفر ({pAName} و {pBName})، استخراج نقاط مشترک و تدوین راهکار گفتگو است.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-medium text-purple-700 bg-purple-50 px-4 py-2 rounded-full w-fit mx-auto border border-purple-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>محرمانه و کاملاً بی‌طرفانه</span>
          </div>
        </Card>
      )}

      {/* Error State */}
      {!isAnalyzing && error && (
        <Card className="p-6 text-center space-y-4 border-rose-200 bg-rose-50/70">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-rose-900 text-base">خطا در دریافت تحلیل مشترک</h3>
            <p className="text-xs sm:text-sm text-rose-700">{error}</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleRunAnalysis(true)}
            icon={<RefreshCw className="w-4 h-4" />}
            className="mx-auto"
          >
            تلاش مجدد
          </Button>
        </Card>
      )}

      {/* Analysis Result */}
      {!isAnalyzing && !error && sharedAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <CoupleComparison
            sharedAnalysis={sharedAnalysis}
            participantAName={pAName}
            participantBName={pBName}
            onCopyStarter={() => {
              if (onNotify) onNotify('جمله در حافظه کپی شد ✓', 'success');
            }}
          />

          {/* Re-analyze or proceed bar */}
          <Card className="p-4 md:p-5 bg-purple-50/60 border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right">
              <span className="text-xs font-bold text-purple-950 block">آیا می‌خواهید دوباره تحلیل بگیرید؟</span>
              <span className="text-[11px] text-slate-500">
                در صورت نیاز می‌توانید تحلیل را با تنظیمات تازه به‌روز کنید.
              </span>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleRunAnalysis(true)}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto shrink-0"
            >
              تحلیل مجدد
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Bottom Action */}
      {!isAnalyzing && sharedAnalysis && (
        <div className="pt-4 border-t border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#64748B] text-center sm:text-right">
            اکنون وقت آن رسیده تا با همدلی و استفاده از جملات پیشنهادی گفتگو را شروع کنید.
          </p>

          <Button
            size="lg"
            variant="primary"
            className="w-full sm:w-auto min-w-[220px]"
            onClick={onProceedToEnding}
            icon={<Heart className="w-4 h-4 text-pink-300" />}
          >
            پایان و شروع گفت‌وگو 🤍
          </Button>
        </div>
      )}
    </div>
  );
};
