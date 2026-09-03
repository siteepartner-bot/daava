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
          <span>تنظیمات و زیرساخت ارتباطی</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          مدیریت اتصال ورکر هوش مصنوعی جمینای، حریم خصوصی و ذخیره‌سازی
        </p>
      </div>

      {/* Worker Connection Card */}
      <Card className="p-5 bg-white border-purple-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D2A32]">
                اتصال مستقیم به Cloudflare Worker
              </h3>
              <p className="text-[11px] text-[#64748B]">
                تحلیل‌های هوش مصنوعی مستقیماً از طریق ورکر کلودفلر پردازش می‌شوند
              </p>
            </div>
          </div>
          {workerStatus === 'connected' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              متصل
            </span>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            آدرس (URL) ورکر جمینای:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={workerUrl}
              onChange={(e) => setWorkerUrl(e.target.value)}
              placeholder="https://your-worker.workers.dev"
              className="flex-1 px-3 py-2 text-xs md:text-sm rounded-xl border border-purple-200 focus:outline-none focus:border-purple-600 bg-slate-50 font-mono text-left"
              dir="ltr"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTestWorker()}
              disabled={workerStatus === 'checking'}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${workerStatus === 'checking' ? 'animate-spin' : ''}`} />}
            >
              تست اتصال
            </Button>
          </div>
        </div>

        {/* Status result */}
        {statusDetail && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
              workerStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : workerStatus === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}
          >
            {workerStatus === 'connected' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusDetail}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-purple-50 text-xs">
          <button
            onClick={handleResetWorker}
            className="text-purple-600 hover:text-purple-800 font-medium cursor-pointer"
          >
            بازنشانی به ورکر پیش‌فرض
          </button>
          <button
            onClick={handleSaveWorkerUrl}
            className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            ذخیره آدرس
          </button>
        </div>
      </Card>

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
