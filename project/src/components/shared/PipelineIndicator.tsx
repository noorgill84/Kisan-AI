import { Image as ImageIcon, Search, BrainCircuit, CheckCircle } from 'lucide-react';
import type { LanguageCode } from '@/types';

interface PipelineIndicatorProps {
  stage: number; // 0 = image, 1 = retrieval, 2 = reasoning, 3 = complete
  labels: {
    stageImage: string;
    stageImageDesc: string;
    stageRetrieval: string;
    stageRetrievalDesc: string;
    stageReasoning: string;
    stageReasoningDesc: string;
    stageComplete: string;
    stageCompleteDesc: string;
  };
  lang: LanguageCode;
}

const stages = [
  { icon: ImageIcon, key: 'stageImage', descKey: 'stageImageDesc' },
  { icon: Search, key: 'stageRetrieval', descKey: 'stageRetrievalDesc' },
  { icon: BrainCircuit, key: 'stageReasoning', descKey: 'stageReasoningDesc' },
  { icon: CheckCircle, key: 'stageComplete', descKey: 'stageCompleteDesc' },
] as const;

export function PipelineIndicator({ stage, labels }: PipelineIndicatorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        {stages.map((s, idx) => {
          const isComplete = idx < stage;
          const isActive = idx === stage;
          const isPending = idx > stage;
          const Icon = s.icon;
          const title = labels[s.key];
          const desc = labels[s.descKey];

          return (
            <div
              key={idx}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                isActive
                  ? 'bg-primary-50 border-primary-300 scale-[1.02] shadow-sm shadow-primary-600/10'
                  : isComplete
                    ? 'bg-success-50/60 border-success-200'
                    : 'bg-neutral-50 border-neutral-200 opacity-60'
              }`}
              style={{
                animation: isActive
                  ? 'fadeInUp 0.4s ease-out forwards'
                  : isComplete
                    ? 'fadeIn 0.3s ease-out forwards'
                    : undefined,
              }}
            >
              <div
                className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                    : isComplete
                      ? 'bg-success-500 text-white'
                      : 'bg-neutral-200 text-neutral-400'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-6 h-6" />
                ) : isActive ? (
                  <Icon className="w-6 h-6 animate-pulse-soft" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-bold text-sm ${
                    isActive
                      ? 'text-primary-800'
                      : isComplete
                        ? 'text-success-700'
                        : 'text-neutral-400'
                  }`}
                >
                  {title}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isActive ? 'text-primary-600' : isComplete ? 'text-success-600' : 'text-neutral-400'
                  }`}
                >
                  {desc}
                </p>
              </div>
              {isActive && (
                <div className="flex gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
