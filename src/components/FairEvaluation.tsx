import React from 'react';
import { Card } from './Card';
import { User, Users, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

interface EvaluationDetails {
  understandable: string;
  improvable: string;
  escalationRisk: string;
}

interface FairEvaluationProps {
  userEvaluation?: EvaluationDetails;
  partnerEvaluation?: EvaluationDetails;
  className?: string;
}

export const FairEvaluation: React.FC<FairEvaluationProps> = ({
  userEvaluation = {
    understandable: 'انتظار دریافت پاسخ، احترام به وقت و حس امنیت خاطر در رابطه کاملاً طبیعی و موجه است.',
    improvable: 'بیان مستقیم احساس دلتنگی یا نگرانی به جای ابراز آن با کنایه، سکوت سنگین یا قضاوت زودهنگام.',
    escalationRisk: 'نسبت دادن انگیزه منفی پیش از شنیدن توضیحات او، که احساس سرزنش ایجاد می‌کند.',
  },
  partnerEvaluation = {
    understandable: 'نیاز به تمرکز روی وظایف شغلی یا نیاز موقت به بازیابی انرژی روحی در شرایط پرفشار.',
    improvable: 'یک پیام کوتاه ۵ ثانیه‌ای («سرم شلوغه، به زودی زنگ می‌زنم») که مانع از ابهام و نگرانی می‌شود.',
    escalationRisk: 'موضع تدافعی گرفتن و نادیده گرفتن دلخوری تو به جای شنیدن نیاز عاطفی پشت آن.',
  },
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 ${className}`}>
      {/* User Column */}
      <Card className="border-purple-200/80 bg-white/90">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-purple-100/80">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-[#2D2A32]">رفتار تو</h4>
            <span className="text-[11px] text-[#64748B]">تحلیل نگاه و زاویه دید تو</span>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Understandable */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>نقطه قوت و قابل درک:</span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed pr-5">
              {userEvaluation.understandable}
            </p>
          </div>

          {/* Improvable */}
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100/80">
            <div className="flex items-center gap-1.5 text-purple-800 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>فرصت رشد و قابل بهبود:</span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed pr-5">
              {userEvaluation.improvable}
            </p>
          </div>

          {/* Escalation Risk */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100/80">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>احتمال تشدید ناخواسته بحث:</span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed pr-5">
              {userEvaluation.escalationRisk}
            </p>
          </div>
        </div>
      </Card>

      {/* Partner Column */}
      <Card className="border-pink-200/80 bg-white/90">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-pink-100/80">
          <div className="w-8 h-8 rounded-xl bg-pink-100 text-purple-800 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-[#2D2A32]">رفتار طرف مقابل</h4>
            <span className="text-[11px] text-[#64748B]">تحلیل نگاه و زاویه دید او</span>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Understandable */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>نقطه قوت و قابل درک:</span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed pr-5">
              {partnerEvaluation.understandable}
            </p>
          </div>

          {/* Improvable */}
          <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100/80">
            <div className="flex items-center gap-1.5 text-purple-800 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>فرصت رشد و قابل بهبود:</span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed pr-5">
              {partnerEvaluation.improvable}
            </p>
          </div>

          {/* Escalation Risk */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100/80">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>احتمال تشدید ناخواسته بحث:</span>
            </div>
            <p className="text-xs md:text-sm text-slate-700 leading-relaxed pr-5">
              {partnerEvaluation.escalationRisk}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
