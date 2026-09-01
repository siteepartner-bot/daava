import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, Sparkles } from 'lucide-react';

interface LoadingAIViewProps {
  isDone?: boolean;
  onComplete: () => void;
}

export const LoadingAIView: React.FC<LoadingAIViewProps> = ({ isDone = false, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const steps = [
    { title: 'حرف‌هات رو می‌خونم', detail: 'درک بافتار و جزئیات مکالمه شما' },
    { title: 'احساسات اصلی رو پیدا می‌کنم', detail: 'تفکیک خشم اولیه از دلخوری عمیق‌تر' },
    { title: 'دنبال سوءتفاهم می‌گردم', detail: 'شناسایی تفاوت دیدگاه و برداشت‌های نادرست' },
    { title: 'پیشنهاد راه‌حل', detail: 'آماده‌سازی جملات آرامش‌بخش برای گفت‌وگو' },
  ];

  // Visual progression timer
  useEffect(() => {
    const t1 = setTimeout(() => setCurrentStepIndex((prev) => Math.max(prev, 1)), 800);
    const t2 = setTimeout(() => setCurrentStepIndex((prev) => Math.max(prev, 2)), 1600);
    const t3 = setTimeout(() => setCurrentStepIndex((prev) => Math.max(prev, 3)), 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // When backend analysis finishes (isDone is true), gracefully complete and transition
  useEffect(() => {
    if (!isDone) return;

    // Give a short smooth delay so the user sees the solution step checkmark
    const finishTimeout = setTimeout(() => {
      setCurrentStepIndex(4); // All 4 steps checked
      const navTimeout = setTimeout(() => {
        onCompleteRef.current();
      }, 500);
      return () => clearTimeout(navTimeout);
    }, currentStepIndex < 3 ? 1200 : 400);

    return () => clearTimeout(finishTimeout);
  }, [isDone, currentStepIndex]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {/* Soothing Breathing Animated Orb */}
      <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
        {/* Outer pulsating ring */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-purple-200"
        />

        {/* Middle ring */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.2,
          }}
          className="absolute inset-2 rounded-full bg-pink-100"
        />

        {/* Center core */}
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#7E57C2] to-purple-400 text-white flex items-center justify-center shadow-lg shadow-purple-300/50">
          <Sparkles className="w-7 h-7 text-amber-200 animate-pulse" />
        </div>
      </div>

      {/* Main Status Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl sm:text-2xl font-extrabold text-[#2D2A32] mb-2"
      >
        دارم ماجرا رو بررسی می‌کنم...
      </motion.h3>
      <p className="text-xs sm:text-sm text-[#64748B] mb-8">
        با آرامش چند لحظه نفس عمیق بکش؛ در حال آماده‌سازی تحلیلی منصفانه هستیم.
      </p>

      {/* Animated Steps Container */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-purple-100 soft-shadow text-right space-y-4">
        {steps.map((step, idx) => {
          const isDoneStep = currentStepIndex > idx;
          const isCurrent = currentStepIndex === idx;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-2xl transition-all duration-300 ${
                isCurrent
                  ? 'bg-purple-50/90 border border-purple-200 shadow-xs'
                  : isDoneStep
                  ? 'bg-emerald-50/40 border border-emerald-100/60'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
                  isDoneStep
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-[#7E57C2] text-white animate-spin'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDoneStep ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5" />
                ) : (
                  <span>○</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4
                    className={`text-xs md:text-sm font-bold ${
                      isCurrent
                        ? 'text-purple-950'
                        : isDoneStep
                        ? 'text-emerald-950'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </h4>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">{step.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
