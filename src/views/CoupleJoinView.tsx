import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, ArrowLeft, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';
import { joinCoupleSession } from '../services/coupleService';

interface CoupleJoinViewProps {
  initialCode?: string;
  roomNotFound?: boolean;
  isVerifyingRoom?: boolean;
  session?: CoupleSessionPublicState | null;
  onJoined: (session: CoupleSessionPublicState, auth: LocalCoupleSessionAuth) => void;
  onBack: () => void;
  onCreateNewRoom?: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CoupleJoinView: React.FC<CoupleJoinViewProps> = ({
  initialCode = '',
  roomNotFound = false,
  isVerifyingRoom = false,
  session = null,
  onJoined,
  onBack,
  onCreateNewRoom,
  onNotify,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const creatorName = session?.participantA?.name || '';

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('لطفاً کد دعوت ۶ رقمی را وارد کنید 🤍');
      return;
    }

    const cleanName = name.trim() || 'همراه';
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await joinCoupleSession({
        joinCodeOrId: cleanCode,
        name: cleanName,
      });

      onNotify('با موفقیت وارد جلسه شدی 🤍', 'success');
      onJoined(result.session, {
        sessionId: result.session.id,
        joinCode: result.session.joinCode,
        role: result.role,
        token: result.token,
        name: cleanName,
      });
    } catch (err: any) {
      console.error('Error joining couple session:', err);
      setErrorMessage(err?.message || 'کد دعوت نامعتبر است یا جلسه منقضی شده است 🤍');
      onNotify(err?.message || 'خطا در ورود به جلسه', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 md:py-10 space-y-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به صفحه اصلی</span>
        </button>

        <span className="text-xs bg-purple-100/80 text-purple-900 px-3 py-1 rounded-full font-medium">
          ورود به جلسه دونفره
        </span>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-pink-200"
        >
          <HeartHandshake className="w-7 h-7" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]">
          به جلسه دعوت شدی 🤍
        </h2>

        {creatorName && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
            <span>دعوت‌شده توسط</span>
            <span className="font-bold">{creatorName}</span>
          </div>
        )}

        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          قبل از اینکه چیزی از جواب طرف مقابل ببینی، اول دیدگاه خودت رو بنویس.
        </p>
      </div>

      {/* Room Not Found Card */}
      {roomNotFound ? (
        <Card className="border-rose-200 bg-white p-6 md:p-8 text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-800">اتاق یا جلسه پیدا نشد</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              جلسه‌ای با این کد یا لینک دعوت در سرور یافت نشد. ممکن است زمان آن منقضی شده باشد یا کد را اشتباه وارد کرده باشید.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            {onCreateNewRoom && (
              <Button onClick={onCreateNewRoom} variant="primary" size="md">
                ایجاد جلسه جدید دونفره
              </Button>
            )}
            <Button onClick={onBack} variant="outline" size="md">
              بازگشت به صفحه اصلی
            </Button>
          </div>
        </Card>
      ) : (
        /* Join Card */
        <Card className="border-purple-200 bg-white p-6 md:p-8 space-y-6">
        <form onSubmit={handleJoin} className="space-y-5">
          {/* Join Code Input if not present or editable */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-[#2D2A32] mb-1.5">
              کد اختصاصی جلسه:
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="مثلاً 8X92KD"
              maxLength={12}
              className="w-full p-3.5 rounded-2xl bg-[#FAF8FC] border border-purple-200/80 font-mono text-center text-lg md:text-xl font-bold tracking-widest text-purple-900 focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:bg-white transition-all uppercase"
            />
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-[#2D2A32] mb-1.5">
              اسم یا لقب تو:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="مثلاً نیوشا"
              maxLength={30}
              className="w-full p-3.5 rounded-2xl bg-[#FAF8FC] border border-purple-200/80 text-sm md:text-base text-[#2D2A32] focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:bg-white transition-all"
            />
            <span className="text-[11px] text-[#64748B] mt-1 block">
              این اسم لازم نیست نام واقعی باشد.
            </span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium p-3 rounded-xl bg-rose-50 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              {isSubmitting ? 'در حال بررسی کد...' : 'ورود و نوشتن دیدگاه من'}
            </Button>
          </div>
        </form>

        {/* Security & Neutrality Assurance */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-[#64748B] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <span>
            دیدگاه شما به طور کاملاً محرمانه ذخیره می‌شود و هوش مصنوعی بدون پیش‌داوری نقطه تلاقی هر دو طرف را تحلیل خواهد کرد.
          </span>
        </div>
      </Card>
      )}
    </div>
  );
};
