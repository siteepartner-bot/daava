import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title = 'مطمئنی می‌خوای این تحلیل رو حذف کنی؟',
  description = 'این اطلاعات از حافظه دستگاه شما پاک خواهد شد و قابل بازگشت نیست.',
  confirmLabel = 'حذف',
  cancelLabel = 'انصراف',
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 border border-purple-100 shadow-2xl z-10 text-center space-y-4"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#2D2A32] mb-1.5">
                {title}
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {description}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-1/2"
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="danger"
                size="md"
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
