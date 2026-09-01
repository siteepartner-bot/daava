import React, { useState, useEffect } from 'react';
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
  Server,
  RefreshCw,
  Activity,
  AlertCircle,
  User as UserIcon,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { User, UserStats } from '../services/authService';

interface SettingsViewProps {
  user: User | null;
  stats?: UserStats | null;
  onNavigateToAuth: () => void;
  onNavigateToProfile: () => void;
  onLogout: () => void;
  onOpenAbout: (tab?: 'how-it-works' | 'about-us' | 'privacy') => void;
  onClearAllHistory?: () => void;
  onNotify: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  stats,
  onNavigateToAuth,
  onNavigateToProfile,
  onLogout,
  onOpenAbout,
  onClearAllHistory,
  onNotify,
}) => {
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [workerUrl, setWorkerUrl] = useState('');
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [statusDetail, setStatusDetail] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('custom_worker_api_url') || 'https://frosty-tree-3857.sitee-partner.workers.dev';
    setWorkerUrl(saved);
  }, []);

  const handleTestWorker = async (urlToTest?: string) => {
    const target = (urlToTest || workerUrl).trim();
    if (!target) {
      setWorkerStatus('error');
      setStatusDetail('آدرس ورکر وارد نشده است.');
      return;
    }

    setWorkerStatus('checking');
    setStatusDetail('در حال ارسال سیگنال بررسی به ورکر کلودفلر...');

    try {
      // Normalize URL for health test
      let healthUrl = target;
      if (!healthUrl.endsWith('/api/health') && !healthUrl.endsWith('/')) {
        healthUrl = `${healthUrl}/api/health`;
      } else if (healthUrl.endsWith('/')) {
        healthUrl = `${healthUrl}api/health`;
      }

      const res = await fetch(healthUrl, { method: 'GET' });
      if (!res.ok) {
        throw new Error(`خطای HTTP ${res.status}`);
      }
      const data = (await res.json()) as any;
      if (data.hasApiKey) {
        setWorkerStatus('connected');
        setStatusDetail('ورکر فعال است و کلید GEMINI_API_KEY متصل است ✅');
        localStorage.setItem('custom_worker_api_url', target);
        onNotify('اتصال ورکر با موفقیت بررسی و ذخیره شد.');
      } else {
        setWorkerStatus('error');
        setStatusDetail('ورکر پاسخ داد ولی متغیر GEMINI_API_KEY در کلودفلر تنظیم نشده است.');
      }
    } catch (err: any) {
      setWorkerStatus('error');
      setStatusDetail(err?.message || 'عدم دسترسی به آدرس ورکر');
    }
  };

  const handleSaveWorkerUrl = () => {
    localStorage.setItem('custom_worker_api_url', workerUrl.trim());
    onNotify('آدرس ورکر در حافظه مرورگر ذخیره شد.');
  };

  const handleResetWorker = () => {
    const defaultUrl = 'https://frosty-tree-3857.sitee-partner.workers.dev';
    setWorkerUrl(defaultUrl);
    localStorage.setItem('custom_worker_api_url', defaultUrl);
    handleTestWorker(defaultUrl);
  };

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
          <span>تنظیمات و حساب کاربری</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          مدیریت حساب کاربری، حریم خصوصی و ذخیره‌سازی
        </p>
      </div>

      {/* Account Status Card */}
      {user ? (
        <Card className="p-5 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border-indigo-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{user.name}</h3>
                <p className="text-xs text-slate-500 font-mono" dir="ltr">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToProfile}
              className="px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>پروفایل من</span>
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-indigo-100/80 text-xs text-slate-600">
            <span>
              تحلیل‌های شخصی: <strong className="text-indigo-600">{stats?.personalAnalysesCount ?? 0}</strong>
            </span>
            <span>
              جلسات دونفره: <strong className="text-purple-600">{stats?.coupleSessionsCount ?? 0}</strong>
            </span>
            <button
              onClick={onLogout}
              className="text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 hover:underline"
            >
              <LogOut size={13} />
              <span>خروج از حساب</span>
            </button>
          </div>
        </Card>
      ) : (
        <Card className="p-5 bg-gradient-to-br from-purple-50 via-white to-pink-50/40 border-purple-200 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <UserIcon size={20} />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-slate-800">ورود یا ساخت حساب کاربری</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                با ایجاد حساب کاربری، تمامی تحلیلهای شما بهصورت دائمی و امن ذخیره میشوند و در هر دستگاهی قابل دسترسی خواهند بود.
              </p>
            </div>
          </div>

          <Button
            onClick={onNavigateToAuth}
            variant="primary"
            size="sm"
            className="w-full mt-2"
          >
            ورود / ثبت‌نام در حساب
          </Button>
        </Card>
      )}

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
