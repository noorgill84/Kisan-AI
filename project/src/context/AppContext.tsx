import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AnalysisResult } from '@/types';
import {
  getAnonymousUserId,
  getStoredUserHistory,
  appendStoredUserDiagnosis,
  removeStoredUserDiagnosis,
  clearStoredUserHistory,
} from '@/services/identity';

export type Page = 'home' | 'diagnosis' | 'processing' | 'results' | 'history' | 'about' | 'weather';

interface AppContextValue {
  userId: string;
  page: Page;
  navigate: (page: Page) => void;
  currentResult: AnalysisResult | null;
  setCurrentResult: (r: AnalysisResult | null) => void;
  savedHistory: AnalysisResult[];
  addToHistory: (r: AnalysisResult) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Persistent anonymous userId generated once on first visit and stored in localStorage
  const [userId] = useState<string>(() => getAnonymousUserId());
  const [page, setPage] = useState<Page>('home');
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);

  // Initialize history isolated strictly to this userId
  const [savedHistory, setSavedHistory] = useState<AnalysisResult[]>(() => {
    return getStoredUserHistory(userId);
  });

  // Keep state synced with isolated storage
  useEffect(() => {
    const isolatedItems = getStoredUserHistory(userId);
    setSavedHistory(isolatedItems);
  }, [userId]);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addToHistory = useCallback(
    (r: AnalysisResult) => {
      // Ensure the result is tagged with the current anonymous userId
      const userScopedResult: AnalysisResult = {
        ...r,
        userId,
      };
      const updated = appendStoredUserDiagnosis(userId, userScopedResult);
      setSavedHistory(updated);
    },
    [userId]
  );

  const removeFromHistory = useCallback(
    (id: string) => {
      const updated = removeStoredUserDiagnosis(userId, id);
      setSavedHistory(updated);
    },
    [userId]
  );

  const clearHistory = useCallback(() => {
    clearStoredUserHistory(userId);
    setSavedHistory([]);
  }, [userId]);

  const value: AppContextValue = {
    userId,
    page,
    navigate,
    currentResult,
    setCurrentResult,
    savedHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
