// ─── API Data Contracts ──────────────────────────────────────────────
// These types match the expected backend response shape.
// When the real API is connected, responses should conform to these interfaces.

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type LanguageCode = 'en' | 'hi' | 'pa';

export type CropType =
  | 'wheat'
  | 'rice'
  | 'maize'
  | 'cotton'
  | 'sugarcane'
  | 'tomato'
  | 'potato'
  | 'unknown';

export interface PossibleCause {
  id: string;
  name: string;
  nameLocalized?: Record<LanguageCode, string>;
  category: 'disease' | 'pest' | 'nutrient' | 'environmental' | 'physiological';
  description: string;
  descriptionLocalized?: Record<LanguageCode, string>;
  likelihood: ConfidenceLevel;
  symptoms: string[];
  symptomsLocalized?: Record<LanguageCode, string[]>;
}

export interface EvidenceSource {
  id: string;
  title: string;
  source: string;
  url?: string;
  snippet: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface ActionStep {
  id: string;
  step: number;
  title: string;
  titleLocalized?: Record<LanguageCode, string>;
  description: string;
  descriptionLocalized?: Record<LanguageCode, string>;
  priority: 'immediate' | 'short-term' | 'preventive';
  timeframe: string;
  timeframeLocalized?: Record<LanguageCode, string>;
}

export interface AnalysisResult {
  id: string;
  userId?: string;
  cropType: CropType;
  cropTypeLocalized?: Record<LanguageCode, string>;
  possible_causes: PossibleCause[];
  confidence_level: ConfidenceLevel;
  confidenceNarrative: string;
  confidenceNarrativeLocalized?: Record<LanguageCode, string>;
  sources: EvidenceSource[];
  action_plan: ActionStep[];
  escalation_flag: boolean;
  escalationGuidance?: string;
  escalationGuidanceLocalized?: Record<LanguageCode, string>;
  summary: string;
  summaryLocalized?: Record<LanguageCode, string>;
  createdAt: string;
  imageDataUrl?: string;
  userDescription?: string;
  transcription?: string;
}

export interface HistoryItem {
  id: string;
  userId?: string;
  cropType: CropType;
  cropTypeLocalized?: Record<LanguageCode, string>;
  confidence_level: ConfidenceLevel;
  summary: string;
  summaryLocalized?: Record<LanguageCode, string>;
  createdAt: string;
  possible_causes_count: number;
  escalation_flag: boolean;
  thumbnailUrl?: string;
}

export interface WeatherInfo {
  temperature: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  rainfall: number;
  location: string;
}

// ─── API Request Shapes ──────────────────────────────────────────────

export interface AnalyzeRequest {
  userId?: string;
  imageDataUrl?: string;
  transcription?: string;
  textDescription?: string;
  language: LanguageCode;
  cropType?: CropType;
}

export interface TranscribeRequest {
  audioBlob: Blob;
  language: LanguageCode;
}

export interface TranscribeResponse {
  text: string;
  language: LanguageCode;
  confidence: number;
}

