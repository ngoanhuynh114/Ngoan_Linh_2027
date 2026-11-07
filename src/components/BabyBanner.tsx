import React from 'react';
import { 
  Calendar, 
  Heart, 
  Camera, 
  Baby, 
  Sparkles, 
  Clock, 
  Image as ImageIcon,
  Award,
  ChevronRight
} from 'lucide-react';
import { BabyProfile } from '../types';
import { calculateBabyAge, calculatePregnancyProgress, formatDateVN } from '../utils/dateUtils';

interface BabyBannerProps {
  profile: BabyProfile;
  totalMemories: number;
  totalMediaCount: number;
  milestonesCount: number;
  onOpenSettings: () => void;
  onOpenAddMemory: () => void;
  isAdmin: boolean;
}

export const BabyBanner: React.FC<BabyBannerProps> = ({
  profile,
  totalMemories,
  totalMediaCount,
  milestonesCount,
  onOpenSettings,
  onOpenAddMemory,
  isAdmin,
}) => {
  const ageInfo = calculateBabyAge(profile.birthDate);
  const pregInfo = calculatePregnancyProgress(profile.dueDate);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50/40 to-teal-50/50 border border-rose-100/80 p-5 sm:p-8 shadow-sm">
      {/* Background soft decorative bubbles */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-rose-200/30 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-amber-200/30 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Avatar & Baby Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 w-full md:w-auto">
          {/* Avatar with pastel ring */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-rose-400 via-pink-300 to-amber-300 shadow-md">
              <img
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=400&q=80'}
                alt={profile.nickname}
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
            {isAdmin && (
              <button
                onClick={onOpenSettings}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors"
                title="Thay đổi ảnh đại diện bé"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Titles & Names */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-rose-200/60 shadow-2xs text-xs font-semibold text-rose-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{profile.parentNames || 'Hành trình yêu thương của Mẹ & Bố'}</span>
            </div>

            <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-800 tracking-tight">
                {profile.nickname || 'Bé Yêu'}
              </h2>
              {profile.name && (
                <span className="text-sm font-medium text-stone-500">
                  ({profile.name})
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-stone-600 font-handwriting text-lg leading-none text-rose-500">
              "Từng ngày con lớn lên là từng ngày ngập tràn phép màu"
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-stone-500">
              {profile.isBorn ? (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>Ngày sinh: {formatDateVN(profile.birthDate || '')}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-500" />
                  <span>Dự sinh: {formatDateVN(profile.dueDate || '')}</span>
                </span>
              )}

              <button
                onClick={onOpenSettings}
                className="text-rose-500 hover:text-rose-700 underline text-xs font-medium"
              >
                Chỉnh sửa thông tin
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Age Calculator Card & Stats */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3">
          {/* Main Age Highlight Card */}
          <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-4 border border-rose-200/70 shadow-xs flex-1 sm:min-w-[240px]">
            {profile.isBorn ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span className="flex items-center gap-1 text-rose-500 font-semibold">
                    <Baby className="w-4 h-4" />
                    <span>Tuổi của bé hiện tại</span>
                  </span>
                  <span className="text-[11px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
                    {ageInfo.totalDays} ngày tuổi
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-stone-800 tracking-tight pt-1">
                  {ageInfo.formatted}
                </div>
                <p className="text-xs text-stone-500 italic">
                  {ageInfo.years > 0 ? `Đã đồng hành cùng mẹ được hơn ${ageInfo.years} năm!` : 'Em bé nhỏ xinh từng ngày khôn lớn'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span className="flex items-center gap-1 text-teal-600 font-semibold">
                    <Heart className="w-4 h-4 fill-teal-100" />
                    <span>Hành trình thai kỳ</span>
                  </span>
                  <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
                    Tam cá nguyệt {pregInfo.trimester}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-stone-800 tracking-tight pt-1">
                  {pregInfo.formatted}
                </div>
                <p className="text-xs text-stone-600">
                  Kích thước: <strong className="text-teal-700">{pregInfo.babyFruitComparison}</strong> (còn {pregInfo.daysRemaining} ngày)
                </p>
              </div>
            )}
          </div>

          {/* Quick Counter Badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <div className="bg-white/90 rounded-2xl p-2.5 sm:p-3 text-center border border-rose-100 shadow-2xs">
              <div className="text-lg sm:text-xl font-bold text-rose-600">{totalMemories}</div>
              <div className="text-[11px] font-medium text-stone-500">Kỷ niệm</div>
            </div>
            <div className="bg-white/90 rounded-2xl p-2.5 sm:p-3 text-center border border-amber-100 shadow-2xs">
              <div className="text-lg sm:text-xl font-bold text-amber-600">{totalMediaCount}</div>
              <div className="text-[11px] font-medium text-stone-500">Ảnh / Video</div>
            </div>
            <div className="bg-white/90 rounded-2xl p-2.5 sm:p-3 text-center border border-teal-100 shadow-2xs">
              <div className="text-lg sm:text-xl font-bold text-teal-600">{milestonesCount}</div>
              <div className="text-[11px] font-medium text-stone-500">Cột mốc</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
