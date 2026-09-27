import { Sprout, Heart, Info } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';

export function Footer() {
  const { t } = useLanguage();
  const { navigate } = useApp();

  return (
    <footer className="mt-20 border-t border-neutral-200 bg-neutral-50">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Sprout className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-neutral-900">
                {t.brand.name}
              </span>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {t.nav.about}
            </h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('about')}
                className="text-sm text-neutral-600 hover:text-primary-700 transition-colors text-left"
              >
                {t.footer.links.about}
              </button>
              <span className="text-sm text-neutral-600">{t.footer.links.privacy}</span>
              <span className="text-sm text-neutral-600">{t.footer.links.terms}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-neutral-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                {t.about.disclaimerTitle}
              </h4>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {t.footer.disclaimer}
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} {t.brand.name}. {t.footer.rights}
          </p>
          <p className="text-xs text-neutral-400 flex items-center gap-1.5">
            {t.footer.madeWith}
            <Heart className="w-3.5 h-3.5 text-primary-500 fill-primary-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
