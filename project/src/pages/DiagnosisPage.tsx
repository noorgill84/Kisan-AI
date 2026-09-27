import { useState } from 'react';
import { Send, Loader2, AlertCircle, Leaf } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { VoiceRecorder } from '@/components/shared/VoiceRecorder';
import { analyzeInput, transcribeAudio } from '@/services/api';
import type { CropType, AnalysisResult } from '@/types';

export function DiagnosisPage() {
  const { t, lang } = useLanguage();
  const { navigate, setCurrentResult, userId } = useApp();

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [transcription, setTranscription] = useState('');
  const [cropType, setCropType] = useState<CropType | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const cropOptions: { value: CropType; label: string }[] = [
    { value: 'wheat', label: t.diagnosis.cropWheat },
    { value: 'rice', label: t.diagnosis.cropRice },
    { value: 'maize', label: t.diagnosis.cropMaize },
    { value: 'cotton', label: t.diagnosis.cropCotton },
    { value: 'sugarcane', label: t.diagnosis.cropSugarcane },
    { value: 'tomato', label: t.diagnosis.cropTomato },
    { value: 'potato', label: t.diagnosis.cropPotato },
    { value: 'unknown', label: t.diagnosis.cropUnknown },
  ];

  async function handleRecorded(blob: Blob) {
    setIsTranscribing(true);
    setTranscribeError(null);
    try {
      const result = await transcribeAudio({ audioBlob: blob, language: lang });
      setTranscription(result.text);
    } catch {
      setTranscribeError(t.diagnosis.errorTranscribe);
    } finally {
      setIsTranscribing(false);
    }
  }

  async function handleSubmit() {
    if (!imageDataUrl && !textDescription && !transcription) {
      setFormError(t.diagnosis.errorNoInput);
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    navigate('processing');

    try {
      const result: AnalysisResult = await analyzeInput({
        userId,
        imageDataUrl: imageDataUrl ?? undefined,
        textDescription: textDescription || undefined,
        transcription: transcription || undefined,
        language: lang,
        cropType: cropType || undefined,
      });
      setCurrentResult(result);
      navigate('results');
    } catch {
      setFormError(t.diagnosis.errorNoInput);
      setIsSubmitting(false);
      navigate('diagnosis');
    }
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container-app max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 mb-4">
            <Leaf className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
            {t.diagnosis.title}
          </h1>
          <p className="mt-2 text-neutral-500">{t.diagnosis.subtitle}</p>
        </div>

        {/* Form */}
        <Card className="animate-fade-in-up">
          <div className="space-y-6">
            {/* Image upload */}
            <ImageUpload
              value={imageDataUrl}
              onChange={setImageDataUrl}
              label={t.diagnosis.imageLabel}
              hint={t.diagnosis.imageHint}
              dragHint={t.diagnosis.imageDragHint}
              removeLabel={t.diagnosis.imageRemove}
            />

            {/* Voice recorder */}
            <VoiceRecorder
              label={t.diagnosis.voiceLabel}
              hint={t.diagnosis.voiceHint}
              startLabel={t.diagnosis.recordStart}
              stopLabel={t.diagnosis.recordStop}
              recordingLabel={t.diagnosis.recordRecording}
              processingLabel={t.diagnosis.recordProcessing}
              transcription={transcription}
              transcriptionLabel={t.diagnosis.transcriptionLabel}
              transcriptionPlaceholder={t.diagnosis.transcriptionPlaceholder}
              onRecorded={handleRecorded}
              isProcessing={isTranscribing}
              error={transcribeError ?? undefined}
            />

            {/* Text description */}
            <div>
              <label className="block text-sm font-bold text-neutral-800 mb-1.5">
                {t.diagnosis.textLabel}
              </label>
              <textarea
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder={t.diagnosis.textPlaceholder}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all duration-200 resize-none"
              />
            </div>

            {/* Crop type selector */}
            <div>
              <label className="block text-sm font-bold text-neutral-800 mb-1.5">
                {t.diagnosis.cropLabel}{' '}
                <span className="text-neutral-400 font-normal text-xs">
                  ({t.diagnosis.optional})
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {cropOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCropType(opt.value)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      cropType === opt.value
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-200 hover:bg-primary-50/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {formError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error-50 border border-error-200 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
                <p className="text-sm text-error-700">{formError}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <Button
                size="lg"
                fullWidth
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.diagnosis.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t.diagnosis.submit}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
