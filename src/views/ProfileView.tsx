import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Mail, FileText, Users, LogOut, Trash2, Edit3, Check, X, Shield, ArrowRight } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { User, UserStats, updateUserProfile, deleteUserAccount, logoutUser } from '../services/authService';

interface ProfileViewProps {
  user: User;
  stats?: UserStats | null;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onBack: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  stats,
  onUpdateUser,
  onLogout,
  onBack,
  addToast,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveName = async () => {
    if (!newName.trim()) {
      addToast('نام نمی‌تواند خالی باشد.', 'error');
      return;
    }
    setIsUpdating(true);
    try {
      const res = await updateUserProfile(newName.trim());
      if (res.user) {
        onUpdateUser(res.user);
        setIsEditingName(false);
        addToast('نام با موفقیت بروزرسانی شد 🤍', 'success');
      }
    } catch (err: any) {
      addToast(err?.message || 'خطا در بروزرسانی نام.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmLogout = async () => {
    await logoutUser();
    addToast('با موفقیت از حساب خارج شدید 🤍', 'info');
    onLogout();
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAccount();
      addToast('حساب کاربری شما با موفقیت حذف شد.', 'info');
      onLogout();
    } catch (err: any) {
      addToast(err?.message || 'خطا در حذف حساب.', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-xl mx-auto pb-12"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium py-1 px-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowRight size={18} />
          <span>بازگشت</span>
        </button>
        <h1 className="text-xl font-bold text-slate-800">پروفایل من</h1>
        <div className="w-8" />
      </div>

      {/* User Card Header */}
      <Card className="p-6 space-y-6 border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div className="flex-1 space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  placeholder="نام یا لقب..."
                />
                <button
                  onClick={handleSaveName}
                  disabled={isUpdating}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setNewName(user.name);
                  }}
                  className="p-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                  title="ویرایش نام"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1 font-mono" dir="ltr">
              <Mail size={13} className="text-slate-400" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200/60">
          <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800">
                {stats?.personalAnalysesCount ?? 0}
              </span>
              <p className="text-xs text-slate-500">تحلیلهای شخصی</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-800">
                {stats?.coupleSessionsCount ?? 0}
              </span>
              <p className="text-xs text-slate-500">جلسات دونفره</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Account Info Card */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Shield size={16} className="text-indigo-600" />
          <span>اطلاعات امنیتی و حریم خصوصی</span>
        </h3>
        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span>شناسه کاربری:</span>
            <span className="font-mono text-slate-500">{user.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span>تاریخ عضویت:</span>
            <span>
              {new Date(user.createdAt).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className="text-slate-500 leading-relaxed pt-1">
            🔒 تمامی تحلیلهای شما با رمزنگاری پیشرفته در دیتابیس امن ذخیره میشوند و هیچ شخص ثالثی به آنها دسترسی نخواهد داشت.
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <Button
          variant="secondary"
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 text-slate-700 hover:text-slate-900 border-slate-200"
        >
          <LogOut size={18} className="text-amber-600" />
          <span>خروج از حساب کاربری</span>
        </Button>

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full py-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <Trash2 size={15} />
          <span>حذف حساب کاربری</span>
        </button>
      </div>

      {/* Logout Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="خروج از حساب کاربری"
        description="آیا مطمئنی می‌خواهی از حسابت خارج شوی؟ برای دسترسی دوباره باید اطلاعات ورود خود را وارد کنی."
        confirmText="بله، خروج"
        cancelText="انصراف"
        variant="warning"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* Delete Account Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="حذف دائمی حساب کاربری"
        description="مطمئنی می‌خوای حسابت رو حذف کنی؟ با حذف حساب، تمامی تحلیل‌های شخصی و اطلاعات کاربری شما به صورت دائمی حذف خواهند شد و قابل بازگشت نخواهند بود."
        confirmText={isDeleting ? 'در حال حذف...' : 'حذف کامل حساب'}
        cancelText="انصراف"
        variant="danger"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </motion.div>
  );
};
