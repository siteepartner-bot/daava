import React from 'react';
import { motion } from 'motion/react';
import { MessageSquareOff, Brain, Zap, Flame, ArrowDown } from 'lucide-react';

interface TimelineStep {
  step: number;
  title: string;
  description: string;
  icon?: string;
}

interface AnalysisTimelineProps {
  steps?: TimelineStep[];
  className?: string;
}

export const AnalysisTimeline: React.FC<AnalysisTimelineProps> = ({
  steps = [
    {
      step: 1,
      title: 'اتفاق',
      description: 'تاخیر در پاسخ‌گویی به پیام‌ها یا بروز یک رخداد غیرمنتظره بدون هماهنگی قبلی.',
    },
    {
      step: 2,
      title: 'برداشت',
      description: 'تفسیر سکوت به عنوان بی‌اهمیتی از یک سمت، و تفسیر اعتراض به عنوان سرزنش از سمت دیگر.',
    },
    {
      step: 3,
      title: 'واکنش',
      description: 'ارسال پیام‌های دلخورانه، استفاده از کلمات کلی مثل «همیشه اینطوری هستی» یا سکوت قهرآمیز.',
    },
    {
      step: 4,
      title: 'تشدید دعوا',
      description: 'کشیده شدن بحث از موضوع اولیه به سمت زیر سوال رفتن تعهد، درک متقابل و احترام.',
    },
  ],
  className = '',
}) => {
  const getIcon = (index: number) => {
    switch (index) {
      case 0:
        return <MessageSquareOff className="w-4 h-4 text-purple-600" />;
      case 1:
        return <Brain className="w-4 h-4 text-amber-600" />;
      case 2:
        return <Zap className="w-4 h-4 text-orange-600" />;
      case 3:
        return <Flame className="w-4 h-4 text-rose-600" />;
      default:
        return <Zap className="w-4 h-4 text-purple-600" />;
    }
  };

  const getBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-purple-100/80 border-purple-200 text-purple-800';
      case 1:
        return 'bg-amber-100/80 border-amber-200 text-amber-800';
      case 2:
        return 'bg-orange-100/80 border-orange-200 text-orange-800';
      case 3:
        return 'bg-rose-100/80 border-rose-200 text-rose-800';
      default:
        return 'bg-purple-100 border-purple-200 text-purple-800';
    }
  };

  return (
    <div className={`space-y-3 relative ${className}`}>
      {steps.map((item, idx) => (
        <React.Fragment key={item.step || idx}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF8FC] border border-purple-100/80 hover:bg-purple-50/40 transition-colors"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getBadgeColor(
                idx
              )}`}
            >
              {getIcon(idx)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                  گام {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-[#2D2A32]">{item.title}</h4>
              </div>
              <p className="text-xs md:text-sm text-[#64748B] leading-relaxed">
                {item.description}
              </p>
            </div>
          </motion.div>

          {idx < steps.length - 1 && (
            <div className="flex justify-center my-1">
              <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center border border-purple-200/60 text-purple-400">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
