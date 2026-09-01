import React, { useState } from 'react';
import { Card } from './Card';
import {
  Scale,
  FileText,
  Lightbulb,
  Handshake,
  Heart,
  User,
  Users,
  Copy,
  Check,
  GitCompare,
  AlertCircle,
  Sparkles,
  Compass,
  Zap,
} from 'lucide-react';
import { CoupleSharedAnalysis, MainDifferenceItem } from '../types';

interface CoupleComparisonProps {
  sharedAnalysis?: CoupleSharedAnalysis;
  participantAName?: string;
  participantBName?: string;
  comparisonData?: any; // Backward compatibility
  className?: string;
  onCopyStarter?: (text: string) => void;
}

function normalizeAnalysisData(raw: any): CoupleSharedAnalysis | null {
  if (!raw) return null;

  let data = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (typeof data !== 'object' || !data) return null;

  // Unwrap nested wrappers if present
  if (data.sharedAnalysis) data = data.sharedAnalysis;
  else if (data.analysis) data = data.analysis;
  else if (data.result) data = data.result;
  else if (data.data) data = data.data;

  if (typeof data !== 'object' || !data) return null;

  const overallSummary =
    data.overallSummary ||
    data.overall_summary ||
    data.summary ||
    data.overview ||
    data.description ||
    '';

  const fairAssessment =
    data.fairAssessment ||
    data.fair_assessment ||
    data.impartialAssessment ||
    data.assessment ||
    '';

  const sharedNeed =
    data.sharedNeed ||
    data.shared_need ||
    data.coreNeed ||
    data.underlyingNeed ||
    '';

  const nextStep =
    data.nextStep ||
    data.next_step ||
    data.actionPlan ||
    data.recommendation ||
    '';

  const conversationStarter =
    data.conversationStarter ||
    data.conversation_starter ||
    data.starter ||
    data.suggestedStarter ||
    '';

  const commonGround = Array.isArray(data.commonGround)
    ? data.commonGround
    : Array.isArray(data.common_ground)
    ? data.common_ground
    : [];

  const possibleMisunderstandings = Array.isArray(data.possibleMisunderstandings)
    ? data.possibleMisunderstandings
    : Array.isArray(data.possible_misunderstandings)
    ? data.possible_misunderstandings
    : [];

  const escalationPattern = Array.isArray(data.escalationPattern)
    ? data.escalationPattern
    : Array.isArray(data.escalation_pattern)
    ? data.escalation_pattern
    : [];

  const rawDiffs =
    data.mainDifferences ||
    data.main_differences ||
    data.differences ||
    data.differencesMatrix ||
    [];

  const mainDifferences = Array.isArray(rawDiffs)
    ? rawDiffs.map((item: any, idx: number) => {
        if (typeof item === 'string') {
          return {
            topic: `نقطه اختلاف ${idx + 1}`,
            participantA: item,
            participantB: '',
          };
        }
        if (typeof item === 'object' && item !== null) {
          return {
            topic: item.topic || item.subject || `مورد ${idx + 1}`,
            participantA:
              item.participantA ||
              item.participant_a ||
              item.personA ||
              item.person_a ||
              item.pA ||
              '',
            participantB:
              item.participantB ||
              item.participant_b ||
              item.personB ||
              item.person_b ||
              item.pB ||
              '',
          };
        }
        return { topic: `مورد ${idx + 1}`, participantA: String(item), participantB: '' };
      })
    : [];

  const parseParticipant = (pData: any) => {
    if (!pData || typeof pData !== 'object') return undefined;
    return {
      emotion: pData.emotion || pData.feeling || 'نامشخص',
      possibleNeed:
        pData.possibleNeed || pData.possible_need || pData.need || pData.underlyingNeed || '',
      behaviorToImprove:
        pData.behaviorToImprove ||
        pData.behavior_to_improve ||
        pData.improvement ||
        pData.growthArea ||
        '',
    };
  };

  const participantA = parseParticipant(
    data.participantA || data.participant_a || data.personA || data.person_a
  );

  const participantB = parseParticipant(
    data.participantB || data.participant_b || data.personB || data.person_b
  );

  return {
    overallSummary,
    fairAssessment,
    sharedNeed,
    nextStep,
    conversationStarter,
    commonGround,
    possibleMisunderstandings,
    escalationPattern,
    mainDifferences,
    participantA,
    participantB,
  };
}

export const CoupleComparison: React.FC<CoupleComparisonProps> = ({
  sharedAnalysis: rawSharedAnalysis,
  participantAName = 'نفر اول',
  participantBName = 'نفر دوم',
  className = '',
  onCopyStarter,
}) => {
  const [copiedStarter, setCopiedStarter] = useState(false);

  const sharedAnalysis = normalizeAnalysisData(rawSharedAnalysis);

  // Fallback if legacy comparisonData is provided without sharedAnalysis
  if (!sharedAnalysis) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="overflow-hidden p-0 border-purple-200">
          <div className="p-4 md:p-5 bg-gradient-to-r from-purple-50 via-pink-50/40 to-purple-50 border-b border-purple-100 flex items-center justify-between">
            <h4 className="text-sm md:text-base font-bold text-[#2D2A32]">
              جدول مقایسه دیدگاه‌های دو طرف
            </h4>
            <span className="text-xs text-purple-700 bg-white/80 px-2.5 py-1 rounded-full border border-purple-100">
              تحلیل بی‌طرفانه
            </span>
          </div>
          <div className="p-5 text-sm text-slate-600">
            تحلیل مشترک هنوز بارگذاری نشده است.
          </div>
        </Card>
      </div>
    );
  }

  const {
    overallSummary,
    commonGround = [],
    mainDifferences = [],
    possibleMisunderstandings = [],
    participantA,
    participantB,
    escalationPattern = [],
    sharedNeed,
    fairAssessment,
    nextStep,
    conversationStarter,
  } = sharedAnalysis;

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedStarter(true);
    if (onCopyStarter) onCopyStarter(text);
    setTimeout(() => setCopiedStarter(false), 2500);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Overall Neutral Summary */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/40 p-5 md:p-6 space-y-3">
        <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm md:text-base">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <h3>خلاصه اصل ماجرا (دیدگاه کلی)</h3>
        </div>
        <p className="text-xs sm:text-sm text-[#2D2A32] leading-relaxed font-medium">
          {overallSummary}
        </p>
      </Card>

      {/* 2. Impartial Fair Assessment */}
      {fairAssessment && (
        <Card className="border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm md:text-base">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <h4>بررسی منصفانه و بی‌طرفانه</h4>
          </div>
          <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
            {fairAssessment}
          </p>
        </Card>
      )}

      {/* 3. Differences Matrix (هر مورد را به شکل واضح نشان بده: دیدگاه نفر اول در مقابل دیدگاه نفر دوم) */}
      {mainDifferences && mainDifferences.length > 0 && (
        <Card className="overflow-hidden p-0 border-purple-200">
          <div className="p-4 md:p-5 bg-gradient-to-r from-purple-100/60 via-pink-50/40 to-purple-100/60 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-950 font-bold text-sm md:text-base">
              <GitCompare className="w-4 h-4 text-purple-700" />
              <span>تفاوت دیدگاه‌ها و برداشت‌ها</span>
            </div>
            <span className="text-[11px] text-purple-800 bg-white/90 px-2.5 py-1 rounded-full border border-purple-200 font-medium">
              مقایسه رویکردها
            </span>
          </div>

          <div className="divide-y divide-purple-100">
            {mainDifferences.map((diffItem, idx) => {
              const isObj = typeof diffItem === 'object' && diffItem !== null;
              const topic = isObj ? (diffItem as MainDifferenceItem).topic : `نقطه اختلاف ${idx + 1}`;
              const pAVal = isObj ? (diffItem as MainDifferenceItem).participantA : String(diffItem);
              const pBVal = isObj ? (diffItem as MainDifferenceItem).participantB : '';

              return (
                <div key={idx} className="p-4 md:p-5 space-y-3 hover:bg-purple-50/20 transition-colors">
                  {topic && (
                    <div className="inline-block px-3 py-1 rounded-lg bg-purple-100/80 text-purple-900 font-bold text-xs">
                      {topic}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Participant A View */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span>برداشت {participantAName}:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {pAVal}
                      </p>
                    </div>

                    {/* Participant B View */}
                    {pBVal && (
                      <div className="p-3.5 rounded-2xl bg-pink-50/80 border border-pink-100/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-pink-900">
                          <Users className="w-3.5 h-3.5 text-pink-600" />
                          <span>برداشت {participantBName}:</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                          {pBVal}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 4. Individual Participant Psychological Profiles */}
      {(participantA || participantB) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Participant A Card */}
          {participantA && (
            <Card className="border-purple-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-purple-950">
                  تحلیل اختصاصی {participantAName}
                </h4>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-purple-900 block text-xs mb-0.5">💭 احساس شناسایی‌شده:</span>
                  <span className="text-slate-800 bg-purple-50 px-2.5 py-1 rounded-lg inline-block font-medium">
                    {participantA.emotion}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-purple-900 block text-xs mb-0.5">🧩 نیاز احتمالی:</span>
                  <p className="text-slate-700 leading-relaxed">{participantA.possibleNeed}</p>
                </div>
                <div>
                  <span className="font-bold text-purple-900 block text-xs mb-0.5">🌱 رفتار قابل بهبود:</span>
                  <p className="text-slate-700 leading-relaxed">{participantA.behaviorToImprove}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Participant B Card */}
          {participantB && (
            <Card className="border-pink-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-pink-100 border-b">
                <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-pink-950">
                  تحلیل اختصاصی {participantBName}
                </h4>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-pink-900 block text-xs mb-0.5">💭 احساس شناسایی‌شده:</span>
                  <span className="text-slate-800 bg-pink-50 px-2.5 py-1 rounded-lg inline-block font-medium">
                    {participantB.emotion}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-pink-900 block text-xs mb-0.5">🧩 نیاز احتمالی:</span>
                  <p className="text-slate-700 leading-relaxed">{participantB.possibleNeed}</p>
                </div>
                <div>
                  <span className="font-bold text-pink-900 block text-xs mb-0.5">🌱 رفتار قابل بهبود:</span>
                  <p className="text-slate-700 leading-relaxed">{participantB.behaviorToImprove}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 5. Shared Need & Common Ground */}
      <Card variant="accent" className="border-purple-200 space-y-4">
        {sharedNeed && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-200">
              <Heart className="w-5 h-5 text-pink-200 fill-pink-200" />
            </div>
            <div>
              <h4 className="text-sm md:text-base font-bold text-purple-950 mb-1">
                ❤️ نیاز مشترک و بنیادین هر دو نفر
              </h4>
              <p className="text-xs sm:text-sm text-purple-900/90 leading-relaxed font-semibold">
                «{sharedNeed}»
              </p>
            </div>
          </div>
        )}

        {commonGround && commonGround.length > 0 && (
          <div className="pt-2 border-t border-purple-200/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>نقاط مشترک و خواسته‌های یکسان:</span>
            </div>
            <ul className="space-y-1.5 pl-2">
              {commonGround.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-purple-950">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* 6. Possible Misunderstandings */}
      {possibleMisunderstandings && possibleMisunderstandings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/40 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <h4>سوءتفاهم‌های احتمالی</h4>
          </div>
          <div className="space-y-2">
            {possibleMisunderstandings.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/80 border border-amber-200/80 text-xs sm:text-sm text-amber-950 leading-relaxed">
                🧩 {item}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 7. Escalation Pattern Timeline */}
      {escalationPattern && escalationPattern.length > 0 && (
        <Card className="border-purple-100 bg-[#FAF8FC] p-5 space-y-4">
          <div className="flex items-center gap-2 text-purple-950 font-bold text-sm md:text-base">
            <Zap className="w-4 h-4 text-amber-500" />
            <h4>زنجیره تشدید و روند شکل‌گیری اختلاف</h4>
          </div>

          <div className="relative border-r-2 border-purple-200 pr-4 space-y-3 my-2">
            {escalationPattern.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -right-[23px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white" />
                <div className="p-3 rounded-xl bg-white border border-purple-100 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <span className="font-bold text-purple-800 ml-1.5">مرحله {idx + 1}:</span>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 8. Next Step & Conversation Starter */}
      {(nextStep || conversationStarter) && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-5 md:p-6 space-y-4 shadow-md shadow-purple-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/20">
            <Handshake className="w-5 h-5 text-amber-300" />
            <h4 className="font-extrabold text-sm md:text-base">
              🤝 پیشنهاد عملی برای شروع گفتگو
            </h4>
          </div>

          {nextStep && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-purple-100 block">🌱 اقدام بعدی:</span>
              <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                {nextStep}
              </p>
            </div>
          )}

          {conversationStarter && (
            <div className="p-4 rounded-2xl bg-white/15 border border-white/20 space-y-2">
              <span className="text-xs font-bold text-amber-200 block">💬 جمله پیشنهادی برای شروع گفتگو:</span>
              <p className="text-sm sm:text-base font-extrabold text-white leading-relaxed">
                «{conversationStarter}»
              </p>
              <button
                onClick={() => handleCopy(conversationStarter)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold bg-white text-purple-900 hover:bg-purple-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                {copiedStarter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-purple-700" />}
                <span>{copiedStarter ? 'کپی شد ✓' : 'کپی این جمله'}</span>
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
