import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Lock,
  ArrowRight,
  Sparkles,
  UserCheck,
  Clock,
  LogOut,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Edit3,
  KeyRound,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LeaveSessionModal } from '../components/LeaveSessionModal';
import { CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';
import { getCoupleSessionStatus, leaveCoupleSession } from '../services/coupleService';

interface CoupleInviteViewProps {
  session: CoupleSessionPublicState;
  auth: LocalCoupleSessionAuth;
  onSessionUpdated: (session: CoupleSessionPublicState) => void;
  onOpenStoryEditor?: () => void;
  onProceedToComparison?: () => void;
  onBack: () => void;
  onLeaveSession: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CoupleInviteView: React.FC<CoupleInviteViewProps> = ({
  session,
  auth,
  onSessionUpdated,
  onOpenStoryEditor,
  onProceedToComparison,
  onBack,
  onLeaveSession,
  onNotify,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPollingLoading, setIsPollingLoading] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Generate shareable link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aramkon.app';
  const inviteLink = `${origin}/?join=${session.joinCode}`;

  const fetchLatestStatus = useCallback(async (silent = true) => {
    if (!silent) setIsPollingLoading(true);
    try {
      const updated = await getCoupleSessionStatus(session.id || session.joinCode, auth.token);
      if (isMountedRef.current) {
        setSessionError(null);
        onSessionUpdated(updated);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.warn('Polling error:', err);
        if (err.message && err.message.includes('فعال نیست')) {
          setSessionError('این جلسه دیگه فعال نیست 🤍');
        }
      }
    } finally {
      if (isMountedRef.current && !silent) {
        setIsPollingLoading(false);
      }
    }
  }, [session.id, session.joinCode, auth.token, onSessionUpdated]);

  // Polling every 3.5 seconds
  useEffect(() => {
    isMountedRef.current = true;
    const interval = setInterval(() => {
      fetchLatestStatus(true);
    }, 3500);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchLatestStatus]);

  // Sync browser URL bar with room join code so address bar shows room link directly
  useEffect(() => {
    if (typeof window !== 'undefined' && session.joinCode) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('join') !== session.joinCode) {
          url.searchParams.set('join', session.joinCode);
          window.history.replaceState({}, '', url.toString());
        }
      } catch (e) {
        console.warn('Failed to update URL search params:', e);
      }
    }
  }, [session.joinCode]);

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyTextToClipboard(inviteLink);
      setCopiedLink(true);
      onNotify('لینک اختصاصی کپی شد ✓', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      onNotify('کپی لینک با خطا مواجه شد', 'error');
    }
  };

  const handleCopyCode = async () => {
    try {
      await copyTextToClipboard(session.joinCode);
      setCopiedCode(true);
      onNotify(`کد ۴ رقمی (${session.joinCode}) کپی شد ✓`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      onNotify('کپی کد با خطا مواجه شد', 'error');
    }
  };

  const handleShare = async () => {
    const shareText = `بیا توی «آروم شو» دعوامون رو بدون طرفداری و در آرامش بررسی کنیم 🤍\nکد اتاق: ${session.joinCode}\nلینک ورود:\n`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'تحلیل آرام دعوا در آروم شو',
          text: shareText,
          url: inviteLink,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleConfirmLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveCoupleSession(session.id);
      onNotify('از جلسه خارج شدید.', 'info');
      setIsLeaveModalOpen(false);
      onLeaveSession();
    } catch {
      onLeaveSession();
    } finally {
      setIsLeaving(false);
    }
  };

  const isUserCompleted = session.isParticipantACompleted;
  const isPartnerCompleted = session.isParticipantBCompleted;
  const isReady = session.isReadyForAnalysis || (isUserCompleted && isPartnerCompleted);

  // Split join code into individual digits/characters for display
  const codeCharacters = (session.joinCode || '----').split('');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLatestStatus(false)}
            disabled={isPollingLoading}
            title="بروزرسانی وضعیت"
            className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isPollingLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ترک جلسه</span>
          </button>
        </div>
      </div>

      {/* Main Status Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-200"
        >
          <Users className="w-7 h-7" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]">
          جلسه شما آماده است 🤍
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          طرف مقابلت می‌تونه با <strong className="text-purple-700 font-bold">کد ۴ رقمی</strong> یا <strong className="text-purple-700 font-bold">لینک اختصاصی</strong> وارد این اتاق بشه.
        </p>
      </div>

      {/* Session Expired Error Banner if any */}
      {sessionError && (
        <Card className="p-4 border-rose-300 bg-rose-50/80 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-rose-800 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{sessionError}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={onLeaveSession}>
            ساخت جلسه جدید
          </Button>
        </Card>
      )}

      {/* 4-Digit Room Code Featured Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-[#7E57C2] via-purple-700 to-pink-600 text-white p-6 md:p-7 shadow-lg shadow-purple-200/60 relative overflow-hidden"
      >
        {/* Subtle decorative background circles */}
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-pink-300/20 blur-xl pointer-events-none" />

        <div className="relative text-center space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
            <KeyRound className="w-3.5 h-3.5 text-amber-300" />
            <span>کد ۴ رقمی ورود به اتاق</span>
          </div>

          {/* Big Digit Tiles strictly in LTR order */}
          <div
            className="flex items-center justify-center gap-2.5 sm:gap-3.5 my-3"
            style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
          >
            {codeCharacters.map((char, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.08 }}
                className="w-12 h-16 sm:w-14 sm:h-18 rounded-2xl bg-white/15 border-2 border-white/40 backdrop-blur-md flex items-center justify-center text-3xl sm:text-4xl font-extrabold font-mono text-white shadow-inner select-all"
                style={{ direction: 'ltr' }}
              >
                {char}
              </motion.div>
            ))}
          </div>

          <p className="text-xs sm:text-sm text-purple-100 max-w-sm mx-auto leading-relaxed">
            کافیه طرف مقابلت وارد «آروم شو» بشه و کد <strong style={{ direction: 'ltr', display: 'inline-block' }} className="font-mono text-amber-300 font-extrabold px-1">{session.joinCode}</strong> رو بزنه تا مستقیماً بیاد تو اتاق.
          </p>

          {/* Copy Code Quick Action */}
          <div className="pt-1 flex items-center justify-center">
            <Button
              size="md"
              variant="secondary"
              className="bg-white/95 text-purple-900 hover:bg-white border-0 font-bold shadow-xs cursor-pointer"
              onClick={handleCopyCode}
              icon={copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-purple-700" />}
            >
              {copiedCode ? 'کد ۴ رقمی کپی شد ✓' : 'کپی کد ۴ رقمی'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Dedicated Invite Link Card */}
      <Card className="border-purple-200 bg-white p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#2D2A32] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>یا ارسال لینک مستقیم دعوت</span>
          </span>
          <span
            style={{ direction: 'ltr' }}
            className="text-xs font-mono font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100"
          >
            {session.joinCode}
          </span>
        </div>

        {/* Link Box */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#FAF8FC] border border-purple-100 font-mono text-xs md:text-sm text-purple-900 dir-ltr select-all">
          <span className="truncate">{inviteLink}</span>
          <Button
            size="sm"
            variant={copiedLink ? 'success' : 'secondary'}
            onClick={handleCopyLink}
            icon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedLink ? 'کپی شد ✓' : 'کپی لینک'}
          </Button>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <Button
            variant="primary"
            onClick={handleShare}
            icon={<Share2 className="w-4 h-4" />}
            fullWidth
          >
            اشتراک‌گذاری دعوت
          </Button>
          <Button
            variant="soft-pink"
            onClick={handleCopyLink}
            icon={<Copy className="w-4 h-4 text-purple-800" />}
            fullWidth
          >
            {copiedLink ? 'لینک کپی شد ✓' : 'کپی مجدد لینک'}
          </Button>
        </div>
      </Card>

      {/* Participants Live Status Card */}
      <Card className="border-purple-100 bg-[#FAF8FC] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            وضعیت شرکت‌کنندگان:
          </h4>
          <span className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            همگام‌سازی زنده
          </span>
        </div>

        <div className="space-y-3">
          {/* User A Status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-purple-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isUserCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs md:text-sm font-bold text-[#2D2A32] block">
                  دیدگاه شما ({session.participantA?.name || 'نفر اول'})
                </span>
                <span className="text-[11px] text-slate-500">
                  {isUserCompleted ? 'دیدگاه شما ثبت و محفوظ شده' : 'هنوز دیدگاهت رو ننوشتی'}
                </span>
              </div>
            </div>

            {isUserCompleted ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                تکمیل کردی 🟢
              </span>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={onOpenStoryEditor}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                نوشتن دیدگاه
              </Button>
            )}
          </div>

          {/* User B Status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-purple-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isPartnerCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs md:text-sm font-bold text-[#2D2A32] block">
                  دیدگاه طرف مقابل {session.participantB?.name ? `(${session.participantB.name})` : ''}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isPartnerCompleted
                    ? 'دیدگاه طرف مقابل با موفقیت ثبت شد'
                    : session.participantB
                    ? 'وارد جلسه شده و در حال نوشتن است'
                    : 'در انتظار ورود و ثبت دیدگاه'}
                </span>
              </div>
            </div>

            {isPartnerCompleted ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                تکمیل شده 🟢
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                منتظر طرف مقابل 🟡
              </span>
            )}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="pt-2 flex items-center gap-2 text-xs text-[#64748B]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>پاسخ‌های هیچ‌کدوم برای طرف مقابل فرستاده نمی‌شود تا سوگیری ایجاد نشود.</span>
        </div>
      </Card>

      {/* Ready for Joint Analysis Banner when both complete */}
      <AnimatePresence>
        {isReady && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white text-center space-y-3 shadow-lg shadow-purple-200"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>جلسه آماده تحلیل مشترک است</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold">
              هر دوتون آماده‌اید 🤍
            </h3>
            <p className="text-xs sm:text-sm text-purple-100 max-w-md mx-auto">
              دیدگاه هر دو نفر با موفقیت ثبت شد. سیستم آماده است تا نقطه مشترک و مقایسه دیدگاه‌ها را استخراج کند.
            </p>

            <div className="pt-2 max-w-sm mx-auto">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                className="bg-white text-purple-900 hover:bg-purple-50 font-extrabold shadow-md cursor-pointer"
                onClick={() => {
                  if (onProceedToComparison) {
                    onProceedToComparison();
                  } else {
                    onNotify('مشاهده تحلیل مشترک 🤍', 'info');
                  }
                }}
              >
                مشاهده تحلیل مشترک ✨
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Session Confirmation Modal */}
      <LeaveSessionModal
        isOpen={isLeaveModalOpen}
        isLoading={isLeaving}
        onConfirm={handleConfirmLeave}
        onCancel={() => setIsLeaveModalOpen(false)}
      />
    </div>
  );
};
