import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LanguageCode } from '@/types';
import { getStrings, type StringTree } from '@/i18n/strings';

interface LanguageContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: StringTree;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>('en');
  const t = getStrings(lang);

  const value = {
    lang,
    setLang: useCallback((l: LanguageCode) => setLang(l), []),
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
