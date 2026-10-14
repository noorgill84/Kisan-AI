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
  onRecorded: (blob: Blob, liveTranscript?: string) => void;
  onTranscriptionChange?: (text: string) => void;
  language?: string;
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
  onTranscriptionChange,
  language = 'en',
  isProcessing,
  error,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>('');
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Detect supported audio mimeType across iOS Safari and Android/Desktop
      let chosenMime = '';
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          chosenMime = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          chosenMime = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          chosenMime = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          chosenMime = 'audio/aac';
        }
      }

      const mr = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      liveTranscriptRef.current = '';
      isRecordingRef.current = true;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const actualType = mr.mimeType || chosenMime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualType });
        onRecorded(blob, liveTranscriptRef.current || undefined);
        stream.getTracks().forEach((t) => t.stop());
      };

      // Native SpeechRecognition for accurate real-time voice recognition
      const windowObj = window as unknown as {
        SpeechRecognition?: any;
        webkitSpeechRecognition?: any;
      };
      const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const sr = new SpeechRecognition();
          sr.continuous = true;
          sr.interimResults = true;
          // Chromium standard: 'pa-Guru-IN' for Punjabi (Gurmukhi, India), 'hi-IN' for Hindi, 'en-IN' for English
          const primaryLangTag = language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-Guru-IN' : 'en-IN';
          sr.lang = primaryLangTag;

          sr.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            const cleaned = fullText.trim();
            if (cleaned) {
              liveTranscriptRef.current = cleaned;
              if (onTranscriptionChange) {
                onTranscriptionChange(cleaned);
              }
            }
          };

          sr.onerror = (event: any) => {
            console.warn('[VoiceRecorder] SpeechRecognition error:', event?.error);
            // If pa-Guru-IN is rejected by the browser, attempt fallback to pa-IN
            if (event?.error === 'language-not-supported' && sr.lang === 'pa-Guru-IN') {
              try {
                sr.lang = 'pa-IN';
                if (isRecordingRef.current) sr.start();
              } catch {}
            }
          };

          sr.onend = () => {
            // Re-start recognition if user is still actively recording (handles natural speech pauses)
            if (isRecordingRef.current) {
              try {
                sr.start();
              } catch {}
            }
          };

          sr.start();
          recognitionRef.current = sr;
        } catch (err) {
          console.warn('[VoiceRecorder] SpeechRecognition start failed:', err);
        }
      }

      mr.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      // Microphone permission denied or not available
    }
  }

  function stopRecording() {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
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
              <textarea
                value={transcription}
                onChange={(e) => onTranscriptionChange && onTranscriptionChange(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100 transition-all duration-200 resize-none italic"
              />
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
