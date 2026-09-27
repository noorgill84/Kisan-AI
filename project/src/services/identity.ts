import type { AnalysisResult } from '@/types';

const STORAGE_KEY_USER_ID = 'kisanai_anonymous_user_id';
const STORAGE_PREFIX_HISTORY = 'kisanai_user_history_';

/**
 * Generates an RFC 4122 version 4 compliant UUID.
 * Uses the Web Crypto API if available, otherwise a secure fallback.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments lacking crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieves the persistent anonymous user ID from localStorage.
 * If none exists, generates a new UUID v4, persists it, and returns it.
 */
export function getAnonymousUserId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY_USER_ID);
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }

    const newId = generateUUID();
    localStorage.setItem(STORAGE_KEY_USER_ID, newId);
    return newId;
  } catch (error) {
    // Graceful fallback if localStorage is disabled or inaccessible (e.g. strict incognito)
    console.warn('[IdentityService] Unable to access localStorage for userId, using fallback ID', error);
    return 'anon_' + generateUUID();
  }
}

/**
 * Returns the storage key partitioned strictly by userId to guarantee data isolation.
 */
function getHistoryStorageKey(userId: string): string {
  return `${STORAGE_PREFIX_HISTORY}${userId}`;
}

/**
 * Loads diagnosis history isolated strictly to the given userId.
 * Never accesses or leaks data belonging to other user IDs.
 */
export function getStoredUserHistory(userId: string): AnalysisResult[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getHistoryStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Secondary defense: filter strictly by userId to eliminate cross-user pollution
    return parsed.filter((item: AnalysisResult) => item && (!item.userId || item.userId === userId));
  } catch (err) {
    console.error('[IdentityService] Failed to load user history:', err);
    return [];
  }
}

/**
 * Persists diagnosis history strictly under the specified userId partition.
 */
export function saveStoredUserHistory(userId: string, history: AnalysisResult[]): void {
  if (!userId) return;
  try {
    // Ensure every record is explicitly tagged with this userId
    const isolatedHistory = history.map((item) => ({
      ...item,
      userId,
    }));
    localStorage.setItem(getHistoryStorageKey(userId), JSON.stringify(isolatedHistory));
  } catch (err) {
    console.error('[IdentityService] Failed to save user history:', err);
  }
}

/**
 * Adds a new diagnosis result to the user's isolated history.
 */
export function appendStoredUserDiagnosis(userId: string, result: AnalysisResult): AnalysisResult[] {
  const current = getStoredUserHistory(userId);
  const updatedItem: AnalysisResult = {
    ...result,
    userId,
  };
  // Prepend new item and avoid duplicates by id
  const filtered = current.filter((item) => item.id !== result.id);
  const updatedList = [updatedItem, ...filtered];
  saveStoredUserHistory(userId, updatedList);
  return updatedList;
}

/**
 * Deletes a diagnosis result strictly from this user's isolated history.
 */
export function removeStoredUserDiagnosis(userId: string, resultId: string): AnalysisResult[] {
  const current = getStoredUserHistory(userId);
  const updatedList = current.filter((item) => item.id !== resultId);
  saveStoredUserHistory(userId, updatedList);
  return updatedList;
}

/**
 * Clears all history belonging strictly to this user.
 */
export function clearStoredUserHistory(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(getHistoryStorageKey(userId));
  } catch (err) {
    console.error('[IdentityService] Failed to clear user history:', err);
  }
}
