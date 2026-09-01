import React from 'react';
import { Home, Sparkles, History, Settings } from 'lucide-react';
import { AppView } from '../types';

interface BottomNavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  onNavigate,
}) => {
  const navItems: {
    id: AppView | 'new-analysis';
    label: string;
    icon: React.ReactNode;
    targetView: AppView;
  }[] = [
    {
      id: 'landing',
      label: 'خانه',
      icon: <Home className="w-5 h-5" />,
      targetView: 'landing',
    },
    {
      id: 'new-analysis',
      label: 'تحلیل جدید',
      icon: <Sparkles className="w-5 h-5" />,
      targetView: 'select-mode',
    },
    {
      id: 'history',
      label: 'تاریخچه',
      icon: <History className="w-5 h-5" />,
      targetView: 'history',
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: <Settings className="w-5 h-5" />,
      targetView: 'settings',
    },
  ];

  const isCurrentActive = (item: typeof navItems[0]) => {
    if (item.id === 'new-analysis') {
      return (
        currentView === 'select-mode' ||
        currentView === 'input-story' ||
        currentView === 'loading-ai' ||
        currentView === 'analysis-result' ||
        currentView === 'suggested-response' ||
        currentView === 'couple-invite' ||
        currentView === 'couple-comparison' ||
        currentView === 'ending'
      );
    }
    return currentView === item.targetView;
  };

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-purple-100/80 px-4 shadow-lg"
      style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', paddingTop: '8px' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isCurrentActive(item);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.targetView)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                active
                  ? 'text-[#7E57C2] font-bold'
                  : 'text-[#64748B] hover:text-[#7E57C2]'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  active ? 'bg-purple-100 text-[#7E57C2]' : ''
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
