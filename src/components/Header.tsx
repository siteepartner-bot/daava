import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { Button } from './Button';
import { Sparkles, History, Settings, User as UserIcon, ShieldCheck } from 'lucide-react';
import { User } from '../services/authService';

interface HeaderProps {
  currentView: AppView;
  user: User | null;
  onNavigate: (view: AppView) => void;
  onOpenAbout: (tab?: 'how-it-works' | 'about-us' | 'privacy') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, user, onNavigate, onOpenAbout }) => {
  const [hasCustomWorker, setHasCustomWorker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('custom_worker_api_url');
    if (saved && saved.trim()) {
      setHasCustomWorker(true);
    }
  }, [currentView]);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF8F5]/90 border-b border-purple-100/80 transition-all shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Right (In RTL: Brand Logo) */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-purple-400 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="text-sm">🤍</span>
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-[#2D2A32] group-hover:text-[#7E57C2] transition-colors">
            آرومش کن
          </span>
        </button>

        {/* Left (In RTL: Navigation links & CTAs) */}
        <div className="flex items-center gap-1.5 md:gap-3">
          <nav className="hidden md:flex items-center gap-1 text-sm text-[#64748B]">
            <button
              onClick={() => onOpenAbout('how-it-works')}
              className="px-3 py-1.5 rounded-xl hover:text-[#7E57C2] hover:bg-purple-50/60 transition-colors cursor-pointer"
            >
              چگونه کار می‌کند؟
            </button>
            <button
              onClick={() => onOpenAbout('about-us')}
              className="px-3 py-1.5 rounded-xl hover:text-[#7E57C2] hover:bg-purple-50/60 transition-colors cursor-pointer"
            >
              درباره ما
            </button>
            <button
              onClick={() => onNavigate('history')}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'history'
                  ? 'text-[#7E57C2] bg-purple-50 font-semibold'
                  : 'hover:text-[#7E57C2] hover:bg-purple-50/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>تاریخچه</span>
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'settings'
                  ? 'text-[#7E57C2] bg-purple-50 font-semibold'
                  : 'hover:text-[#7E57C2] hover:bg-purple-50/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>تنظیمات</span>
            </button>
          </nav>

          {/* User Account / Login Button */}
          {user ? (
            <button
              onClick={() => onNavigate('profile')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                currentView === 'profile'
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-xs'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </div>
              <span className="max-w-[80px] sm:max-w-[120px] truncate">{user.name}</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-medium ${
                currentView === 'auth'
                  ? 'bg-purple-100 border-purple-300 text-purple-800 font-semibold'
                  : 'bg-white border-purple-200 text-slate-700 hover:bg-purple-50'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>ورود / ثبت‌نام</span>
            </button>
          )}

          {/* Quick Settings Icon button on Mobile & Tablet */}
          <button
            onClick={() => onNavigate('settings')}
            title="تنظیمات ورکر و هوش مصنوعی"
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-medium md:hidden ${
              currentView === 'settings'
                ? 'bg-purple-100 border-purple-300 text-purple-800'
                : 'bg-white border-purple-100 text-slate-700 hover:bg-purple-50'
            }`}
          >
            <Settings className="w-4 h-4 text-purple-600" />
          </button>

          {currentView === 'landing' ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onNavigate('select-mode')}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              شروع تحلیل
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onNavigate('landing')}
            >
              صفحه اصلی
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
