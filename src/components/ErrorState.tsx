import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  onBack?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'یه مشکلی پیش اومد 🤍',
  message = 'نگران نباش، گاهی در ارتباط یا پردازش وقفه‌ای می‌افته. می‌تونی دوباره تلاش کنی.',
  onRetry,
  onBack,
}) => {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-100/80 text-purple-700 flex items-center justify-center shadow-xs">
          <span className="text-3xl">🤍</span>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D2A32] mb-2">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onBack && (
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onBack}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              ویرایش ماجرا
            </Button>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto min-w-[180px]"
            onClick={onRetry}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            دوباره تلاش کن
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
