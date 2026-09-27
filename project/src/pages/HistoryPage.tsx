import { useState } from 'react';
import {
  History as HistoryIcon,
  Trash2,
  Eye,
  Leaf,
  Calendar,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/shared/ConfidenceBadge';
import type { LanguageCode } from '@/types';

function localized(val: string | undefined, localized: Record<LanguageCode, string> | undefined, lang: LanguageCode): string {
  if (localized && localized[lang]) return localized[lang];
  return val ?? '';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function HistoryPage() {
  const { t, lang } = useLanguage();
  const { savedHistory, removeFromHistory, clearHistory, navigate, setCurrentResult, userId } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

  // Strictly isolate history: only show records belonging to this anonymous user
  const userHistory = savedHistory.filter((item) => !item.userId || item.userId === userId);

  function handleView(id: string) {
    const item = userHistory.find((r) => r.id === id);
    if (item) {
      setCurrentResult(item);
      navigate('results');
    }
  }

  function handleClearAll() {
    if (confirmClear) {
      clearHistory();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container-app max-w-4xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 animate-fade-in-down">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <HistoryIcon className="w-5 h-5 text-primary-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
                {t.history.title}
              </h1>
            </div>
            <p className="text-neutral-500">{t.history.subtitle}</p>
          </div>
          {userHistory.length > 0 && (
            <Button
              size="sm"
              variant={confirmClear ? 'danger' : 'outline'}
              onClick={handleClearAll}
            >
              <Trash2 className="w-4 h-4" />
              {confirmClear ? t.history.confirmClear : t.history.clearAll}
            </Button>
          )}
        </div>

        {/* Empty state */}
        {userHistory.length === 0 && (
          <Card className="text-center py-16 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-100 mb-4">
              <Inbox className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-500 mb-6 max-w-sm mx-auto">{t.history.empty}</p>
            <Button onClick={() => navigate('diagnosis')}>
              <Leaf className="w-4 h-4" />
              {t.history.emptyCta}
            </Button>
          </Card>
        )}

        {/* History list */}
        {userHistory.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userHistory.map((item, idx) => {
              const cropName = item.cropTypeLocalized
                ? localized(item.cropType, item.cropTypeLocalized, lang)
                : item.cropType;
              const summary = item.summaryLocalized
                ? localized(item.summary, item.summaryLocalized, lang)
                : item.summary;

              return (
                <Card
                  key={item.id}
                  hover
                  className={`flex flex-col animate-fade-in-up stagger-${Math.min(idx + 1, 5)}`}
                >
                  {/* Thumbnail or placeholder */}
                  {item.imageDataUrl ? (
                    <div className="rounded-xl overflow-hidden mb-4 -mx-6 -mt-6 h-32">
                      <img src={item.imageDataUrl} alt={cropName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 mb-4 -mx-6 -mt-6 h-32 flex items-center justify-center">
                      <Leaf className="w-10 h-10 text-primary-300" />
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant="primary" dot>
                      <Leaf className="w-3 h-3" />
                      {cropName}
                    </Badge>
                    <Badge variant="neutral">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </Badge>
                    {item.escalation_flag && (
                      <Badge variant="error" dot>
                        <AlertTriangle className="w-3 h-3" />
                        {t.history.escalated}
                      </Badge>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-neutral-600 leading-relaxed flex-1 mb-4 line-clamp-3">
                    {summary}
                  </p>

                  {/* Confidence + causes count */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <ConfidenceBadge
                      level={item.confidence_level}
                      size="sm"
                      labels={{
                        high: t.results.confidenceHigh,
                        medium: t.results.confidenceMedium,
                        low: t.results.confidenceLow,
                      }}
                      descriptions={{ high: '', medium: '', low: '' }}
                      lang={lang}
                    />
                    <span className="text-xs text-neutral-400">
                      {item.possible_causes.length} {t.history.causesCount}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" fullWidth onClick={() => handleView(item.id)}>
                      <Eye className="w-4 h-4" />
                      {t.history.viewLabel}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromHistory(item.id)}
                      className="shrink-0 px-3"
                    >
                      <Trash2 className="w-4 h-4 text-error-500" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
