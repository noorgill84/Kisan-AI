import { useRef, useState, useEffect } from 'react';
import { Mic, Square, Loader2, AudioLines } from 'lucide-react';

interface VoiceRecorderProps {
  label: string;
  hint: string;
  startLabel: string;
  stopLabel: string;
  recordingLabel: string;
  processingLabel: string;
  transcription: string;
  transcriptionLabel: string;
  transcriptionPlaceholder: string;
  onRecorded: (blob: Blob) => void;
  isProcessing: boolean;
  error?: string;
}

export function VoiceRecorder({
  label,
  hint,
  startLabel,
  stopLabel,
  recordingLabel,
  processingLabel,
  transcription,
  transcriptionLabel,
  transcriptionPlaceholder,
  onRecorded,
  isProcessing,
  error,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecorded(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      // Microphone permission denied or not available
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <label className="block text-sm font-bold text-neutral-800 mb-1.5">{label}</label>
      <p className="text-xs text-neutral-500 mb-3">{hint}</p>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-center gap-3">
          {!isRecording && !isProcessing && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-all duration-200 active:scale-95"
            >
              <Mic className="w-4 h-4" />
              {startLabel}
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-error-600 text-white text-sm font-semibold hover:bg-error-700 transition-all duration-200 active:scale-95"
            >
              <Square className="w-4 h-4" />
              {stopLabel}
            </button>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-100 text-accent-700 text-sm font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              {processingLabel}
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-error-600">
                <span className="w-2.5 h-2.5 rounded-full bg-error-500 animate-pulse" />
                {recordingLabel}
              </span>
              <span className="text-sm text-neutral-500 font-mono">{formatTime(seconds)}</span>
            </div>
          )}

          {!isRecording && !isProcessing && transcription && (
            <div className="flex items-center gap-1.5 text-sm text-success-600 font-semibold">
              <AudioLines className="w-4 h-4" />
              <span className="text-xs">Recorded</span>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-xs text-error-600 font-medium">{error}</p>
        )}

        {(transcription || isProcessing) && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              {transcriptionLabel}
            </p>
            {isProcessing ? (
              <div className="space-y-2">
                <div className="h-3 rounded shimmer-bg animate-shimmer" />
                <div className="h-3 rounded shimmer-bg animate-shimmer w-4/5" />
                <div className="h-3 rounded shimmer-bg animate-shimmer w-3/5" />
              </div>
            ) : (
              <p className="text-sm text-neutral-700 leading-relaxed italic">
                "{transcription}"
              </p>
            )}
          </div>
        )}

        {!transcription && !isProcessing && !isRecording && (
          <p className="mt-3 text-xs text-neutral-400 italic">
            {transcriptionPlaceholder}
          </p>
        )}
      </div>
    </div>
  );
}
