import React from 'react';
import { Card } from './Card';
import { Lightbulb, Handshake, Heart, User, Users } from 'lucide-react';

interface CoupleComparisonProps {
  comparisonData?: {
    userSummary: {
      mainEmotion: string;
      desiredNeed: string;
      perceivedMessage: string;
    };
    partnerSummary: {
      mainEmotion: string;
      desiredNeed: string;
      perceivedMessage: string;
    };
    commonGround: string;
    sampleDialogue: {
      speaker: 'user' | 'partner';
      name: string;
      text: string;
    }[];
  };
  className?: string;
}

export const CoupleComparison: React.FC<CoupleComparisonProps> = ({
  comparisonData = {
    userSummary: {
      mainEmotion: 'ناراحتی و دلخوری',
      desiredNeed: 'توجه و امنیت عاطفی',
      perceivedMessage: 'بی‌اهمیتی و نادیده گرفته شدن',
    },
    partnerSummary: {
      mainEmotion: 'ناامیدی و خستگی',
      desiredNeed: 'اطمینان، آرامش و درک شرایط',
      perceivedMessage: 'سرزنش و فشار',
    },
    commonGround:
      'هر دو نفر می‌خواستید احساس کنید برای طرف مقابل مهم و ارزشمند هستید و رابطه در اولویت است.',
    sampleDialogue: [
      {
        speaker: 'user',
        name: 'تو',
        text: 'من عذرخواهی می‌کنم اگر لحنم تند شد. وقتی چند ساعت بی‌خبر موندم حس کردم برات مهم نیستم.',
      },
      {
        speaker: 'partner',
        name: 'طرف مقابل',
        text: 'ممنونم که گفتی. من درگیر کار بودم، اما متوجه شدم بی‌خبری نگرانت کرده و باید زودتر خبر می‌دادم.',
      },
      {
        speaker: 'user',
        name: 'تو',
        text: 'بیا قرار بذاریم از این به بعد حتی اگر سرمون شلوغ بود فقط یک پیام ۵ ثانیه‌ای بدیم.',
      },
      {
        speaker: 'partner',
        name: 'طرف مقابل',
        text: 'خیلی ایده خوبیه. تو برام اولویتی و دوست ندارم حس تنهایی بکنی.',
      },
    ],
  },
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comparison Table / Matrix */}
      <Card className="overflow-hidden p-0 border-purple-200">
        <div className="p-4 md:p-5 bg-gradient-to-r from-purple-50 via-pink-50/40 to-purple-50 border-b border-purple-100 flex items-center justify-between">
          <h4 className="text-sm md:text-base font-bold text-[#2D2A32]">
            جدول مقایسه دیدگاه‌های دو طرف
          </h4>
          <span className="text-xs text-purple-700 bg-white/80 px-2.5 py-1 rounded-full border border-purple-100">
            تحلیل بی‌طرفانه
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FAF8FC] border-b border-purple-100/70 text-xs md:text-sm text-[#64748B]">
                <th className="py-3 px-4 font-semibold w-1/3">معیار بررسی</th>
                <th className="py-3 px-4 font-semibold text-purple-900 w-1/3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>نفر اول (تو)</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-pink-900 w-1/3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-pink-600" />
                    <span>نفر دوم (طرف مقابل)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/50 text-xs md:text-sm">
              <tr className="hover:bg-purple-50/20 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-700 bg-slate-50/40">
                  احساس اصلی
                </td>
                <td className="py-3.5 px-4 text-purple-950 font-medium">
                  {comparisonData.userSummary.mainEmotion}
                </td>
                <td className="py-3.5 px-4 text-pink-950 font-medium">
                  {comparisonData.partnerSummary.mainEmotion}
                </td>
              </tr>
              <tr className="hover:bg-purple-50/20 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-700 bg-slate-50/40">
                  چیزی که می‌خواست
                </td>
                <td className="py-3.5 px-4 text-[#2D2A32]">
                  {comparisonData.userSummary.desiredNeed}
                </td>
                <td className="py-3.5 px-4 text-[#2D2A32]">
                  {comparisonData.partnerSummary.desiredNeed}
                </td>
              </tr>
              <tr className="hover:bg-purple-50/20 transition-colors">
                <td className="py-3.5 px-4 font-medium text-slate-700 bg-slate-50/40">
                  چیزی که برداشت کرد
                </td>
                <td className="py-3.5 px-4 text-rose-900">
                  {comparisonData.userSummary.perceivedMessage}
                </td>
                <td className="py-3.5 px-4 text-amber-900">
                  {comparisonData.partnerSummary.perceivedMessage}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Common Ground Highlight Card */}
      <Card variant="accent" className="border-purple-200">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-200">
            <Lightbulb className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-purple-950 mb-1">
              💡 چیزی که بین هر دوتون مشترکه
            </h4>
            <p className="text-xs md:text-sm text-purple-900/90 leading-relaxed font-medium">
              «{comparisonData.commonGround}»
            </p>
          </div>
        </div>
      </Card>

      {/* Sample Dialogue Proposal */}
      <Card className="border-purple-100">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-100">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Handshake className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-[#2D2A32]">
              🤝 پیشنهاد برای شروع گفت‌وگو
            </h4>
            <p className="text-xs text-[#64748B]">نمونه مکالمه آرام برای شکستن یخ بحث</p>
          </div>
        </div>

        <div className="space-y-3">
          {comparisonData.sampleDialogue.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 items-end ${
                msg.speaker === 'user' ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.speaker === 'user'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-pink-100 text-pink-800 border border-pink-200'
                }`}
              >
                {msg.name === 'تو' ? 'تو' : 'او'}
              </div>
              <div
                className={`max-w-[82%] p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                  msg.speaker === 'user'
                    ? 'bg-[#7E57C2] text-white rounded-br-sm shadow-xs'
                    : 'bg-purple-50 text-slate-800 border border-purple-100 rounded-bl-sm'
                }`}
              >
                <div className="text-[10px] opacity-75 mb-0.5">{msg.name}</div>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
