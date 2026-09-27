import { useState } from 'react';
import { Sprout, Menu, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp, type Page } from '@/context/AppContext';
import { LanguageToggle } from './LanguageToggle';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { t } = useLanguage();
  const { page, navigate } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { key: Page; label: string }[] = [
    { key: 'home', label: t.nav.home },
    { key: 'diagnosis', label: t.nav.diagnose },
    { key: 'history', label: t.nav.history },
    { key: 'weather', label: t.nav.weather },
    { key: 'about', label: t.nav.about },
  ];

  function handleNav(p: Page) {
    navigate(p);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-neutral-200/60">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-600/30 group-hover:scale-105 transition-transform duration-200">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="block font-display font-bold text-lg text-neutral-900 leading-none">
                {t.brand.name}
              </span>
              <span className="block text-[10px] text-neutral-500 font-medium leading-none mt-0.5">
                {t.brand.tagline}
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  page === item.key
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-neutral-600 hover:text-primary-700 hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            <LanguageToggle />
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleNav('diagnosis')}
              className="hidden sm:inline-flex"
            >
              {t.nav.startDiagnosis}
            </Button>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 animate-fade-in-down">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNav(item.key)}
                  className={`px-4 py-3 text-sm font-semibold rounded-lg text-left transition-all duration-200 ${
                    page === item.key
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Button
                size="md"
                variant="primary"
                fullWidth
                onClick={() => handleNav('diagnosis')}
                className="mt-2"
              >
                {t.nav.startDiagnosis}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
