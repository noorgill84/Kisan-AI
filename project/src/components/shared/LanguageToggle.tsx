import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { LanguageCode } from '@/types';

const languages: { code: LanguageCode; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'HI' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', short: 'PA' },
];

export function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = languages.find((l) => l.code === lang)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-200"
        aria-label={t.language.label}
      >
        <Globe className="w-4 h-4 text-primary-600" />
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden font-bold">{current.short}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-neutral-200 shadow-lg shadow-neutral-900/10 overflow-hidden z-50 animate-fade-in-down">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                l.code === lang
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <span>{l.label}</span>
              {l.code === lang && <Check className="w-4 h-4 text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LanguageToggleWrapper({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
