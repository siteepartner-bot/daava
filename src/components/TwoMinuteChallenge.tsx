import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Timer, Sparkles, Send, CheckCircle2, RotateCcw } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

interface TwoMinuteChallengeProps {
  className?: string;
  onComplete?: () => void;
}

export const TwoMinuteChallenge: React.FC<TwoMinuteChallengeProps> = ({
  className = '',
  onComplete,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes = 120 seconds
  const [userAppreciation, setUserAppreciation] = useState('');
  const [partnerAppreciation, setPartnerAppreciation] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && !isRevealed) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, isRevealed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 100);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsActive(true);
    setTimeLeft(120);
    setIsRevealed(false);
  };

  const handleReveal = () => {
    setIsRevealed(true);
    if (onComplete) onComplete();
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(120);
    setUserAppreciation('');
    setPartnerAppreciation('');
    setIsRevealed(false);
  };

  return (
    <Card className={`border-purple-200 bg-gradient-to-b from-white to-purple-50/30 ${className}`}>
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-purple-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-[#2D2A32]">
              چالش ۲ دقیقه‌ای یادآوری مهر
            </h4>
            <p className="text-xs text-[#64748B]">
              هرکدومتون یک چیزی که هنوز در طرف مقابل دوست دارید بنویسید.
            </p>
          </div>
        </div>

        {isActive && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-100/80 text-purple-900 rounded-full text-xs font-mono font-bold">
            <Timer className="w-3.5 h-3.5 text-purple-600" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {!isActive ? (
        <div className="text-center py-4 space-y-3">
          <p className="text-xs md:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            حتی در اوج عصبانیت، احساساتی که نسبت به هم دارید از بین نرفته است. دو دقیقه وقت
            بگذارید و یک نکته ارزشمند که هنوز در طرف مقابل دوست دارید بنویسید.
          </p>
          <Button
            variant="primary"
            onClick={handleStart}
            icon={<Sparkles className="w-4 h-4" />}
          >
            شروع چالش ۲ دقیقه‌ای
          </Button>
        </div>
      ) : !isRevealed ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* User Input */}
            <div className="p-3.5 bg-white rounded-2xl border border-purple-100">
              <label className="block text-xs font-bold text-purple-950 mb-1.5">
                چیزی که تو در طرف مقابل دوست داری:
              </label>
              <textarea
                value={userAppreciation}
                onChange={(e) => setUserAppreciation(e.target.value)}
                placeholder="مثلاً: اینکه همیشه حامی من در روزهای سخت هستی و خنده‌هات حالم رو خوب می‌کنه..."
                rows={3}
                className="w-full text-xs md:text-sm p-2.5 rounded-xl bg-[#FAF8FC] border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
              />
            </div>

            {/* Partner Input (or prompt for them) */}
            <div className="p-3.5 bg-white rounded-2xl border border-pink-100">
              <label className="block text-xs font-bold text-pink-950 mb-1.5">
                چیزی که طرف مقابل در تو دوست دارد:
              </label>
              <textarea
                value={partnerAppreciation}
                onChange={(e) => setPartnerAppreciation(e.target.value)}
                placeholder="مثلاً: مهربونی قلبت و اینکه وقتی حالم بده همیشه کنارم بودی..."
                rows={3}
                className="w-full text-xs md:text-sm p-2.5 rounded-xl bg-[#FAF8FC] border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              شروع مجدد
            </Button>
            <Button
              size="md"
              variant="primary"
              onClick={handleReveal}
              disabled={!userAppreciation.trim() && !partnerAppreciation.trim()}
              icon={<Heart className="w-4 h-4" />}
            >
              مشاهده و بازخوانی محبت‌ها ✨
            </Button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 py-2"
        >
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <div className="inline-flex p-2 rounded-full bg-emerald-100 text-emerald-700 mb-1.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h5 className="text-sm font-bold text-emerald-950">آفرین به هر دوی شما!</h5>
            <p className="text-xs text-emerald-800">
              ارتباط دوباره با مهر و قدردانی آغاز می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
              <span className="text-xs text-purple-700 font-semibold block mb-1">
                از سمت تو:
              </span>
              <p className="text-xs md:text-sm text-purple-950 leading-relaxed font-medium">
                «{userAppreciation || 'مهربانی و صبوری‌ات در لحظات سخت'}»
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-200">
              <span className="text-xs text-pink-700 font-semibold block mb-1">
                از سمت طرف مقابل:
              </span>
              <p className="text-xs md:text-sm text-pink-950 leading-relaxed font-medium">
                «{partnerAppreciation || 'قلب پر از محبتت و تلاش برای حل سوءتفاهم‌ها'}»
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <Button size="sm" variant="ghost" onClick={handleReset}>
              انجام دوباره چالش
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
};
