import React from 'react';
import { 
  X, 
  Calendar, 
  Sparkles, 
  Heart, 
  Share2, 
  Edit3, 
  Trash2, 
  ExternalLink,
  Baby
} from 'lucide-react';
import { Memory } from '../types';
import { formatDateVN } from '../utils/dateUtils';

interface MemoryModalProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  onToggleLike: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  memory,
  isOpen,
  onClose,
  isAdmin,
  onEdit,
  onDelete,
  onToggleLike,
}) => {
  if (!isOpen || !memory) return null;

  const stageLabels: Record<string, string> = {
    pregnancy: '🤰 Thai kỳ',
    milestones: '👶 Cột mốc bé',
    daily: '📖 Nhật ký hằng ngày',
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: memory.title,
        text: `${memory.title} - ${memory.content}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${memory.title}\n\n${memory.content}\n${window.location.href}`);
      alert('Đã sao chép nội dung kỷ niệm vào bộ nhớ tạm!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-6">
        {/* Close Button Floating */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Top Section */}
        {memory.mediaType !== 'none' && memory.mediaUrl && (
          <div className="w-full bg-stone-950 flex items-center justify-center max-h-[50vh] overflow-hidden">
            {memory.mediaType === 'video' ? (
              <video
                src={memory.mediaUrl}
                controls
                autoPlay
                className="max-h-[50vh] w-full object-contain"
              />
            ) : (
              <img
                src={memory.mediaUrl}
                alt={memory.title}
                className="max-h-[50vh] w-full object-contain"
              />
            )}
          </div>
        )}

        {/* Story Details */}
        <div className="p-5 sm:p-7 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Stage & Milestone row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {stageLabels[memory.stage] || 'Kỷ niệm'}
              </span>

              {(memory.weekOrAge || memory.milestoneTag) && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{memory.weekOrAge || memory.milestoneTag}</span>
                </span>
              )}
            </div>

            <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{formatDateVN(memory.date)}</span>
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black text-stone-800 leading-tight">
            {memory.title}
          </h2>

          {/* Content */}
          <div className="text-sm sm:text-base text-stone-700 whitespace-pre-line leading-relaxed font-normal bg-rose-50/30 p-4 rounded-2xl border border-rose-100/60">
            {memory.content}
          </div>

          {/* Emotions */}
          {memory.emotions && memory.emotions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-stone-400 font-medium">Cảm xúc:</span>
              {memory.emotions.map((emo, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-pink-50 text-pink-700 text-xs font-semibold border border-pink-200"
                >
                  {emo}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-rose-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleLike(memory.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
              >
                <Heart className="w-4 h-4 fill-rose-500" />
                <span>Yêu thích ({memory.likes || 0})</span>
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-stone-500 hover:bg-stone-100 transition-colors"
                title="Chia sẻ kỷ niệm"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onEdit(memory);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa kỷ niệm "${memory.title}"?`)) {
                      onDelete(memory.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
