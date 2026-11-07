export type StageType = 'pregnancy' | 'milestones' | 'daily';

export type MediaType = 'image' | 'video' | 'none';

export interface Memory {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  stage: StageType;
  milestoneTag?: string; // e.g. "Siêu âm 12 tuần", "Lần đầu lẫy", "Thôi nôi"
  weekOrAge?: string; // e.g. "Tuần 12", "6 tháng 15 ngày"
  mediaType: MediaType;
  mediaUrl: string; // Direct link or Google Drive link or data URL
  driveFileId?: string;
  createdAt: string;
  emotions?: string[];
  likes?: number;
}

export interface BabyProfile {
  name: string;
  nickname: string;
  parentNames: string;
  isBorn: boolean;
  birthDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD for pregnancy
  avatarUrl?: string;
  adminPassword?: string;
  gasWebAppUrl?: string;
  gasFolderId?: string;
}

export interface GasResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  newMemory?: Memory;
}
