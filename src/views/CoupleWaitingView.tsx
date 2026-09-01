import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Sparkles,
  LogOut,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LeaveSessionModal } from '../components/LeaveSessionModal';
import { CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';
import { getCoupleSessionStatus, leaveCoupleSession } from '../services/coupleService';

interface CoupleWaitingViewProps {
  session: CoupleSessionPublicState;
  auth: LocalCoupleSessionAuth;
  onSessionUpdated: (session: CoupleSessionPublicState) => void;
  onProceedToComparison?: () => void;
  onLeaveSession: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CoupleWaitingView: React.FC<CoupleWaitingViewProps> = ({
  session,
  auth,
  onSessionUpdated,
  onProceedToComparison,
  onLeaveSession,
  onNotify,
}) => {
  const [isPollingLoading, setIsPollingLoading] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

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

  const isRoleA = auth.role === 'participantA';
  const isMyCompleted = isRoleA ? session.isParticipantACompleted : session.isParticipantBCompleted;
  const isPartnerCompleted = isRoleA ? session.isParticipantBCompleted : session.isParticipantACompleted;
  const myName = isRoleA ? session.participantA.name : (session.participantB?.name || auth.name || 'تو');
  const partnerName = isRoleA ? (session.participantB?.name || 'طرف مقابل') : session.participantA.name;
  const isReady = session.isReadyForAnalysis || (session.isParticipantACompleted && session.isParticipantBCompleted);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs bg-purple-100/80 text-purple-900 px-3 py-1.5 rounded-full font-medium">
          جلسه دونفره — کد {session.joinCode}
        </span>

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

      {/* Main Success / Waiting Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-200"
        >
          <CheckCircle2 className="w-8 h-8" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]">
          دیدگاهت ثبت شد ✓
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          {isReady
            ? 'هر دو دیدگاه با موفقیت دریافت شدند و جلسه آماده بررسی مشترک است.'
            : 'حالا منتظریم طرف مقابل هم دیدگاهش رو ثبت کنه.'}
        </p>
      </div>

      {/* Expired alert if any */}
      {sessionError && (
        <Card className="p-4 border-rose-300 bg-rose-50/80 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-rose-800 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{sessionError}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={onLeaveSession}>
            بازگشت به صفحه اصلی
          </Button>
        </Card>
      )}

      {/* Status Card */}
      <Card className="border-purple-100 bg-[#FAF8FC] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
            وضعیت دیدگاه‌ها:
          </h4>
          <span className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            همگام‌سازی لحظه‌ای
          </span>
        </div>

        <div className="space-y-3">
          {/* My status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs md:text-sm font-bold text-[#2D2A32] block">
                  {myName} (شما)
                </span>
                <span className="text-[11px] text-slate-500">دیدگاه شما ثبت و محفوظ شد</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              تو تکمیل کردی 🟢
            </span>
          </div>

          {/* Partner status */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-purple-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isPartnerCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {isPartnerCompleted ? <UserCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs md:text-sm font-bold text-[#2D2A32] block">
                  {partnerName}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isPartnerCompleted ? 'دیدگاه ثبت شده' : 'در انتظار ثبت دیدگاه'}
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
        <div className="pt-1 flex items-center gap-2 text-xs text-[#64748B]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>دیدگاه‌ها پس از تکمیل هر دو نفر به صورت هوشمند و محرمانه تحلیل می‌شوند.</span>
        </div>
      </Card>

      {/* Ready Banner when both complete */}
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
              دیدگاه هر دو نفر با موفقیت ثبت شد. سیستم آماده تحلیل دونفره است.
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

      {/* Leave Session Modal */}
      <LeaveSessionModal
        isOpen={isLeaveModalOpen}
        isLoading={isLeaving}
        onConfirm={handleConfirmLeave}
        onCancel={() => setIsLeaveModalOpen(false)}
      />
    </div>
  );
};
