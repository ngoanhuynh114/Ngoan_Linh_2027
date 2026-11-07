import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, 
  Sparkles, 
  Database, 
  Baby, 
  FileCode, 
  PlusCircle, 
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { BabyProfile, Memory } from './types';
import { 
  LocalStore, 
  fetchMemoriesFromGas, 
  saveMemoryToGas, 
  updateMemoryInGas, 
  deleteMemoryInGas 
} from './services/api';
import { Header } from './components/Header';
import { BabyBanner } from './components/BabyBanner';
import { TimelineView } from './components/TimelineView';
import { AddEditMemoryModal } from './components/AddEditMemoryModal';
import { MemoryModal } from './components/MemoryModal';
import { GasSetupModal } from './components/GasSetupModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { HelpGuideModal } from './components/HelpGuideModal';

export default function App() {
  const [profile, setProfile] = useState<BabyProfile>(() => LocalStore.getProfile());
  const [memories, setMemories] = useState<Memory[]>(() => LocalStore.getMemories());
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('nhatky_is_admin') === 'true';
  });

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Status & notifications
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Save changes to local storage whenever memories or profile change
  useEffect(() => {
    LocalStore.saveMemories(memories);
  }, [memories]);

  useEffect(() => {
    LocalStore.saveProfile(profile);
  }, [profile]);

  // Sync with Google Apps Script if URL configured
  const syncWithGas = useCallback(async (customUrl?: string) => {
    const url = customUrl || profile.gasWebAppUrl;
    if (!url || !url.trim()) return;

    try {
      setIsSyncing(true);
      const remoteMemories = await fetchMemoriesFromGas(url);
      if (Array.isArray(remoteMemories) && remoteMemories.length > 0) {
        setMemories(remoteMemories);
        LocalStore.saveMemories(remoteMemories);
        showToast(`Đã đồng bộ ${remoteMemories.length} kỷ niệm từ Google Sheets!`, 'success');
      } else {
        showToast('Google Sheet hiện chưa có dữ liệu. Hãy thêm kỷ niệm đầu tiên!', 'info');
      }
    } catch (err: any) {
      console.warn('Sync with GAS error:', err);
      // Keep local memories as fallback
    } finally {
      setIsSyncing(false);
    }
  }, [profile.gasWebAppUrl, showToast]);

  // Background sync on load
  useEffect(() => {
    if (profile.gasWebAppUrl) {
      syncWithGas();
    }
  }, []);

  // Admin login / logout
  const handleAdminSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem('nhatky_is_admin', 'true');
    showToast('Đã mở khóa quyền Quản trị dành cho Mẹ & Bố!', 'success');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('nhatky_is_admin');
    showToast('Đã chuyển về chế độ Xem công khai', 'info');
  };

  // Add or update memory
  const handleSaveMemory = async (
    memoryData: Partial<Memory>,
    fileData?: { base64: string; name: string; mimeType: string }
  ) => {
    const isGasActive = Boolean(profile.gasWebAppUrl && profile.gasWebAppUrl.trim().length > 10);

    if (editingMemory) {
      // UPDATE EXISTING
      if (isGasActive) {
        await updateMemoryInGas(profile.gasWebAppUrl!, {
          id: editingMemory.id,
          date: memoryData.date || editingMemory.date,
          title: memoryData.title || editingMemory.title,
          content: memoryData.content || editingMemory.content,
          stage: memoryData.stage || editingMemory.stage,
          milestoneTag: memoryData.milestoneTag,
          weekOrAge: memoryData.weekOrAge,
          mediaType: memoryData.mediaType || editingMemory.mediaType,
          mediaUrl: memoryData.mediaUrl || editingMemory.mediaUrl,
          emotions: memoryData.emotions,
          fileBase64: fileData?.base64,
          fileName: fileData?.name,
          mimeType: fileData?.mimeType,
        });
        await syncWithGas();
      } else {
        // Local update
        const updated = memories.map((m) => {
          if (m.id === editingMemory.id) {
            return {
              ...m,
              ...memoryData,
              mediaUrl: fileData ? fileData.base64 : (memoryData.mediaUrl || m.mediaUrl),
              mediaType: fileData ? (fileData.mimeType.includes('video') ? 'video' : 'image') : (memoryData.mediaType || m.mediaType),
            } as Memory;
          }
          return m;
        });
        setMemories(updated);
      }
      showToast('Đã cập nhật kỷ niệm thành công!', 'success');
    } else {
      // CREATE NEW
      if (isGasActive) {
        const res = await saveMemoryToGas(profile.gasWebAppUrl!, {
          date: memoryData.date || new Date().toISOString().split('T')[0],
          title: memoryData.title || '',
          content: memoryData.content || '',
          stage: memoryData.stage || 'daily',
          milestoneTag: memoryData.milestoneTag,
          weekOrAge: memoryData.weekOrAge,
          mediaType: memoryData.mediaType || 'none',
          mediaUrl: memoryData.mediaUrl || '',
          emotions: memoryData.emotions,
          fileBase64: fileData?.base64,
          fileName: fileData?.name,
          mimeType: fileData?.mimeType,
        });

        if (res.status === 'success' && res.newMemory) {
          setMemories([res.newMemory, ...memories]);
        } else {
          await syncWithGas();
        }
      } else {
        // Local create
        const newMem: Memory = {
          id: 'mem_' + Date.now(),
          date: memoryData.date || new Date().toISOString().split('T')[0],
          title: memoryData.title || 'Kỷ niệm của bé',
          content: memoryData.content || '',
          stage: memoryData.stage || 'daily',
          milestoneTag: memoryData.milestoneTag,
          weekOrAge: memoryData.weekOrAge,
          mediaType: fileData ? (fileData.mimeType.includes('video') ? 'video' : 'image') : (memoryData.mediaType || 'none'),
          mediaUrl: fileData ? fileData.base64 : (memoryData.mediaUrl || ''),
          createdAt: new Date().toISOString(),
          emotions: memoryData.emotions || ['Hạnh phúc ❤️'],
          likes: 0,
        };
        setMemories([newMem, ...memories]);
      }
      showToast('Đã thêm kỷ niệm mới cho bé!', 'success');
    }
  };

  // Delete memory
  const handleDeleteMemory = async (id: string) => {
    const isGasActive = Boolean(profile.gasWebAppUrl && profile.gasWebAppUrl.trim().length > 10);
    if (isGasActive) {
      try {
        await deleteMemoryInGas(profile.gasWebAppUrl!, id);
      } catch (err: any) {
        console.warn('GAS delete error:', err);
      }
    }
    setMemories(memories.filter((m) => m.id !== id));
    showToast('Đã xóa kỷ niệm thành công', 'info');
  };

  // Toggle like
  const handleToggleLike = (id: string) => {
    setMemories(
      memories.map((m) => {
        if (m.id === id) {
          return { ...m, likes: (m.likes || 0) + 1 };
        }
        return m;
      })
    );
  };

  // Open modals
  const handleOpenAdd = () => {
    setEditingMemory(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (mem: Memory) => {
    setEditingMemory(mem);
    setIsAddEditOpen(true);
  };

  const handleViewDetail = (mem: Memory) => {
    setSelectedMemory(mem);
  };

  // Calculations for stats
  const totalMedia = memories.filter((m) => m.mediaType !== 'none' && m.mediaUrl).length;
  const milestonesCount = memories.filter((m) => m.stage === 'milestones').length;

  return (
    <div className="min-h-screen bg-[#FFF9F5] text-stone-700 font-sans flex flex-col selection:bg-rose-200 selection:text-rose-800">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : toast.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-stone-800 text-white border-stone-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <Header
        profile={profile}
        isAdmin={isAdmin}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        onLogoutAdmin={handleAdminLogout}
        onOpenAddMemory={handleOpenAdd}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        totalMemoriesCount={memories.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Baby Info & Age Banner */}
        <BabyBanner
          profile={profile}
          totalMemories={memories.length}
          totalMediaCount={totalMedia}
          milestonesCount={milestonesCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAddMemory={handleOpenAdd}
          isAdmin={isAdmin}
        />

        {/* Syncing indicator banner */}
        {isSyncing && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span>Đang đồng bộ dữ liệu với Google Sheets & Google Drive...</span>
          </div>
        )}

        {/* Timeline & Memories Section */}
        <TimelineView
          memories={memories}
          isAdmin={isAdmin}
          onViewDetail={handleViewDetail}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteMemory}
          onToggleLike={handleToggleLike}
          onOpenAddMemory={handleOpenAdd}
        />
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-rose-100 bg-white/70 py-6 text-center text-xs text-stone-500 space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-rose-500 font-medium">
          <Heart className="w-4 h-4 fill-rose-400" />
          <span>Dành trọn yêu thương cho bé {profile.nickname || 'yêu'}</span>
        </div>
        <p className="text-stone-400">
          Kết nối Google Sheets & Google Drive lưu trữ miễn phí, an toàn trọn đời
        </p>
      </footer>

      {/* MODALS */}
      <AddEditMemoryModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveMemory}
        editingMemory={editingMemory}
        babyBirthDate={profile.birthDate}
        babyDueDate={profile.dueDate}
        isGasConnected={Boolean(profile.gasWebAppUrl && profile.gasWebAppUrl.trim().length > 10)}
      />

      <MemoryModal
        isOpen={Boolean(selectedMemory)}
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        isAdmin={isAdmin}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteMemory}
        onToggleLike={handleToggleLike}
      />

      <GasSetupModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        gasUrl={profile.gasWebAppUrl || ''}
        onSaveGasUrl={(url) => {
          setProfile({ ...profile, gasWebAppUrl: url });
        }}
        onSyncNow={() => syncWithGas(profile.gasWebAppUrl)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={(newProf) => {
          setProfile(newProf);
          showToast('Đã lưu thông tin bé thành công!', 'success');
        }}
        onOpenGasModal={() => setIsGasModalOpen(true)}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        correctPassword={profile.adminPassword || '123'}
        onSuccess={handleAdminSuccess}
      />

      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenAdminAuth={() => {
          setIsHelpOpen(false);
          setIsAdminAuthOpen(true);
        }}
        onOpenSettings={() => {
          setIsHelpOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenAddMemory={() => {
          setIsHelpOpen(false);
          handleOpenAdd();
        }}
        onOpenGasModal={() => {
          setIsHelpOpen(false);
          setIsGasModalOpen(true);
        }}
      />
    </div>
  );
}
