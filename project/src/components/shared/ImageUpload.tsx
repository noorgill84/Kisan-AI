import { useRef, useState, useCallback } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label: string;
  hint: string;
  dragHint: string;
  removeLabel: string;
}

export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  dragHint,
  removeLabel,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div>
      <label className="block text-sm font-bold text-neutral-800 mb-1.5">{label}</label>
      <p className="text-xs text-neutral-500 mb-3">{hint}</p>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50">
          <img src={value} alt="Uploaded crop" className="w-full h-56 object-cover" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm text-neutral-700 hover:text-error-600 hover:bg-white transition-all duration-200"
            aria-label={removeLabel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 p-8 text-center ${
            isDragging
              ? 'border-primary-400 bg-primary-50 scale-[1.01]'
              : 'border-neutral-300 bg-neutral-50 hover:border-primary-300 hover:bg-primary-50/30'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 justify-center">
                <Upload className="w-4 h-4" />
                {dragHint}
              </p>
              <p className="text-xs text-neutral-400 mt-1">JPG, PNG, WebP — up to 10MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
