import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  Sparkles,
  User,
  Users,
  Plus,
  Tag,
  Trash2,
  Clock,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { SavedConflictRecord } from '../types';

interface HistoryViewProps {
  historyItems: SavedConflictRecord[];
  onSelectHistoryItem: (item: SavedConflictRecord) => void;
  onDeleteItem: (id: string) => void;
  onStartNew: () => void;
  onNotify: (msg: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyItems,
  onSelectHistoryItem,
  onDeleteItem,
  onStartNew,
  onNotify,
}) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDeleteItem(deleteTargetId);
      onNotify('تحلیل با موفقیت حذف شد');
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#2D2A32] flex items-center gap-2">
            <History className="w-6 h-6 text-[#7E57C2]" />
            <span>تاریخچه تحلیل‌ها</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            مرور یادگیری‌ها و بینش‌های جلسات گفت‌وگوی گذشته
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={onStartNew}
          icon={<Plus className="w-4 h-4" />}
        >
          تحلیل جدید
        </Button>
      </div>

      {/* History Items List or Empty State */}
      {historyItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4 space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <span className="text-3xl">🤍</span>
          </div>

          <h3 className="text-xl font-extrabold text-[#2D2A32]">
            هنوز تحلیلی نداری 🤍
          </h3>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
            هر زمان که بحث یا اختلافی پیش آمد، می‌توانید شرح ماجرا را ثبت کنید تا تحلیل و پاسخ‌های آرامش‌بخش را دریافت و ذخیره نمایید.
          </p>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onStartNew}
              icon={<Plus className="w-4 h-4" />}
            >
              شروع اولین تحلیل
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {historyItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card
                  hoverEffect
                  className="bg-white border-purple-100/90 relative group p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs md:text-sm font-bold text-[#2D2A32]">
                        {item.category ? `موضوع: ${item.category}` : 'تحلیل ماجرا'}
                      </span>

                      {item.category && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                          <Tag className="w-3 h-3" />
                          {item.category}
                        </span>
                      )}

                      {item.emotion && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-pink-50 text-purple-800 font-medium">
                          <span>حس:</span>
                          {item.emotion}
                        </span>
                      )}

                      {item.gender && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 font-medium">
                          <span>{item.gender === 'female' ? '👩 دختر' : '👨 پسر'}</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.mode === 'couple' ? (
                          <>
                            <Users className="w-3 h-3 text-pink-600" />
                            <span>دونفره</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 text-purple-600" />
                            <span>شخصی</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.date}
                      </span>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(item.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="حذف تحلیل"
                        aria-label="حذف تحلیل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Story summary snippet */}
                  <p className="text-xs text-[#64748B] leading-relaxed mb-3 line-clamp-2">
                    {item.story}
                  </p>

                  {/* Key Insight / Common need badge */}
                  {item.analysis?.commonNeed && (
                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100/80 flex items-start gap-2 text-xs text-purple-950 font-medium mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        نیاز مشترک: {item.analysis.commonNeed}
                      </span>
                    </div>
                  )}

                  {/* Click to view details button */}
                  <div className="pt-2 border-t border-purple-50 flex items-center justify-between">
                    <span className="text-[11px] text-purple-700 font-semibold group-hover:underline flex items-center gap-1 cursor-pointer">
                      <span>مشاهده کامل تحلیل و پیام‌ها</span>
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSelectHistoryItem(item)}
                      className="text-xs"
                    >
                      باز کردن
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="مطمئنی می‌خوای این تحلیل رو حذف کنی؟"
        description="این اطلاعات از حافظه دستگاه شما پاک خواهد شد و قابل بازگشت نیست."
        confirmLabel="حذف"
        cancelLabel="انصراف"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
