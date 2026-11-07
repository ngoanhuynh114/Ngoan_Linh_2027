import React, { useState } from 'react';
import { 
  Calendar, 
  Heart, 
  Play, 
  Maximize2, 
  Edit3, 
  Trash2, 
  Sparkles,
  Baby,
  Smile,
  CheckCircle2
} from 'lucide-react';
import { Memory } from '../types';
import { formatDateVN } from '../utils/dateUtils';

interface MemoryCardProps {
  memory: Memory;
  isAdmin: boolean;
  onViewDetail: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  onToggleLike: (id: string) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  isAdmin,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleLike,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  // Stage configuration
  const stageConfig = {
    pregnancy: {
      label: 'Thai kỳ',
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      dotColor: 'bg-teal-400',
      badgeBg: 'bg-teal-500',
      icon: '🤰',
    },
    milestones: {
      label: 'Cột mốc',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-400',
      badgeBg: 'bg-rose-500',
      icon: '👶',
    },
    daily: {
      label: 'Nhật ký hằng ngày',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      dotColor: 'bg-amber-400',
      badgeBg: 'bg-amber-500',
      icon: '📖',
    },
  }[memory.stage] || {
    label: 'Kỷ niệm',
    color: 'bg-stone-50 text-stone-700 border-stone-200',
    dotColor: 'bg-stone-400',
    badgeBg: 'bg-stone-500',
    icon: '✨',
  };

  const isLongContent = memory.content.length > 180;
  const displayedContent = isExpanded || !isLongContent
    ? memory.content
    : memory.content.slice(0, 180) + '...';

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasLiked(!hasLiked);
    onToggleLike(memory.id);
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-rose-100/90 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top Header: Date, Stage & Admin controls */}
      <div className="p-4 sm:p-5 pb-3 flex items-center justify-between gap-2 border-b border-rose-50/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stageConfig.color}`}>
            <span>{stageConfig.icon}</span>
            <span>{stageConfig.label}</span>
          </span>

          {/* Week or Age Tag */}
          {(memory.weekOrAge || memory.milestoneTag) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50/80 text-rose-600 border border-rose-100">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{memory.weekOrAge || memory.milestoneTag}</span>
            </span>
          )}
        </div>

        {/* Date & Admin Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-400 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{formatDateVN(memory.date)}</span>
          </span>

          {isAdmin && (
            <div className="flex items-center gap-1 ml-1 pl-2 border-l border-stone-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(memory);
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Chỉnh sửa bài viết"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Bạn có chắc muốn xóa kỷ niệm "${memory.title}"?`)) {
                    onDelete(memory.id);
                  }
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Xóa bài viết"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Box (Image or Video) */}
      {memory.mediaType !== 'none' && memory.mediaUrl && (
        <div 
          onClick={() => onViewDetail(memory)}
          className="relative w-full aspect-16/10 bg-stone-100 overflow-hidden cursor-pointer select-none"
        >
          {memory.mediaType === 'video' ? (
            <div className="w-full h-full relative group/video flex items-center justify-center bg-stone-900">
              <video
                src={memory.mediaUrl}
                className="w-full h-full object-cover opacity-90 group-hover/video:opacity-100 transition-opacity"
                controls={false}
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-lg group-hover/video:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-rose-600 ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-medium backdrop-blur-xs">
                Video
              </span>
            </div>
          ) : (
            <div className="w-full h-full relative group/img overflow-hidden">
              {!imageError ? (
                <img
                  src={memory.mediaUrl}
                  alt={memory.title}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 ease-out"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-rose-50/50 p-4 text-center">
                  <Baby className="w-8 h-8 text-rose-300 mb-1" />
                  <span className="text-xs">Ảnh lưu trữ trên Google Drive</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                <span className="px-3 py-1.5 rounded-full bg-white/90 text-stone-800 text-xs font-semibold shadow-md flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Xem chi tiết</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body: Title & Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <h3 
            onClick={() => onViewDetail(memory)}
            className="text-base sm:text-lg font-bold text-stone-800 hover:text-rose-600 cursor-pointer transition-colors leading-snug"
          >
            {memory.title}
          </h3>

          <div className="text-sm text-stone-600 whitespace-pre-line leading-relaxed font-normal">
            {displayedContent}
            {isLongContent && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-rose-500 hover:text-rose-700 text-xs font-semibold ml-1.5 focus:outline-hidden"
              >
                {isExpanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </div>
        </div>

        {/* Emotions and Reactions */}
        <div className="pt-4 mt-3 border-t border-rose-50 flex items-center justify-between gap-2">
          {/* Emotions pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {memory.emotions && memory.emotions.length > 0 ? (
              memory.emotions.map((emo, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-pink-50/80 text-pink-700 text-[11px] font-medium border border-pink-100/80"
                >
                  {emo}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-stone-400 italic font-handwriting text-base">
                Khoảnh khắc ngọt ngào
              </span>
            )}
          </div>

          {/* Like / Heart reaction */}
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              hasLiked
                ? 'bg-rose-100 text-rose-700 scale-105'
                : 'text-stone-500 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <Heart 
              className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}`} 
            />
            <span>{(memory.likes || 0) + (hasLiked ? 1 : 0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
