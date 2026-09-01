import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface LeaveSessionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const LeaveSessionModal: React.FC<LeaveSessionModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-purple-100 text-right space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D2A32]">
                مطمئنی می‌خوای از این جلسه خارج بشی؟
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                با خروج از جلسه، اطلاعات دیدگاه شما از این نشست دونفره خارج می‌شود.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-50">
            <Button
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              ادامه در جلسه
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
              icon={<LogOut className="w-3.5 h-3.5" />}
            >
              {isLoading ? 'در حال خروج...' : 'خروج از جلسه'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
