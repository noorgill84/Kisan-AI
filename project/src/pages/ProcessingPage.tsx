import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { PipelineIndicator } from '@/components/shared/PipelineIndicator';

export function ProcessingPage() {
  const { t, lang } = useLanguage();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setStage(1), 600));
    timers.push(setTimeout(() => setStage(2), 1400));
    timers.push(setTimeout(() => setStage(3), 2200));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="py-12 md:py-20">
      <div className="container-app">
        <div className="max-w-2xl mx-auto text-center mb-10 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-5">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
            {t.processing.title}
          </h1>
          <p className="mt-3 text-neutral-500">{t.processing.subtitle}</p>
        </div>

        <PipelineIndicator stage={stage} labels={t.processing} lang={lang} />
      </div>
    </div>
  );
}
