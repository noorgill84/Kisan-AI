import {
  Camera,
  Mic,
  Search,
  BrainCircuit,
  ShieldCheck,
  BookOpen,
  ListChecks,
  UserCheck,
  ArrowRight,
  Sparkles,
  CloudSun,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function HomePage() {
  const { t } = useLanguage();
  const { navigate } = useApp();

  const features = [
    { icon: Camera, title: t.home.feature1Title, desc: t.home.feature1Desc, delay: 'stagger-1' },
    { icon: BookOpen, title: t.home.feature2Title, desc: t.home.feature2Desc, delay: 'stagger-2' },
    { icon: ListChecks, title: t.home.feature3Title, desc: t.home.feature3Desc, delay: 'stagger-3' },
    { icon: UserCheck, title: t.home.feature4Title, desc: t.home.feature4Desc, delay: 'stagger-4' },
  ];

  const steps = [
    { icon: Camera, title: t.home.step1Title, desc: t.home.step1Desc, num: '01' },
    { icon: Mic, title: t.home.step2Title, desc: t.home.step2Desc, num: '02' },
    { icon: BrainCircuit, title: t.home.step3Title, desc: t.home.step3Desc, num: '03' },
    { icon: ShieldCheck, title: t.home.step4Title, desc: t.home.step4Desc, num: '04' },
  ];

  const stats = [
    { value: '12,000+', label: t.home.statFarmers },
    { value: '40+', label: t.home.statCrops },
    { value: 'High', label: t.home.statAccuracy },
    { value: '3', label: t.home.statLanguages },
  ];

  return (
    <div>
      {/* Hero — image as interactive background */}
      <section
        className="relative min-h-[600px] md:min-h-[680px] flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: "url('/image.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/70 via-neutral-900/60 to-neutral-900/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/50 to-transparent" />

        {/* Subtle animated glow accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-400/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none animate-pulse-soft" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none animate-pulse-soft" />

        <div className="container-app relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6 animate-fade-in-down">
              <Sparkles className="w-3.5 h-3.5" />
              {t.home.badge}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg animate-fade-in-up">
              {t.home.heroTitle}{' '}
              <span className="bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">
                {t.home.heroTitleAccent}
              </span>
            </h1>

            <p className="mt-6 text-lg text-neutral-100/90 leading-relaxed max-w-2xl mx-auto drop-shadow animate-fade-in-up stagger-1">
              {t.home.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up stagger-2">
              <Button size="lg" onClick={() => navigate('diagnosis')} className="shadow-xl shadow-primary-900/30">
                <Camera className="w-5 h-5" />
                {t.home.ctaPrimary}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('weather')}
                className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:text-white"
              >
                <CloudSun className="w-5 h-5 text-amber-300" />
                {t.home.weatherBtn}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('about')}
                className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:text-white"
              >
                {t.home.ctaSecondary}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats — glassmorphism over background */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in-up stagger-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 transition-all duration-300 hover:bg-white/15 hover:scale-105 cursor-default"
              >
                <p className="text-2xl md:text-3xl font-extrabold text-white drop-shadow">{s.value}</p>
                <p className="text-xs text-neutral-200 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-neutral-50 pointer-events-none" />
      </section>

      {/* Features */}
      <section className="py-16 md:py-20">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
              {t.home.featureTitle}
            </h2>
            <p className="mt-3 text-neutral-500">{t.home.featureSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} hover className={`animate-fade-in-up ${f.delay}`}>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{f.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-neutral-50 to-primary-50/30">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
              {t.home.howItWorksTitle}
            </h2>
            <p className="mt-3 text-neutral-500">{t.home.howItWorksSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className={`relative animate-fade-in-up stagger-${idx + 1}`}
                >
                  <Card hover className="h-full">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center justify-between w-full mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-600/20">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-3xl font-extrabold text-neutral-200 font-display">
                          {s.num}
                        </span>
                      </div>
                      <h3 className="font-bold text-neutral-900">{s.title}</h3>
                      <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="container-app">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-8 md:p-12 text-center shadow-xl shadow-primary-600/20">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary-400/15 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                {t.home.ctaSectionTitle}
              </h2>
              <p className="mt-3 text-primary-100 max-w-xl mx-auto">
                {t.home.ctaSectionSubtitle}
              </p>
              <div className="mt-8">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('diagnosis')}
                  className="shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                  {t.home.ctaSectionButton}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
