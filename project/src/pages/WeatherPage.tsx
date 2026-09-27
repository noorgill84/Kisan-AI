import { CloudSun, Sprout, ShieldAlert, Droplets, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WeatherWidget } from '@/components/weather/WeatherWidget';

export function WeatherPage() {
  const { t } = useLanguage();
  const { navigate } = useApp();

  return (
    <div className="py-8 md:py-12">
      <div className="container-app max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-down">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <CloudSun className="w-5 h-5 text-primary-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
                {t.weather.title}
              </h1>
            </div>
            <p className="text-neutral-500 max-w-xl">
              {t.weather.subtitle}
            </p>
          </div>

          <Button
            size="md"
            variant="primary"
            onClick={() => navigate('diagnosis')}
            className="self-start md:self-auto shrink-0 shadow-md shadow-primary-900/10"
          >
            <Sprout className="w-4 h-4" />
            {t.weather.diagnoseCta}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Live Weather & 7-Day Forecast Widget */}
        <div className="animate-fade-in-up">
          <WeatherWidget variant="full" />
        </div>

        {/* Agronomic Best Practices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 animate-fade-in-up stagger-2">
          <Card hover className="p-5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center mb-3">
              <Droplets className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm mb-1">{t.weather.sprayTimingTitle}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {t.weather.sprayTimingDesc}
            </p>
          </Card>

          <Card hover className="p-5">
            <div className="w-9 h-9 rounded-xl bg-warning-100 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5 text-warning-700" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm mb-1">{t.weather.humidityTitle}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {t.weather.humidityDesc}
            </p>
          </Card>

          <Card hover className="p-5">
            <div className="w-9 h-9 rounded-xl bg-secondary-100 flex items-center justify-center mb-3">
              <Sprout className="w-5 h-5 text-secondary-700" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm mb-1">{t.weather.scoutingTitle}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {t.weather.scoutingDesc}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
