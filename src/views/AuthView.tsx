import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { registerUser, loginUser, User, UserStats } from '../services/authService';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
  onSuccess: (user: User, stats?: UserStats) => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  initialMode = 'login',
  onSuccess,
  onBack,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setError('لطفاً ایمیل خود را وارد کنید.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError('ایمیل واردشده درست نیست.');
      return;
    }

    if (mode === 'register' && !cleanName) {
      setError('لطفاً نام یا لقب خود را وارد کنید.');
      return;
    }

    if (!password || password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await registerUser(cleanName, cleanEmail, password);
        if (res.user) {
          onSuccess(res.user, res.stats);
        }
      } else {
        const res = await loginUser(cleanEmail, password);
        if (res.user) {
          onSuccess(res.user, res.stats);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'یه مشکلی پیش اومد 🤍');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-lg mx-auto pb-12"
    >
      {/* Back button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium py-1 px-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowRight size={18} />
          <span>بازگشت</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
          <ShieldCheck size={14} />
          <span>حساب کاربری امن</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md">
          <Sparkles size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">
          {mode === 'login' ? 'ورود به حساب کاربری' : 'ساخت حساب کاربری جدید'}
        </h1>
        <p className="text-sm text-slate-600">
          {mode === 'login'
            ? 'برای دسترسی به تحلیلهای ذخیره شده و جلسات خود وارد شوید'
            : 'با ایجاد حساب، تمامی تحلیلهای شما بهصورت دائمی و امن ذخیره می‌شوند'}
        </p>
      </div>

      <Card className="p-6 md:p-8 space-y-6 shadow-xl border-slate-100">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ورود
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ثبتنام
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs md:text-sm text-rose-700 font-medium text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">نام یا لقب</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: علی، سارا..."
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                  required={mode === 'register'}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">ایمیل</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 text-left"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">رمز عبور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۸ کاراکتر"
                className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 text-left"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full py-3 mt-2 text-base font-semibold shadow-indigo-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                در حال پردازش...
              </span>
            ) : mode === 'login' ? (
              'ورود به حساب'
            ) : (
              'ایجاد حساب کاربری'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          با ورود یا ثبتنام، اطلاعات شما با بالاترین ضوابط حریم خصوصی حفاظت خواهد شد.
        </p>
      </Card>
    </motion.div>
  );
};
