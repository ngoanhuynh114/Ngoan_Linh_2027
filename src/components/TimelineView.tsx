import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Sparkles, 
  Filter, 
  LayoutGrid, 
  GitCommit, 
  PlusCircle, 
  Heart,
  Baby,
  Smile,
  X
} from 'lucide-react';
import { Memory, StageType } from '../types';
import { MemoryCard } from './MemoryCard';

interface TimelineViewProps {
  memories: Memory[];
  isAdmin: boolean;
  onViewDetail: (memory: Memory) => void;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  onToggleLike: (id: string) => void;
  onOpenAddMemory: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  memories,
  isAdmin,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleLike,
  onOpenAddMemory,
}) => {
  const [activeStage, setActiveStage] = useState<StageType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');

  // Stage filters count
  const stageCounts = useMemo(() => {
    return {
      all: memories.length,
      pregnancy: memories.filter((m) => m.stage === 'pregnancy').length,
      milestones: memories.filter((m) => m.stage === 'milestones').length,
      daily: memories.filter((m) => m.stage === 'daily').length,
    };
  }, [memories]);

  // Extract all unique milestone tags for quick pill filter
  const quickTags = useMemo(() => {
    const set = new Set<string>();
    memories.forEach((m) => {
      if (m.milestoneTag && m.milestoneTag.trim()) {
        set.add(m.milestoneTag.trim());
      }
    });
    return Array.from(set).slice(0, 10);
  }, [memories]);

  // Filtered memories
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      // Stage match
      if (activeStage !== 'all' && m.stage !== activeStage) {
        return false;
      }
      // Tag match
      if (selectedTag && m.milestoneTag !== selectedTag) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(query);
        const inContent = m.content.toLowerCase().includes(query);
        const inTag = (m.milestoneTag || '').toLowerCase().includes(query);
        const inWeek = (m.weekOrAge || '').toLowerCase().includes(query);
        if (!inTitle && !inContent && !inTag && !inWeek) {
          return false;
        }
      }
      return true;
    });
  }, [memories, activeStage, selectedTag, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-4 sm:p-5 border border-rose-100/90 shadow-2xs space-y-4">
        {/* Stage Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setActiveStage('all');
                setSelectedTag(null);
              }}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                activeStage === 'all'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-50/60 text-stone-600 hover:bg-rose-100/70'
              }`}
            >
              Tất cả ({stageCounts.all})
            </button>
            <button
              onClick={() => {
                setActiveStage('pregnancy');
                setSelectedTag(null);
              }}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeStage === 'pregnancy'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-teal-50/70 text-teal-800 hover:bg-teal-100/70'
              }`}
            >
              <span>🤰 Thai kỳ</span>
              <span className="text-xs opacity-80">({stageCounts.pregnancy})</span>
            </button>
            <button
              onClick={() => {
                setActiveStage('milestones');
                setSelectedTag(null);
              }}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeStage === 'milestones'
                  ? 'bg-pink-500 text-white shadow-xs'
                  : 'bg-pink-50/70 text-pink-800 hover:bg-pink-100/70'
              }`}
            >
              <span>👶 Cột mốc bé</span>
              <span className="text-xs opacity-80">({stageCounts.milestones})</span>
            </button>
            <button
              onClick={() => {
                setActiveStage('daily');
                setSelectedTag(null);
              }}
              className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeStage === 'daily'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50/70 text-amber-800 hover:bg-amber-100/70'
              }`}
            >
              <span>📖 Hằng ngày</span>
              <span className="text-xs opacity-80">({stageCounts.daily})</span>
            </button>
          </div>

          {/* View mode toggle (Timeline vs Grid) */}
          <div className="flex items-center gap-1 bg-stone-100/80 p-1 rounded-2xl self-end sm:self-auto">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-white text-rose-600 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Xem dạng Dòng thời gian liên tục"
            >
              <GitCommit className="w-4 h-4 rotate-90" />
              <span className="hidden md:inline">Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-rose-600 shadow-2xs font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Xem dạng Lưới ảnh"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Lưới thẻ</span>
            </button>
          </div>
        </div>

        {/* Search bar & Tag pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 border-t border-rose-50">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề, lời nhắn, tuần tuổi..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-2xl bg-stone-50/80 border border-stone-200/80 focus:bg-white focus:border-rose-400 focus:outline-hidden transition-all text-stone-700 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tag Pills */}
          {quickTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs text-stone-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Gợi ý:</span>
              </span>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-xs px-2.5 py-1 rounded-full shrink-0 transition-colors border ${
                    selectedTag === tag
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white text-stone-600 border-rose-100 hover:border-rose-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-xs text-rose-500 hover:underline shrink-0 px-1 font-medium"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredMemories.length === 0 ? (
        <div className="bg-white/80 rounded-3xl border border-rose-100 p-8 sm:p-12 text-center space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
            <Baby className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-stone-700">
              Chưa có kỷ niệm nào trong mục này
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
              Hãy lưu lại những khoảnh khắc đáng yêu đầu tiên của mẹ và bé ngay hôm nay!
            </p>
          </div>
          <button
            onClick={onOpenAddMemory}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold shadow-sm hover:from-rose-600 hover:to-pink-600 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm kỷ niệm mới ngay</span>
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Vertical Connected Timeline View */
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-rose-300 before:via-pink-200 before:to-amber-200">
          {filteredMemories.map((mem, index) => (
            <div key={mem.id} className="relative group">
              {/* Timeline Node dot */}
              <div className="absolute -left-[27px] sm:-left-[31px] top-6 w-5 h-5 rounded-full bg-white border-4 border-rose-400 shadow-xs flex items-center justify-center group-hover:scale-125 transition-transform">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              </div>

              {/* Memory Card */}
              <MemoryCard
                memory={mem}
                isAdmin={isAdmin}
                onViewDetail={onViewDetail}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleLike={onToggleLike}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Grid / Card layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((mem) => (
            <MemoryCard
              key={mem.id}
              memory={mem}
              isAdmin={isAdmin}
              onViewDetail={onViewDetail}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
};
