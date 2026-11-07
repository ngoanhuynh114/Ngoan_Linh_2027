import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Baby, 
  Calendar, 
  Heart, 
  Camera, 
  KeyRound, 
  Sparkles,
  Database
} from 'lucide-react';
import { BabyProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BabyProfile;
  onSaveProfile: (profile: BabyProfile) => void;
  onOpenGasModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onOpenGasModal,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [nickname, setNickname] = useState(profile.nickname || '');
  const [parentNames, setParentNames] = useState(profile.parentNames || '');
  const [isBorn, setIsBorn] = useState(profile.isBorn);
  const [birthDate, setBirthDate] = useState(profile.birthDate || '');
  const [dueDate, setDueDate] = useState(profile.dueDate || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [adminPassword, setAdminPassword] = useState(profile.adminPassword || '123');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim(),
      nickname: nickname.trim() || 'Bé Yêu',
      parentNames: parentNames.trim(),
      isBorn,
      birthDate: isBorn ? birthDate : undefined,
      dueDate: !isBorn ? dueDate : profile.dueDate,
      avatarUrl: avatarUrl.trim(),
      adminPassword: adminPassword.trim() || '123',
    });
    onClose();
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Baby className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-800">
                Cài Đặt Thông Tin Bé & Gia Đình
              </h3>
              <p className="text-xs text-rose-500 font-medium">
                Tùy chỉnh tên, ngày sinh/dự sinh và mật khẩu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Avatar preview & change */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-rose-50/40 border border-rose-100">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-rose-300 shrink-0">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=200&q=80'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-semibold text-stone-700 block">
                Ảnh đại diện của bé
              </label>
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chọn ảnh từ máy</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Nickname & Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                Tên gọi ở nhà (Nickname) *
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="VD: Bé Xù, Thỏ Con, Bắp Cải..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                Họ và tên khai sinh của bé
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Đặng Ngọc Minh Thư"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Parents' names */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">
              Tên Bố & Mẹ
            </label>
            <input
              type="text"
              value={parentNames}
              onChange={(e) => setParentNames(e.target.value)}
              placeholder="VD: Mẹ Lan & Bố Hải"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
            />
          </div>

          {/* Status Switcher (Born vs Pregnant) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">
              Trạng thái hiện tại
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsBorn(true)}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all ${
                  isBorn
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-2xs font-bold'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                👶 Bé đã chào đời
              </button>
              <button
                type="button"
                onClick={() => setIsBorn(false)}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all ${
                  !isBorn
                    ? 'bg-teal-50 border-teal-400 text-teal-800 shadow-2xs font-bold'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                🤰 Đang mang thai
              </button>
            </div>
          </div>

          {/* Birth Date or Due Date */}
          {isBorn ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Ngày bé cất tiếng khóc chào đời *</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
                required
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-500" />
                <span>Ngày dự kiến sinh (Due Date) *</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-teal-400 focus:outline-hidden"
                required
              />
            </div>
          )}

          {/* Admin Password */}
          <div className="space-y-1 pt-2 border-t border-stone-100">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Mật khẩu quản trị dành cho Mẹ/Bố</span>
            </label>
            <input
              type="text"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="VD: 123 hoặc mật khẩu tùy chọn"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
              required
            />
            <p className="text-[11px] text-stone-400">
              Dùng để mở khóa quyền thêm, sửa và xóa bài viết trên thiết bị. Mặc định: <strong>123</strong>.
            </p>
          </div>

          {/* Google Apps Script shortcut button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGasModal();
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Cấu hình kết nối Google Apps Script & Sheets</span>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-rose-50 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs sm:text-sm font-semibold shadow-xs hover:from-rose-600 hover:to-pink-600 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Lưu thông tin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
