import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UserCheck,
  Clock,
  Send,
  MessageCircle,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface CoupleInviteViewProps {
  onPartnerJoined: () => void;
  onBack: () => void;
  onNotify: (msg: string) => void;
}

export const CoupleInviteView: React.FC<CoupleInviteViewProps> = ({
  onPartnerJoined,
  onBack,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<'pending' | 'completed'>('pending');
  const mockLink = 'https://aramkon.example/join/8X92KD';

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(mockLink);
    setCopied(true);
    onNotify('لینک اختصاصی دعوت کپی شد!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulatePartnerResponse = () => {
    setPartnerStatus('completed');
    onNotify('طرف مقابل به سوالات پاسخ داد! آماده مقایسه دیدگاه‌ها.');
    setTimeout(() => {
      onPartnerJoined();
    }, 1200);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'دعوت به گفت‌وگوی آرام در آرومش کن',
        text: 'سلام، می‌خوام بدون دعوا و با آرامش با هم حرف بزنیم. بیا در این لینک دیدگاهت رو بنویس:',
        url: mockLink,
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs md:text-sm text-[#64748B] hover:text-[#7E57C2] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>

        <span className="text-xs bg-purple-100/80 text-purple-900 px-3 py-1 rounded-full font-medium">
          تحلیل تعاملی دونفره
        </span>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-purple-200"
        >
          <Users className="w-7 h-7" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D2A32]">
          دعواتون رو دو نفره بررسی کنید
        </h2>
        <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
          هرکدومتون ماجرا رو جداگانه تعریف می‌کنید. پاسخ‌های طرف مقابل تا زمانی که هر دو نفر تمام نکنند نمایش داده نمی‌شود.
        </p>
      </div>

      {/* Dedicated Invite Link Card */}
      <Card className="border-purple-200 bg-white p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#2D2A32] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            <span>لینک اختصاصی شما</span>
          </span>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
            امن و یک‌بار مصرف
          </span>
        </div>

        {/* Link Box */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#FAF8FC] border border-purple-100 font-mono text-xs md:text-sm text-purple-900 dir-ltr select-all">
          <span className="truncate">{mockLink}</span>
          <Button
            size="sm"
            variant={copied ? 'success' : 'secondary'}
            onClick={handleCopyLink}
            icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'کپی شد' : 'کپی لینک'}
          </Button>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <Button
            variant="primary"
            onClick={handleShare}
            icon={<Share2 className="w-4 h-4" />}
            fullWidth
          >
            ارسال برای طرف مقابل
          </Button>
          <Button
            variant="soft-pink"
            onClick={handleCopyLink}
            icon={<MessageCircle className="w-4 h-4 text-purple-800" />}
            fullWidth
          >
            کپی متن دعوتنامه
          </Button>
        </div>
      </Card>

      {/* Real-time Status Card */}
      <Card className="border-purple-100 bg-[#FAF8FC] p-5">
        <h4 className="text-xs font-bold text-[#64748B] mb-3 uppercase tracking-wider">
          وضعیت شرکت‌کنندگان:
        </h4>

        <div className="space-y-3">
          {/* User Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-purple-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs md:text-sm font-bold text-[#2D2A32] block">
                  دیدگاه شما
                </span>
                <span className="text-[11px] text-slate-500">پاسخ‌ها ثبت و ذخیره شده</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              شما آماده‌اید 🟢
            </span>
          </div>

          {/* Partner Status */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-purple-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs md:text-sm font-bold text-[#2D2A32] block">
                  دیدگاه طرف مقابل
                </span>
                <span className="text-[11px] text-slate-500">
                  {partnerStatus === 'pending'
                    ? 'در انتظار ورود و ثبت دیدگاه'
                    : 'پاسخ‌ها با موفقیت ثبت شد'}
                </span>
              </div>
            </div>

            {partnerStatus === 'pending' ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                طرف مقابل هنوز پاسخ نداده ⚪
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                آماده مقایسه 🟢
              </span>
            )}
          </div>
        </div>

        {/* Prototype simulator control */}
        <div className="mt-5 pt-4 border-t border-purple-100/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-[#64748B]">
            برای تست پروتوتایپ دونفره، می‌توانید ورود طرف مقابل را شبیه‌سازی کنید:
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0"
            onClick={handleSimulatePartnerResponse}
            icon={<Sparkles className="w-3.5 h-3.5 text-purple-600" />}
          >
            شبیه‌سازی: طرف مقابل پاسخ داد ⚡
          </Button>
        </div>
      </Card>

      {/* Bottom Continue Action */}
      {partnerStatus === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-2"
        >
          <Button
            size="lg"
            variant="primary"
            fullWidth
            onClick={onPartnerJoined}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            مشاهده مقایسه و نتایج مشترک
          </Button>
        </motion.div>
      )}
    </div>
  );
};
