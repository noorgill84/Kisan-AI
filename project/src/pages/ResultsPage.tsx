import { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Check,
  ExternalLink,
  AlertTriangle,
  Search,
  ListChecks,
  BookOpen,
  Leaf,
  Clock,
  Calendar,
  Bug,
  FlaskConical,
  CloudRain,
  Activity,
  CloudSun,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import { WeatherWidget } from '@/components/weather/WeatherWidget';

import type { LanguageCode, PossibleCause, ActionStep, EvidenceSource } from '@/types';

function localized(val: string | undefined, localized: Record<LanguageCode, string> | undefined, lang: LanguageCode): string {
  if (localized && localized[lang]) return localized[lang];
  return val ?? '';
}

function localizedList(val: string[], localized: Record<LanguageCode, string[]> | undefined, lang: LanguageCode): string[] {
  if (localized && localized[lang]) return localized[lang];
  return val;
}

const categoryConfig: Record<string, { icon: typeof Bug; variant: 'error' | 'warning' | 'secondary' | 'accent' | 'neutral' }> = {
  disease: { icon: Bug, variant: 'error' },
  pest: { icon: Bug, variant: 'warning' },
  nutrient: { icon: FlaskConical, variant: 'secondary' },
  environmental: { icon: CloudRain, variant: 'accent' },
  physiological: { icon: Activity, variant: 'neutral' },
};

const priorityConfig: Record<string, { variant: 'error' | 'warning' | 'success'; labelKey: 'priorityImmediate' | 'priorityShortTerm' | 'priorityPreventive' }> = {
  immediate: { variant: 'error', labelKey: 'priorityImmediate' },
  'short-term': { variant: 'warning', labelKey: 'priorityShortTerm' },
  preventive: { variant: 'success', labelKey: 'priorityPreventive' },
};

const relevanceConfig: Record<string, { variant: 'success' | 'warning' | 'neutral'; labelKey: 'relevanceHigh' | 'relevanceMedium' | 'relevanceLow' }> = {
  high: { variant: 'success', labelKey: 'relevanceHigh' },
  medium: { variant: 'warning', labelKey: 'relevanceMedium' },
  low: { variant: 'neutral', labelKey: 'relevanceLow' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ResultsPage() {
  const { t, lang } = useLanguage();
  const { currentResult, navigate, addToHistory, userId } = useApp();
  const [saved, setSaved] = useState(false);

  if (!currentResult) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500 mb-4">{t.diagnosis.errorNoInput}</p>
        <Button onClick={() => navigate('diagnosis')}>{t.nav.startDiagnosis}</Button>
      </div>
    );
  }

  const r = currentResult;
  const summary = localized(r.summary, r.summaryLocalized, lang);
  const cropName = r.cropTypeLocalized ? localized(r.cropType, r.cropTypeLocalized, lang) : r.cropType;

  function handleSave() {
    addToHistory({ ...r, userId });
    setSaved(true);
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container-app max-w-4xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-down">
          <button
            onClick={() => navigate('diagnosis')}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.results.newDiagnosis}
          </button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={saved ? 'ghost' : 'outline'} onClick={handleSave} disabled={saved}>
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-success-600" />
                  {t.results.saved}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t.results.saveToHistory}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
            {t.results.title}
          </h1>
          <p className="mt-2 text-neutral-500">{t.results.subtitle}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in-up stagger-1">
          <Badge variant="primary" dot>
            <Leaf className="w-3 h-3" />
            {t.results.cropLabel}: {cropName}
          </Badge>
          <Badge variant="neutral">
            <Calendar className="w-3 h-3" />
            {t.results.dateLabel}: {formatDate(r.createdAt)}
          </Badge>
        </div>

        {/* Image preview */}
        {r.imageDataUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-neutral-200 shadow-sm animate-scale-in">
            <img src={r.imageDataUrl} alt="Analyzed crop" className="w-full h-56 object-cover" />
          </div>
        )}

        {/* Summary */}
        <Card className="mb-6 animate-fade-in-up stagger-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">
            {t.results.summaryLabel}
          </h2>
          <p className="text-neutral-700 leading-relaxed">{summary}</p>
        </Card>

        {/* Confidence */}
        <div className="mb-6 animate-fade-in-up stagger-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3">
            {t.results.confidenceLabel}
          </h2>
          <ConfidenceBadge
            level={r.confidence_level}
            labels={{
              high: t.results.confidenceHigh,
              medium: t.results.confidenceMedium,
              low: t.results.confidenceLow,
            }}
            descriptions={{
              high: t.results.confidenceHighDesc,
              medium: t.results.confidenceMediumDesc,
              low: t.results.confidenceLowDesc,
            }}
            lang={lang}
          />
        </div>

        {/* Escalation banner */}
        {r.escalation_flag && (
          <div className="mb-6 p-5 rounded-2xl bg-error-50 border-2 border-error-200 animate-fade-in-up stagger-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-error-800">{t.results.escalationTitle}</h3>
                <p className="text-sm text-error-700 mt-1 leading-relaxed">
                  {r.escalationGuidanceLocalized
                    ? localized(r.escalationGuidance, r.escalationGuidanceLocalized, lang)
                    : t.results.escalationDesc}
                </p>
                <Button size="sm" variant="danger" className="mt-3">
                  <Search className="w-4 h-4" />
                  {t.results.escalationCta}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Possible Causes */}
        <div className="mb-6 animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <Bug className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900">{t.results.possibleCausesLabel}</h2>
          </div>
          <div className="space-y-4">
            {r.possible_causes.map((cause: PossibleCause, idx) => {
              const cat = categoryConfig[cause.category] ?? categoryConfig.disease;
              const CatIcon = cat.icon;
              const causeName = localized(cause.name, cause.nameLocalized, lang);
              const causeDesc = localized(cause.description, cause.descriptionLocalized, lang);
              const symptoms = localizedList(cause.symptoms, cause.symptomsLocalized, lang);
              const categoryLabel = (t.results as Record<string, string>)[`category${cause.category.charAt(0).toUpperCase()}${cause.category.slice(1)}`];

              return (
                <Card key={cause.id} hover className={`animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`shrink-0 w-10 h-10 rounded-xl bg-${cat.variant === 'error' ? 'error' : cat.variant === 'warning' ? 'warning' : cat.variant === 'secondary' ? 'secondary' : cat.variant === 'accent' ? 'accent' : 'neutral'}-100 flex items-center justify-center`}>
                      <CatIcon className={`w-5 h-5 text-${cat.variant === 'error' ? 'error' : cat.variant === 'warning' ? 'warning' : cat.variant === 'secondary' ? 'secondary' : cat.variant === 'accent' ? 'accent' : 'neutral'}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-neutral-900">{causeName}</h3>
                        <Badge variant={cat.variant}>{categoryLabel}</Badge>
                        <ConfidenceBadge
                          level={cause.likelihood}
                          size="sm"
                          labels={{
                            high: t.results.confidenceHigh,
                            medium: t.results.confidenceMedium,
                            low: t.results.confidenceLow,
                          }}
                          descriptions={{
                            high: '',
                            medium: '',
                            low: '',
                          }}
                          lang={lang}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-3">{causeDesc}</p>
                  {symptoms.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                        {t.results.symptomsLabel}
                      </p>
                      <ul className="space-y-1.5">
                        {symptoms.map((s, si) => (
                          <li key={si} className="flex items-start gap-2 text-sm text-neutral-600">
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary-400 mt-2" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contextual Local Farm Weather & Spray Advisory */}
        <div className="mb-6 animate-fade-in-up stagger-4">
          <div className="flex items-center gap-2 mb-2">
            <CloudSun className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900">Farm Weather & Spray Conditions</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-4">
            Live atmospheric readings and 7-day forecast to verify safe application conditions for your action plan.
          </p>
          <WeatherWidget variant="compact" />
        </div>

        {/* Action Plan */}
        <div className="mb-6 animate-fade-in-up stagger-5">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900">{t.results.actionPlanLabel}</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-4">{t.results.actionPlanSubtitle}</p>
          <div className="space-y-3">
            {r.action_plan.map((step: ActionStep, idx) => {
              const prio = priorityConfig[step.priority];
              const stepTitle = localized(step.title, step.titleLocalized, lang);
              const stepDesc = localized(step.description, step.descriptionLocalized, lang);
              const timeframe = localized(step.timeframe, step.timeframeLocalized, lang);
              const prioLabel = t.results[prio.labelKey];

              return (
                <Card key={step.id} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-neutral-900">{stepTitle}</h3>
                        <Badge variant={prio.variant}>{prioLabel}</Badge>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed mb-2">{stepDesc}</p>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Clock className="w-3.5 h-3.5" />
                        {timeframe}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Evidence & Sources */}
        <div className="mb-8 animate-fade-in-up stagger-6">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-bold text-neutral-900">{t.results.evidenceLabel}</h2>
          </div>
          <p className="text-sm text-neutral-500 mb-4">{t.results.evidenceSubtitle}</p>
          <div className="space-y-3">
            {r.sources.map((src: EvidenceSource, idx) => {
              const rel = relevanceConfig[src.relevance];
              const relLabel = t.results[rel.labelKey];

              return (
                <Card key={src.id} hover className={`animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-accent-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm text-neutral-900 leading-snug">{src.title}</h3>
                        <Badge variant={rel.variant} className="shrink-0">{relLabel}</Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mb-2">
                        {t.results.sourceLabel}: <span className="font-medium text-neutral-700">{src.source}</span>
                      </p>
                      <p className="text-sm text-neutral-600 leading-relaxed italic mb-2">"{src.snippet}"</p>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-700 transition-colors"
                        >
                          {t.results.viewSource}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <Button size="lg" fullWidth onClick={() => navigate('diagnosis')}>
            <ArrowLeft className="w-5 h-5" />
            {t.results.newDiagnosis}
          </Button>
          <Button size="lg" variant="outline" fullWidth onClick={() => navigate('history')}>
            {t.nav.history}
          </Button>
        </div>
      </div>
    </div>
  );
}
