import { BabyProfile, GasResponse, Memory } from '../types';
import { INITIAL_BABY_PROFILE, INITIAL_MEMORIES } from '../mockData';

const STORAGE_KEY_MEMORIES = 'nhatky_memories_v2';
const STORAGE_KEY_PROFILE = 'nhatky_baby_profile_v2';

export const LocalStore = {
  getProfile(): BabyProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) {
        return { ...INITIAL_BABY_PROFILE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse saved baby profile', e);
    }
    return INITIAL_BABY_PROFILE;
  },

  saveProfile(profile: BabyProfile) {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  },

  getMemories(): Memory[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMORIES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved memories', e);
    }
    return INITIAL_MEMORIES;
  },

  saveMemories(memories: Memory[]) {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORIES, JSON.stringify(memories));
    } catch (e) {
      console.error('Failed to save memories', e);
    }
  },
};

/**
 * Ping Google Apps Script Web App
 */
export async function pingGas(gasUrl: string): Promise<GasResponse> {
  if (!gasUrl || !gasUrl.trim()) {
    return { status: 'error', message: 'Chưa cấu hình Web App URL' };
  }
  const cleanUrl = gasUrl.trim();
  const testUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;

  try {
    const res = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      status: 'error',
      message: `Không thể kết nối tới Google Apps Script: ${err.message || 'Lỗi mạng hoặc chưa cấp quyền Anyone'}`,
    };
  }
}

/**
 * Fetch memories from Google Apps Script
 */
export async function fetchMemoriesFromGas(gasUrl: string): Promise<Memory[]> {
  const cleanUrl = gasUrl.trim();
  const fetchUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=getMemories` : `${cleanUrl}?action=getMemories`;

  const res = await fetch(fetchUrl, {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  const result: GasResponse<Memory[]> = await res.json();
  if (result.status === 'success' && Array.isArray(result.data)) {
    return result.data;
  }
  throw new Error(result.message || 'Không thể lấy dữ liệu từ Google Sheet');
}

/**
 * Save new memory to Google Apps Script (handles base64 upload to Drive)
 */
export async function saveMemoryToGas(
  gasUrl: string,
  payload: {
    date: string;
    title: string;
    content: string;
    stage: string;
    milestoneTag?: string;
    weekOrAge?: string;
    mediaType?: string;
    mediaUrl?: string;
    emotions?: string[];
    fileBase64?: string;
    fileName?: string;
    mimeType?: string;
  }
): Promise<GasResponse> {
  const cleanUrl = gasUrl.trim();

  const bodyData = {
    action: 'createMemory',
    ...payload,
  };

  const res = await fetch(cleanUrl, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // GAS handles text/plain cleanly without CORS preflight block
    },
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  const result: GasResponse = await res.json();
  return result;
}

/**
 * Update memory in Google Apps Script
 */
export async function updateMemoryInGas(
  gasUrl: string,
  payload: {
    id: string;
    date: string;
    title: string;
    content: string;
    stage: string;
    milestoneTag?: string;
    weekOrAge?: string;
    mediaType?: string;
    mediaUrl?: string;
    emotions?: string[];
    fileBase64?: string;
    fileName?: string;
    mimeType?: string;
  }
): Promise<GasResponse> {
  const cleanUrl = gasUrl.trim();

  const bodyData = {
    action: 'updateMemory',
    ...payload,
  };

  const res = await fetch(cleanUrl, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  const result: GasResponse = await res.json();
  return result;
}

/**
 * Delete memory in Google Apps Script
 */
export async function deleteMemoryInGas(gasUrl: string, id: string): Promise<GasResponse> {
  const cleanUrl = gasUrl.trim();

  const res = await fetch(cleanUrl, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'deleteMemory',
      id,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }

  const result: GasResponse = await res.json();
  return result;
}
