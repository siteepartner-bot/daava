import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  Shield,
  Trash2,
  Lock,
  Heart,
  Volume2,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface SettingsViewProps {
  onOpenAbout: (tab?: 'how-it-works' | 'about-us' | 'privacy') => void;
  onClearAllHistory?: () => void;
  onNotify: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenAbout,
  onClearAllHistory,
  onNotify,
}) => {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);

  const handleClearHistory = () => {
    if (onClearAllHistory) {
      onClearAllHistory();
    }
    onNotify('حافظه و تاریخچه با موفقیت پاکسازی شد.');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-purple-100">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D2A32] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#7E57C2]" />
          <span>تنظیمات و حریم خصوصی</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          شخصی‌سازی تجربه و مدیریت امنیت داده‌ها
        </p>
      </div>

      {/* Privacy Guarantee Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50/60 border-purple-200/90 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-purple-950 mb-1">
              تعهد حفظ محرمانگی
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              روابط و احساسات شما محرمانه هستند. تمام بررسی‌ها به صورت ایمن انجام شده و هیچ
              مکالمه‌ای ذخیره دائمی عمومی نمی‌شود.
            </p>
          </div>
        </div>
      </Card>

      {/* Options List */}
      <div className="space-y-3">
        {/* Toggle: Privacy Lock */}
        <Card className="p-4 bg-white border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <div>
                <span className="text-xs md:text-sm font-bold text-[#2D2A32] block">
                  رمزنگاری جلسات تحلیل
                </span>
                <span className="text-[11px] text-[#64748B]">
                  محافظت از متن‌ها در برابر دسترسی‌های ناخواسته
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setPrivacyMode(!privacyMode);
                onNotify(
                  !privacyMode
                    ? 'رمزنگاری کامل فعال شد'
                    : 'حالت استاندارد فعال شد'
                );
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                privacyMode ? 'bg-[#7E57C2]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  privacyMode ? 'right-1' : 'right-7'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Toggle: Gentle Feedback */}
        <Card className="p-4 bg-white border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-pink-600" />
              <div>
                <span className="text-xs md:text-sm font-bold text-[#2D2A32] block">
                  افکت‌ها و انیمیشن‌های ملایم
                </span>
                <span className="text-[11px] text-[#64748B]">
                  انتقال‌های نرم صفحات برای حس آرامش بیشتر
                </span>
              </div>
            </div>
            <button
              onClick={() => setHapticEnabled(!hapticEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                hapticEnabled ? 'bg-[#7E57C2]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  hapticEnabled ? 'right-1' : 'right-7'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Links to Modals */}
        <Card className="p-4 bg-white border-purple-100 divide-y divide-purple-50">
          <button
            onClick={() => onOpenAbout('how-it-works')}
            className="w-full py-2 flex items-center justify-between text-xs md:text-sm font-semibold text-[#2D2A32] hover:text-[#7E57C2] text-right cursor-pointer"
          >
            <span>راهنمای استفاده و متدولوژی</span>
            <Info className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => onOpenAbout('about-us')}
            className="w-full py-2 flex items-center justify-between text-xs md:text-sm font-semibold text-[#2D2A32] hover:text-[#7E57C2] text-right cursor-pointer"
          >
            <span>درباره تیم و ماموریت آرومش کن</span>
            <Heart className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => onOpenAbout('privacy')}
            className="w-full py-2 flex items-center justify-between text-xs md:text-sm font-semibold text-[#2D2A32] hover:text-[#7E57C2] text-right cursor-pointer"
          >
            <span>شرایط حفظ محرمانگی اطلاعات</span>
            <Lock className="w-4 h-4 text-slate-400" />
          </button>
        </Card>
      </div>

      {/* Clear Cache / Data */}
      <div className="pt-2">
        <Button
          size="sm"
          variant="outline"
          fullWidth
          className="text-rose-700 hover:text-rose-800 hover:border-rose-300"
          onClick={handleClearHistory}
          icon={<Trash2 className="w-4 h-4" />}
        >
          پاک کردن تاریخچه محلی این دستگاه
        </Button>
      </div>
    </div>
  );
};
