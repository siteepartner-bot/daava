import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Heart, Sparkles, Scale, Lock, Users, MessageSquare } from 'lucide-react';
import { Button } from './Button';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'how-it-works' | 'about-us' | 'privacy';
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'how-it-works',
}) => {
  const [activeTab, setActiveTab] = React.useState<'how-it-works' | 'about-us' | 'privacy'>(
    defaultTab
  );

  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#2D2A32]/40 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white w-full max-w-xl rounded-3xl p-6 md:p-8 border border-purple-100 soft-shadow-lg z-10 max-h-[88vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-100/70">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤍</span>
              <h3 className="text-lg font-bold text-[#2D2A32]">آرومش کن</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 p-1 bg-purple-50/70 rounded-2xl mb-6">
            <button
              onClick={() => setActiveTab('how-it-works')}
              className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'how-it-works'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-[#64748B] hover:text-purple-900'
              }`}
            >
              چگونه کار می‌کند؟
            </button>
            <button
              onClick={() => setActiveTab('about-us')}
              className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'about-us'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-[#64748B] hover:text-purple-900'
              }`}
            >
              درباره ما
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all ${
                activeTab === 'privacy'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-[#64748B] hover:text-purple-900'
              }`}
            >
              حفظ حریم خصوصی
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'how-it-works' && (
              <div className="space-y-4 text-xs md:text-sm text-[#64748B] leading-relaxed">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <div className="w-7 h-7 rounded-xl bg-purple-200 text-purple-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    ۱
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2D2A32] mb-0.5">ماجرا را به راحتی تعریف کنید</h4>
                    <p>
                      بدون نیاز به جمله‌بندی رسمی، هر آنچه رخ داده و احساسی که دارید را بنویسید.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <div className="w-7 h-7 rounded-xl bg-purple-200 text-purple-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    ۲
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2D2A32] mb-0.5">واکاوی بی‌طرفانه احساسات</h4>
                    <p>
                      هوش مصنوعی احساسات پنهان، نیازهای برآورده نشده و نقاط سوءتفاهم دو طرف را تفکیک می‌کند.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <div className="w-7 h-7 rounded-xl bg-purple-200 text-purple-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    ۳
                  </div>
                  <div>
                    <h4 className="font-bold text-[#2D2A32] mb-0.5">دریافت پیشنهاد گفت‌وگوی آرام</h4>
                    <p>
                      متن‌های آماده با لحن‌های مختلف در اختیارتان قرار می‌گیرد تا بحث به جای تشدید، به تفاهم ختم شود.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about-us' && (
              <div className="space-y-3.5 text-xs md:text-sm text-[#64748B] leading-relaxed">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                  <h4 className="font-bold text-purple-950 text-sm mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    <span>فلسفه «آرومش کن»</span>
                  </h4>
                  <p className="text-slate-700 leading-relaxed">
                    دعواها معمولاً به خاطر نبود عشق نیست، بلکه ناشی از نشنیده شدن نیازها و
                    برداشت‌های نادرست است. هدف ما قضاوت کردن یا تعیین مقصر نیست؛ هدف ایجاد فضایی
                    امن و آرام برای درک متقابل قبل از تصمیم‌گیری‌های شتاب‌زده است.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 font-semibold text-[#2D2A32] mb-1">
                    <Scale className="w-4 h-4 text-purple-600" />
                    <span>اصل بی‌طرفی کامل</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    سیستم هیچ‌گاه سرزنش نمی‌کند و همیشه بر پایه همدلی و روانشناسی ارتباط بدون خشونت
                    (NVC) عمل می‌کند.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-3.5 text-xs md:text-sm text-[#64748B] leading-relaxed">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2 font-bold text-emerald-950 mb-1.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>حریم خصوصی شما اولویت مطلق ماست</span>
                  </div>
                  <p className="text-slate-700 text-xs md:text-sm leading-relaxed">
                    تمام نوشته‌ها و داستان‌های شما کاملاً محرمانه بررسی می‌شوند و هیچ اطلاعاتی به
                    اشخاص ثالث یا تبلیغات منتقل نمی‌شود. در حالت دونفره نیز پاسخ‌ها تا زمان تکمیل هر
                    دو طرف پنهان می‌ماند.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer button */}
          <div className="mt-6 pt-4 border-t border-purple-100 flex justify-end">
            <Button variant="primary" onClick={onClose}>
              متوجه شدم
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
