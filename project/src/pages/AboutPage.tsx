import {
  Image as ImageIcon,
  Mic,
  Search,
  BrainCircuit,
  UserCheck,
  Server,
  Database,
  Cpu,
  Volume2,
  Layers,
  Info,
  Target,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function AboutPage() {
  const { t } = useLanguage();
  const { navigate } = useApp();

  const pipelineStages = [
    { icon: ImageIcon, title: t.about.stage1Title, desc: t.about.stage1Desc, num: '01' },
    { icon: Mic, title: t.about.stage2Title, desc: t.about.stage2Desc, num: '02' },
    { icon: Search, title: t.about.stage3Title, desc: t.about.stage3Desc, num: '03' },
    { icon: BrainCircuit, title: t.about.stage4Title, desc: t.about.stage4Desc, num: '04' },
    { icon: UserCheck, title: t.about.stage5Title, desc: t.about.stage5Desc, num: '05' },
  ];

  const techStack = [
    { icon: Cpu, label: t.about.tech1 },
    { icon: Layers, label: t.about.tech2 },
    { icon: Volume2, label: t.about.tech3 },
    { icon: Server, label: t.about.tech4 },
    { icon: Database, label: t.about.tech5 },
  ];

  return (
    <div className="py-8 md:py-12">
      <div className="container-app max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 mb-4">
            <Info className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
            {t.about.title}
          </h1>
          <p className="mt-3 text-neutral-500 max-w-2xl mx-auto">{t.about.subtitle}</p>
        </div>

        {/* Mission */}
        <Card className="mb-10 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-600/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">{t.about.missionTitle}</h2>
              <p className="text-neutral-600 leading-relaxed">{t.about.missionDesc}</p>
            </div>
          </div>
        </Card>

        {/* Pipeline */}
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold text-neutral-900 mb-1">
            {t.about.pipelineTitle}
          </h2>
          <p className="text-neutral-500 mb-6">{t.about.pipelineSubtitle}</p>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-200 via-primary-200 to-neutral-200" />

            <div className="space-y-4">
              {pipelineStages.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.num}
                    className={`relative flex items-start gap-4 animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}
                  >
                    <div className="shrink-0 relative z-10 w-12 h-12 rounded-xl bg-white border-2 border-primary-200 flex items-center justify-center shadow-sm">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <Card className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold text-primary-400 font-display">{s.num}</span>
                        <h3 className="font-bold text-neutral-900">{s.title}</h3>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold text-neutral-900 mb-1">
            {t.about.techTitle}
          </h2>
          <p className="text-neutral-500 mb-6">{t.about.techSubtitle}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-4 rounded-xl bg-white border border-neutral-200 hover:border-primary-200 transition-colors animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-accent-600" />
                  </div>
                  <p className="text-sm font-medium text-neutral-700">{tech.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-6 rounded-2xl bg-warning-50 border-2 border-warning-200 mb-10 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
              <Info className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h3 className="font-bold text-warning-800 mb-1">{t.about.disclaimerTitle}</h3>
              <p className="text-sm text-warning-700 leading-relaxed">{t.about.disclaimerDesc}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-8">
          <Button size="lg" onClick={() => navigate('diagnosis')}>
            {t.nav.startDiagnosis}
          </Button>
        </div>
      </div>
    </div>
  );
}
