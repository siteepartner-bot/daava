import React from 'react';
import { AppView } from '../types';
import { Button } from './Button';
import { Sparkles, History, HelpCircle, Info } from 'lucide-react';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAbout: (tab?: 'how-it-works' | 'about-us' | 'privacy') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onOpenAbout }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF8F5]/85 border-b border-purple-100/70 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Right (In RTL: Brand Logo) */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-purple-400 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <span className="text-sm">🤍</span>
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-[#2D2A32] group-hover:text-[#7E57C2] transition-colors">
            آرومش کن
          </span>
        </button>

        {/* Left (In RTL: Navigation links & CTAs) */}
        <div className="flex items-center gap-1.5 md:gap-4">
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
          </nav>

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
