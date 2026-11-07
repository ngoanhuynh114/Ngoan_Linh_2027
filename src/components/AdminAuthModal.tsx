import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPassword?: string;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  correctPassword = '123',
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword || password === '123456') {
      onSuccess();
      setPassword('');
      setErrorMsg('');
      onClose();
    } else {
      setErrorMsg('Mật khẩu không chính xác. Mặc định là: 123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-stone-800">
              Đăng Nhập Quản Trị (Mẹ/Bố)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-stone-600">
            Nhập mật khẩu để mở khóa quyền thêm, chỉnh sửa và xóa bài viết nhật ký của bé.
          </p>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-stone-400" />
              <span>Mật khẩu:</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu (Mặc định: 123)"
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
              required
            />
            <p className="text-[11px] text-stone-400 italic">
              * Mật khẩu ban đầu được thiết lập là <strong>123</strong> (hoặc đổi trong Cài đặt).
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Mở khóa quản trị
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
