import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Video, 
  Calendar, 
  Sparkles, 
  Check, 
  Trash2, 
  AlertCircle,
  Loader2,
  Heart
} from 'lucide-react';
import { Memory, MediaType, StageType } from '../types';
import { MILESTONE_PRESETS } from '../mockData';

interface AddEditMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memoryData: Partial<Memory>, fileData?: { base64: string; name: string; mimeType: string }) => Promise<void>;
  editingMemory?: Memory | null;
  babyBirthDate?: string;
  babyDueDate?: string;
  isGasConnected: boolean;
}

const EMOTION_OPTIONS = [
  'Hạnh phúc ❤️',
  'Xúc động 🥹',
  'Yêu thương 💕',
  'Đáng yêu 🥰',
  'Tự hào 🌟',
  'Kỳ diệu ✨',
  'Hồi hộp 💓',
  'Biết ơn 🌸',
];

export const AddEditMemoryModal: React.FC<AddEditMemoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMemory,
  babyBirthDate,
  babyDueDate,
  isGasConnected,
}) => {
  const [stage, setStage] = useState<StageType>('milestones');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [milestoneTag, setMilestoneTag] = useState('');
  const [weekOrAge, setWeekOrAge] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [emotions, setEmotions] = useState<string[]>(['Hạnh phúc ❤️']);

  // File upload states
  const [fileToUpload, setFileToUpload] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    name: string;
    mimeType: string;
    sizeKb: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Populate data when editing
  useEffect(() => {
    if (editingMemory) {
      setStage(editingMemory.stage || 'milestones');
      setDate(editingMemory.date || new Date().toISOString().split('T')[0]);
      setTitle(editingMemory.title || '');
      setContent(editingMemory.content || '');
      setMilestoneTag(editingMemory.milestoneTag || '');
      setWeekOrAge(editingMemory.weekOrAge || '');
      setMediaType(editingMemory.mediaType || 'none');
      setMediaUrl(editingMemory.mediaUrl || '');
      setEmotions(editingMemory.emotions || ['Hạnh phúc ❤️']);
      setFileToUpload(null);
    } else {
      // Defaults for new memory
      setStage('milestones');
      setDate(new Date().toISOString().split('T')[0]);
      setTitle('');
      setContent('');
      setMilestoneTag('');
      setWeekOrAge('');
      setMediaType('none');
      setMediaUrl('');
      setEmotions(['Hạnh phúc ❤️']);
      setFileToUpload(null);
    }
    setErrorMsg('');
  }, [editingMemory, isOpen]);

  if (!isOpen) return null;

  // Handle stage presets
  const currentPresets = MILESTONE_PRESETS.filter((p) => p.stage === stage);

  const handleSelectPreset = (preset: { tag: string; defaultWeek: string }) => {
    setMilestoneTag(preset.tag);
    if (!title) {
      setTitle(preset.tag);
    }
    if (preset.defaultWeek && !weekOrAge) {
      setWeekOrAge(preset.defaultWeek);
    }
  };

  const toggleEmotion = (emo: string) => {
    if (emotions.includes(emo)) {
      setEmotions(emotions.filter((e) => e !== emo));
    } else {
      setEmotions([...emotions, emo]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File quá lớn (>25MB). Vui lòng chọn file nhẹ hơn hoặc dùng link trực tiếp.');
      return;
    }

    const isVid = file.type.includes('video');
    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;
      setFileToUpload({
        file,
        previewUrl,
        base64,
        name: file.name,
        mimeType: file.type || (isVid ? 'video/mp4' : 'image/jpeg'),
        sizeKb: Math.round(file.size / 1024),
      });
      setMediaType(isVid ? 'video' : 'image');
      setMediaUrl(previewUrl);
      setErrorMsg('');
    };

    reader.onerror = () => {
      setErrorMsg('Lỗi khi đọc file. Vui lòng thử lại.');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    if (fileToUpload?.previewUrl) {
      URL.revokeObjectURL(fileToUpload.previewUrl);
    }
    setFileToUpload(null);
    setMediaUrl('');
    setMediaType('none');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề kỷ niệm');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');

      const memoryData: Partial<Memory> = {
        date,
        title: title.trim(),
        content: content.trim(),
        stage,
        milestoneTag: milestoneTag.trim() || undefined,
        weekOrAge: weekOrAge.trim() || undefined,
        mediaType: fileToUpload ? (fileToUpload.mimeType.includes('video') ? 'video' : 'image') : mediaType,
        mediaUrl: fileToUpload ? fileToUpload.previewUrl : mediaUrl.trim(),
        emotions,
      };

      const fileData = fileToUpload
        ? {
            base64: fileToUpload.base64,
            name: fileToUpload.name,
            mimeType: fileToUpload.mimeType,
          }
        : undefined;

      await onSave(memoryData, fileData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu bài viết. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-800">
                {editingMemory ? 'Chỉnh sửa kỷ niệm' : 'Thêm kỷ niệm mới cho bé'}
              </h3>
              <p className="text-xs text-rose-500 font-medium">
                {isGasConnected
                  ? '☁️ Tự động đồng bộ lên Google Sheets & Drive'
                  : '💾 Đang lưu trong trình duyệt (Kết nối Google Apps Script để lưu đám mây)'}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Stage Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Chọn giai đoạn</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStage('pregnancy')}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all text-center ${
                  stage === 'pregnancy'
                    ? 'bg-teal-50 border-teal-400 text-teal-800 shadow-2xs font-bold'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                🤰 Thai kỳ
              </button>
              <button
                type="button"
                onClick={() => setStage('milestones')}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all text-center ${
                  stage === 'milestones'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-2xs font-bold'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                👶 Cột mốc bé
              </button>
              <button
                type="button"
                onClick={() => setStage('daily')}
                className={`py-2 px-3 rounded-2xl text-xs font-semibold border transition-all text-center ${
                  stage === 'daily'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-2xs font-bold'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                📖 Hằng ngày
              </button>
            </div>
          </div>

          {/* Preset Suggestions */}
          {currentPresets.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Gợi ý cột mốc nhanh:</span>
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-stone-50/70 rounded-xl border border-stone-100">
                {currentPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:border-rose-400 hover:text-rose-600 transition-colors"
                  >
                    {preset.tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Week/Age Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Ngày ghi nhớ *</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                Tuần thai / Tuổi của bé
              </label>
              <input
                type="text"
                value={weekOrAge}
                onChange={(e) => setWeekOrAge(e.target.value)}
                placeholder="VD: Tuần 12 hoặc 3 tháng 10 ngày"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">
              Tiêu đề kỷ niệm *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cú đạp đầu tiên của con / Lần đầu con biết lẫy..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
              required
            />
          </div>

          {/* Content / Diary */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-700">
              Nội dung tâm sự / Cảm xúc của mẹ
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết những cảm xúc, kỷ niệm, chi tiết đáng yêu của con vào đây..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Emotion tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Cảm xúc đọng lại</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTION_OPTIONS.map((emo) => {
                const isSelected = emotions.includes(emo);
                return (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => toggleEmotion(emo)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-rose-500 text-white border-rose-500 shadow-2xs font-semibold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {emo}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media Upload (Images / Videos) */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-rose-500" />
                <span>Hình ảnh hoặc Video kỷ niệm</span>
              </span>
              <span className="text-[11px] text-stone-400 font-normal">
                (Hỗ trợ PNG, JPG, MP4)
              </span>
            </label>

            {/* If a file is uploaded or existing */}
            {fileToUpload || (mediaUrl && mediaType !== 'none') ? (
              <div className="relative rounded-2xl overflow-hidden border border-rose-200 bg-stone-50 p-2">
                <div className="relative aspect-16/9 bg-stone-900 rounded-xl overflow-hidden flex items-center justify-center">
                  {fileToUpload?.mimeType.includes('video') || mediaType === 'video' ? (
                    <video
                      src={fileToUpload ? fileToUpload.previewUrl : mediaUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={fileToUpload ? fileToUpload.previewUrl : mediaUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
                    title="Xóa media"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {fileToUpload && (
                  <div className="mt-1.5 px-1 flex items-center justify-between text-xs text-stone-500">
                    <span className="truncate max-w-[200px] font-medium">{fileToUpload.name}</span>
                    <span>{fileToUpload.sizeKb} KB</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Drag drop / select file */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50/80 rounded-2xl p-5 cursor-pointer transition-colors text-center">
                  <UploadCloud className="w-8 h-8 text-rose-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-700">
                    Nhấn để tải ảnh hoặc video từ máy
                  </span>
                  <span className="text-[11px] text-stone-400 mt-0.5">
                    Hình siêu âm, khoảnh khắc đầu đời, nụ cười của bé
                  </span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Or enter direct URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => {
                      setMediaUrl(e.target.value);
                      if (e.target.value) {
                        setMediaType(e.target.value.includes('.mp4') ? 'video' : 'image');
                      } else {
                        setMediaType('none');
                      }
                    }}
                    placeholder="Hoặc dán trực tiếp link ảnh/video (nếu có)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-200 focus:border-rose-400 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="pt-3 border-t border-rose-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm hover:from-rose-600 hover:to-pink-600 disabled:opacity-60 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu lên hệ thống...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingMemory ? 'Cập nhật kỷ niệm' : 'Lưu kỷ niệm'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
