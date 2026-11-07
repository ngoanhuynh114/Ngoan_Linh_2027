import React from 'react';
import { 
  Heart, 
  Lock, 
  Unlock, 
  Settings, 
  Database, 
  PlusCircle, 
  FileCode, 
  Sparkles,
  CloudCheck,
  CloudOff,
  HelpCircle
} from 'lucide-react';
import { BabyProfile } from '../types';

interface HeaderProps {
  profile: BabyProfile;
  isAdmin: boolean;
  onOpenAdminAuth: () => void;
  onLogoutAdmin: () => void;
  onOpenAddMemory: () => void;
  onOpenGasModal: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  totalMemoriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  isAdmin,
  onOpenAdminAuth,
  onLogoutAdmin,
  onOpenAddMemory,
  onOpenGasModal,
  onOpenSettings,
  onOpenHelp,
  totalMemoriesCount,
}) => {
  const isGasConnected = Boolean(profile.gasWebAppUrl && profile.gasWebAppUrl.trim().length > 10);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-rose-100 shadow-xs transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 via-pink-300 to-amber-200 flex items-center justify-center shadow-sm text-white shrink-0">
            <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base sm:text-lg text-stone-800 leading-tight">
                Nhật Ký Mẹ & Bé
              </h1>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-rose-500 font-medium hidden sm:block">
              Hành trình yêu thương của {profile.nickname || 'Bé yêu'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* GAS Status Pill */}
          <button
            onClick={onOpenGasModal}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isGasConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title={isGasConnected ? 'Đã kết nối Google Sheets & Drive' : 'Đang dùng lưu trữ cục bộ. Nhấn để đồng bộ Google Sheets'}
          >
            {isGasConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Google Sheets: Kết nối</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Google Apps Script</span>
              </>
            )}
          </button>

          {/* Code.gs & Guide button */}
          <button
            onClick={onOpenGasModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
            title="Xem mã nguồn Code.gs & Hướng dẫn kết nối Google Sheets"
          >
            <FileCode className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Code.gs & API</span>
          </button>

          {/* Add Memory Button (prominent) */}
          <button
            onClick={onOpenAddMemory}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm hover:from-rose-600 hover:to-pink-600 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm kỷ niệm</span>
          </button>

          {/* Admin toggle */}
          {isAdmin ? (
            <button
              onClick={onLogoutAdmin}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200 transition-colors"
              title="Đang ở chế độ Quản trị (Mẹ/Bố). Nhấn để thoát."
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline text-emerald-700">Mẹ & Bố</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminAuth}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 transition-colors"
              title="Đăng nhập dành cho Mẹ/Bố"
            >
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Quản trị</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-700 hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-colors"
            title="Cài đặt thông tin bé"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Help & Guide */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1 p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 transition-colors text-xs font-semibold"
            title="Hướng dẫn sử dụng app"
          >
            <HelpCircle className="w-4 h-4 text-rose-500" />
            <span className="hidden lg:inline">Hướng dẫn</span>
          </button>
        </div>
      </div>
    </header>
  );
};
