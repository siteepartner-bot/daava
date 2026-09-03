import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Users, Lock, Heart, Shield, ArrowLeft, CheckCircle2, MessageSquareHeart } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AppView, AnalysisMode } from '../types';

interface LandingViewProps {
  onStartAnalysis: (mode: AnalysisMode) => void;
  onNavigate: (view: AppView) => void;
  onOpenAbout: (tab?: 'how-it-works' | 'about-us' | 'privacy') => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartAnalysis,
  onNavigate,
  onOpenAbout,
}) => {
  return (
    <div className="space-y-12 md:space-y-16 pb-12">
      {/* Hero Section */}
      <section className="pt-6 md:pt-12 text-center max-w-3xl mx-auto px-4">
        {/* Soft Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/70 text-purple-800 text-xs font-semibold mb-6 border border-purple-200/60"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>دستیار هوشمند برای گفت‌وگوهای آرام</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-[#2D2A32] leading-tight sm:leading-tight md:leading-tight mb-5"
        >
          دعواتون شده؟
          <br />
          <span className="text-[#7E57C2] relative inline-block">
            اول همدیگه رو بفهمید.
            <svg
              className="absolute -bottom-2 right-0 left-0 w-full h-2 text-purple-200"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
            >
              <path
                d="M0,8 Q50,0 100,8"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed mb-8"
        >
          «آرومش کن» کمک می‌کنه قبل از اینکه بحث بزرگتر بشه، بفهمید واقعاً چه چیزی باعث
          ناراحتی شما و طرف مقابل شده.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-4"
        >
          <Button
            size="lg"
            variant="primary"
            fullWidth
            onClick={() => onStartAnalysis('solo')}
            icon={<ArrowLeft className="w-4 h-4" />}
            iconPosition="left"
          >
            تحلیل دعوای من
          </Button>
          <Button
            size="lg"
            variant="soft-pink"
            fullWidth
            onClick={() => onStartAnalysis('couple')}
            icon={<Users className="w-4 h-4 text-purple-800" />}
            iconPosition="right"
          >
            تحلیل دونفره
          </Button>
        </motion.div>

        {/* Privacy Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 text-xs text-[#64748B]"
        >
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>اطلاعات شما خصوصی می‌ماند.</span>
        </motion.div>
      </section>

      {/* Live Preview Card */}
      <section className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div className="text-center mb-3">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
              پیش‌نمایش زنده از عملکرد آرومش کن
            </span>
          </div>

          <div className="bg-gradient-to-br from-purple-50/90 via-white to-pink-50/50 rounded-3xl p-5 md:p-8 border border-purple-200/80 soft-shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-center">
              {/* Left Column (User Input Preview) */}
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-purple-100 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#64748B]">تعریف ماجرا توسط تو:</span>
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    سوءتفاهم
                  </span>
                </div>
                <p className="text-xs md:text-sm text-[#2D2A32] leading-relaxed italic bg-[#FAF8FC] p-3 rounded-xl border border-purple-50">
                  «من از این ناراحتم که وقتی باهاش حرف می‌زنم، جوابم رو دیر میده...»
                </p>
                <div className="text-[11px] text-slate-600 flex items-center gap-1">
                  <span>احساس اصلی:</span>
                  <span className="font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md">ناراحت و دلخور</span>
                </div>
              </div>

              {/* Right Column (AI Mock Result) */}
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-purple-200/90 shadow-xs space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-1.5 text-purple-800 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>تحلیل هوشمند ریشه دلخوری:</span>
                </div>

                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100">
                  <h4 className="text-xs md:text-sm font-bold text-purple-950 mb-1">
                    به نظر می‌رسد مشکل اصلی فقط دیر جواب دادن نیست.
                  </h4>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
                    «احتمالاً احساس نادیده گرفته شدن باعث ناراحتی تو شده.»
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#64748B]">
                  <span>نتیجه: ارائه پیشنهاد گفت‌وگوی بدون تنش</span>
                  <button
                    onClick={() => onStartAnalysis('solo')}
                    className="text-[#7E57C2] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>امتحان کنید</span>
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Philosophy & Features Section */}
      <section className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        <Card hoverEffect className="bg-white/80 border-purple-100">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#2D2A32] mb-1.5">بدون قضاوت یا سرزنش</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            ما مقصر مشخص نمی‌کنیم؛ به هر دو طرف کمک می‌کنیم دلیل واکنش‌ها را منصفانه ببینند.
          </p>
        </Card>

        <Card hoverEffect className="bg-white/80 border-pink-100">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
          </div>
          <h3 className="text-sm font-bold text-[#2D2A32] mb-1.5">حفظ صمیمیت و مهر</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            تبدیل خشم و کنایه به جملات شفاف و صمیمانه‌ای که طرف مقابل راحت بشنود.
          </p>
        </Card>

        <Card hoverEffect className="bg-white/80 border-indigo-100">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#2D2A32] mb-1.5">پیشنهاد پاسخ متناسب</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            ۵ لحن مختلف (آرام، صمیمی، مستقیم، احساسی، دوستانه) برای شروع مجدد مکالمه.
          </p>
        </Card>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#7E57C2] to-purple-800 rounded-3xl p-6 md:p-8 text-white text-center soft-shadow space-y-4">
          <h3 className="text-lg md:text-xl font-bold">
            اجازه ندهید یک سوءتفاهم ساده فاصله بینتان بیندازد.
          </h3>
          <p className="text-xs md:text-sm text-purple-100 max-w-md mx-auto leading-relaxed">
            در کمتر از ۲ دقیقه احساساتتان را شفاف کنید و راه‌حلی آرام پیدا کنید.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-purple-900 hover:bg-purple-50 shadow-md font-bold"
              onClick={() => onStartAnalysis('solo')}
            >
              شروع رایگان و محرمانه
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
