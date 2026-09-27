import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import type { ConfidenceLevel, LanguageCode } from '@/types';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  labels: {
    high: string;
    medium: string;
    low: string;
  };
  descriptions: {
    high: string;
    medium: string;
    low: string;
  };
  lang: LanguageCode;
  size?: 'sm' | 'lg';
}

const config = {
  high: {
    icon: CheckCircle,
    bg: 'bg-success-50',
    border: 'border-success-200',
    text: 'text-success-700',
    iconColor: 'text-success-500',
    dot: 'bg-success-500',
  },
  medium: {
    icon: AlertCircle,
    bg: 'bg-warning-50',
    border: 'border-warning-200',
    text: 'text-warning-700',
    iconColor: 'text-warning-500',
    dot: 'bg-warning-500',
  },
  low: {
    icon: AlertTriangle,
    bg: 'bg-error-50',
    border: 'border-error-200',
    text: 'text-error-700',
    iconColor: 'text-error-500',
    dot: 'bg-error-500',
  },
};

export function ConfidenceBadge({
  level,
  labels,
  descriptions,
  size = 'lg',
}: ConfidenceBadgeProps) {
  const c = config[level];
  const Icon = c.icon;
  const label = labels[level];
  const desc = descriptions[level];

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${c.bg} ${c.border} ${c.text}`}
      >
        <Icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
        {label}
      </span>
    );
  }

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${c.bg} ${c.border}`}>
      <div className={`shrink-0 w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${c.iconColor}`} />
      </div>
      <div>
        <p className={`font-bold text-sm ${c.text}`}>{label}</p>
        <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
