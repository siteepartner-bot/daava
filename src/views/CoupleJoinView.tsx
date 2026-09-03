import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HeartHandshake, ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, KeyRound, ClipboardCheck } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CoupleSessionPublicState, LocalCoupleSessionAuth } from '../types';
import { joinCoupleSession } from '../services/coupleService';

interface CoupleJoinViewProps {
  initialCode?: string;
  onJoined: (session: CoupleSessionPublicState, auth: LocalCoupleSessionAuth) => void;
  onBack: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Convert Persian/Arabic digits to English digits
const normalizeDigits = (str: string): string => {
  const digitMap: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return str.replace(/[۰-۹٠-٩]/g, (d) => digitMap[d] || d);
};

// Clean join input (extracts code from URL if full link was pasted)
const parseJoinInput = (raw: string): string => {
  if (!raw) return '';
  let clean = raw.trim();

  // If full link or query was pasted
  if (clean.includes('join=') || clean.includes('code=')) {
    try {
      const url = clean.startsWith('http') ? new URL(clean) : new URL('http://dummy.com/' + clean.replace(/^\?/, ''));
      const found = url.searchParams.get('join') || url.searchParams.get('code');
      if (found) clean = found;
    } catch {
      const match = clean.match(/[?&](join|code)=([a-zA-Z0-9_-]+)/);
      if (match && match[2]) clean = match[2];
    }
  } else if (clean.includes('/join/')) {
    const parts = clean.split('/join/');
    if (parts[1]) clean = parts[1].split(/[/?#]/)[0];
  }

  return normalizeDigits(clean).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

export const CoupleJoinView: React.FC<CoupleJoinViewProps> = ({
  initialCode = '',
  onJoined,
  onBack,
  onNotify,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState(parseJoinInput(initialCode));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialCode) {
      setCode(parseJoinInput(initialCode));
    }
  }, [initialCode]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseJoinInput(e.target.value);
    setCode(parsed);
    if (errorMessage) setErrorMessage('');
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const parsed = parseJoinInput(text);
          if (parsed) {
            setCode(parsed);
            onNotify('کد جای‌گذاری شد ✓', 'info');
            if (errorMessage) setErrorMessage('');
          }
        }
      }
    } catch {
      // Clipboard permissions or not supported
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanCode = parseJoinInput(code);
    if (!cleanCode) {
      setErrorMessage('لطفاً کد ۴ رقمی اتاق را وارد کنید 🤍');
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

      onNotify('با موفقیت وارد اتاق شدی 🤍', 'success');
      onJoined(result.session, {
        sessionId: result.session.id,
        joinCode: result.session.joinCode,
        role: result.role,
        token: result.token,
        name: cleanName,
      });
    } catch (err: any) {
      console.error('Error joining couple session:', err);
      setErrorMessage(err?.message || 'جلسه‌ای با این کد ۴ رقمی پیدا نشد یا منقضی شده است 🤍');
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

        <span className="text-xs bg-purple-100/80 text-purple-900 px-3 py-1 rounded-full font-medium flex items-center gap-1">
          <KeyRound className="w-3.5 h-3.5 text-purple-700" />
          <span>ورود با کد ۴ رقمی</span>
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
          ورود به اتاق گفت‌وگو 🤍
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          کد ۴ رقمی که طرف مقابلت برات فرستاده رو وارد کن تا در محیطی امن و بدون قضاوت دیدگاهت رو بنویسی.
        </p>
      </div>

      {/* Join Card */}
      <Card className="border-purple-200 bg-white p-6 md:p-8 space-y-6">
        <form onSubmit={handleJoin} className="space-y-5">
          {/* Join Code Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs md:text-sm font-bold text-[#2D2A32] flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>کد ۴ رقمی اتاق:</span>
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] text-purple-700 hover:text-purple-900 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
              >
                <ClipboardCheck className="w-3 h-3" />
                <span>جای‌گذاری از کلیپ‌بورد</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={handleCodeChange}
                placeholder="مثلاً ۴۸۲۹ یا لینک کامل"
                maxLength={100}
                autoFocus
                style={{ direction: 'ltr', textAlign: 'center' }}
                className="w-full p-4 rounded-2xl bg-[#FAF8FC] border-2 border-purple-200 font-mono text-center text-2xl md:text-3xl font-extrabold tracking-widest text-purple-950 focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:bg-white transition-all uppercase placeholder:text-slate-300 placeholder:text-base placeholder:tracking-normal"
              />
            </div>
            <span className="text-[11px] text-[#64748B] mt-1.5 block text-center">
              می‌توانی کد ۴ رقمی یا کل لینک دعوت را در اینجا وارد کنی.
            </span>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-[#2D2A32] mb-1.5">
              اسم یا لقب شما در اتاق:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="مثلاً نیوشا، علی یا من"
              maxLength={30}
              className="w-full p-3.5 rounded-2xl bg-[#FAF8FC] border border-purple-200/80 text-sm md:text-base text-[#2D2A32] focus:outline-none focus:ring-2 focus:ring-[#7E57C2] focus:bg-white transition-all"
            />
            <span className="text-[11px] text-[#64748B] mt-1 block">
              این نام فقط برای مشخص کردن پیام‌ها در این جلسه است.
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
              disabled={isSubmitting || !code.trim()}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              {isSubmitting ? 'در حال بررسی کد و ورود...' : 'ورود به اتاق و ثبت دیدگاه'}
            </Button>
          </div>
        </form>

        {/* Security & Neutrality Assurance */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-[#64748B] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <span>
            دیدگاه شما تا قبل از ثبت دیدگاه طرف مقابل کاملاً محرمانه باقی می‌ماند و سیستم هوشمند بدون طرفداری هر دو نظر را مقایسه می‌کند.
          </span>
        </div>
      </Card>
    </div>
  );
};
