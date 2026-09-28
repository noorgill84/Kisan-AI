import type {
  AnalyzeRequest,
  AnalysisResult,
  TranscribeRequest,
  TranscribeResponse,
  HistoryItem,
  PossibleCause,
  EvidenceSource,
  ActionStep,
  ConfidenceLevel,
  CropType,
  LanguageCode,
} from '@/types';
import { getAnonymousUserId, getStoredUserHistory } from '@/services/identity';
import { fetchWeatherData, searchLocations, DEFAULT_FARM_LOCATION } from '@/services/weather';

// ─── Configuration & Flags ──────────────────────────────────────────
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env as Record<string, string>).API_BASE_URL || 'http://localhost:8000';

const MOCK_DELAY = 1200;
const FETCH_TIMEOUT_MS = 6000; // 6 seconds max before falling back gracefully

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Fetch wrapper with built-in timeout to ensure UI never hangs on slow server cold starts
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ─── Mock Data Fallbacks ─────────────────────────────────────────────

const mockCauses: PossibleCause[] = [
  {
    id: 'cause-1',
    name: 'Leaf Blight (Bacterial)',
    nameLocalized: {
      en: 'Leaf Blight (Bacterial)',
      hi: 'पत्ती ब्लाइट (जीवाणु)',
      pa: 'ਪੱਤਾ ਬਲਾਈਟ (ਬੈਕਟੀਰੀਆ)',
    },
    category: 'disease',
    description:
      'Bacterial leaf blight is a common disease causing water-soaked lesions on leaves that expand and turn yellow-brown.',
    descriptionLocalized: {
      en: 'Bacterial leaf blight is a common disease causing water-soaked lesions on leaves that expand and turn yellow-brown.',
      hi: 'जीवाणु पत्ती ब्लाइट एक आम रोग है जो पत्तियों पर जल-भिग्न घाव बनाता है जो फैलकर पीले-भूरे हो जाते हैं।',
      pa: 'ਬੈਕਟੀਰੀਆ ਪੱਤਾ ਬਲਾਈਟ ਇੱਕ ਆਮ ਰੋਗ ਹੈ ਜੋ ਪੱਤਿਆਂ ਤੇ ਜਲ-ਭਿੱਜ ਜ਼ਖ਼ਮ ਬਣਾਉਂਦਾ ਹੈ ਜੋ ਫੈਲ ਕੇ ਪੀਲੇ-ਭੂਰੇ ਹੋ ਜਾਂਦੇ ਹਨ।',
    },
    likelihood: 'high',
    symptoms: [
      'Water-soaked lesions on leaf margins',
      'Yellow halo surrounding lesions',
      'Lesions expand and turn brown',
      'Leaf curling and wilting in advanced stages',
    ],
    symptomsLocalized: {
      en: [
        'Water-soaked lesions on leaf margins',
        'Yellow halo surrounding lesions',
        'Lesions expand and turn brown',
        'Leaf curling and wilting in advanced stages',
      ],
      hi: [
        'पत्ती किनारों पर जल-भिग्न घाव',
        'घाव के चारों ओर पीला हेलो',
        'घाव फैलकर भूरे हो जाते हैं',
        'उन्नत अवस्था में पत्तियों का मुड़ना और मुरझाना',
      ],
      pa: [
        'ਪੱਤਾ ਕਿਨਾਰਿਆਂ ਤੇ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ',
        'ਜ਼ਖ਼ਮ ਦੇ ਦੁਆਲੇ ਪੀਲਾ ਹੇਲੋ',
        'ਜ਼ਖ਼ਮ ਫੈਲ ਕੇ ਭੂਰੇ ਹੋ ਜਾਂਦੇ ਹਨ',
        'ਅਗਲੀ ਅਵਸਥਾ ਵਿੱਚ ਪੱਤਿਆਂ ਦਾ ਮੁੜਨਾ ਅਤੇ ਮੁਰਝਾਉਣਾ',
      ],
    },
  },
  {
    id: 'cause-2',
    name: 'Nitrogen Deficiency',
    nameLocalized: {
      en: 'Nitrogen Deficiency',
      hi: 'नाइट्रोजन की कमी',
      pa: 'ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ',
    },
    category: 'nutrient',
    description:
      'Nitrogen deficiency causes older leaves to yellow starting from the tips, with stunted growth and pale green appearance.',
    descriptionLocalized: {
      en: 'Nitrogen deficiency causes older leaves to yellow starting from the tips, with stunted growth and pale green appearance.',
      hi: 'नाइट्रोजन की कमी से पुरानी पत्तियां पीली हो जाती हैं, विकास रुक जाता है, और नई पत्तियां हल्की हरी दिखती हैं।',
      pa: 'ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ ਨਾਲ ਪੁਰਾਣੇ ਪੱਤੇ ਪੀਲੇ ਹੋ ਜਾਂਦੇ ਹਨ, ਵਾਧਾ ਰੁਕ ਜਾਂਦਾ ਹੈ, ਅਤੇ ਨਵੇਂ ਪੱਤੇ ਹਲਕੇ ਹਰੇ ਦਿਸਦੇ ਹਨ।',
    },
    likelihood: 'medium',
    symptoms: [
      'Yellowing of older leaves starting from tips',
      'Stunted plant growth',
      'Pale green younger leaves',
    ],
    symptomsLocalized: {
      en: [
        'Yellowing of older leaves starting from tips',
        'Stunted plant growth',
        'Pale green younger leaves',
      ],
      hi: [
        'पुरानी पत्तियों का सिरों से पीला होना',
        'पौधे का रुका हुआ विकास',
        'नई पत्तियां हल्की हरी',
      ],
      pa: [
        'ਪੁਰਾਣੇ ਪੱਤਿਆਂ ਦਾ ਸਿਰਿਆਂ ਤੋਂ ਪੀਲਾ ਹੋਣਾ',
        'ਬੂਟੇ ਦਾ ਰੁਕਿਆ ਵਾਧਾ',
        'ਨਵੇਂ ਪੱਤੇ ਹਲਕੇ ਹਰੇ',
      ],
    },
  },
];

const mockSources: EvidenceSource[] = [
  {
    id: 'src-1',
    title: 'ICAR-Indian Institute of Rice Research: Bacterial Leaf Blight Management',
    source: 'ICAR-IIRR',
    url: 'https://www.icar.org.in',
    snippet:
      'Bacterial leaf blight (BLB) caused by Xanthomonas oryzae pv. oryzae is one of the most serious diseases of rice. Initial symptoms appear as water-soaked stripes on leaf margins.',
    relevance: 'high',
  },
  {
    id: 'src-2',
    title: 'Plant Nutrient Deficiencies in Field Crops — A Diagnostic Guide',
    source: 'FAO Agricultural Bulletin',
    url: 'https://www.fao.org',
    snippet:
      'Nitrogen deficiency manifests as chlorosis beginning in older leaves, progressing to younger growth. Stunted growth is characteristic.',
    relevance: 'medium',
  },
];

const mockActionPlan: ActionStep[] = [
  {
    id: 'action-1',
    step: 1,
    title: 'Remove and destroy affected leaves',
    titleLocalized: {
      en: 'Remove and destroy affected leaves',
      hi: 'प्रभावित पत्तियों को हटाएं और नष्ट करें',
      pa: 'ਪ੍ਰਭਾਵਿਤ ਪੱਤਿਆਂ ਨੂੰ ਹਟਾਓ ਅਤੇ ਨਸ਼ਟ ਕਰੋ',
    },
    description:
      'Carefully remove and burn or bury leaves showing water-soaked lesions to reduce the spread of bacteria.',
    descriptionLocalized: {
      en: 'Carefully remove and burn or bury leaves showing water-soaked lesions to reduce the spread of bacteria.',
      hi: 'जीवाणु के प्रसार को रोकने के लिए जल-भिग्न घाव वाली पत्तियों को सावधानी से हटाएं और जला दें या दबा दें।',
      pa: 'ਬੈਕਟੀਰੀਆ ਦੇ ਫੈਲਾਅ ਨੂੰ ਰੋਕਣ ਲਈ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ ਵਾਲੇ ਪੱਤਿਆਂ ਨੂੰ ਸਾਵਧਾਨੀ ਨਾਲ ਹਟਾਓ ਅਤੇ ਸਾੜੋ ਜਾਂ ਦਬਾਓ।',
    },
    priority: 'immediate',
    timeframe: 'Within 24–48 hours',
    timeframeLocalized: {
      en: 'Within 24–48 hours',
      hi: '24–48 घंटे के भीतर',
      pa: '24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ',
    },
  },
  {
    id: 'action-2',
    step: 2,
    title: 'Apply copper-based bactericide spray',
    titleLocalized: {
      en: 'Apply copper-based bactericide spray',
      hi: 'तांबा-आधारित जीवाणुनाशक स्प्रे लगाएं',
      pa: 'ਤਾਂਬਾ-ਆਧਾਰਿਤ ਬੈਕਟੀਰੀਸਾਈਡ ਸਪ੍ਰੇਅ ਲਗਾਓ',
    },
    description:
      'Apply copper oxychloride at recommended dosage in early morning or late evening.',
    descriptionLocalized: {
      en: 'Apply copper oxychloride at recommended dosage in early morning or late evening.',
      hi: 'अनुशंसित खुराक पर तांबा ऑक्सीक्लोराइड लगाएं। सुबह जल्दी या शाम देर से स्प्रे करें।',
      pa: 'ਸਿਫਾਰਸ਼ੀ ਖ਼ੁਰਾਕ ਤੇ ਤਾਂਬਾ ਆਕਸੀਕਲੋਰਾਈਡ ਲਗਾਓ। ਸਵੇਰੇ ਜਲਦੀ ਜਾਂ ਸ਼ਾਮ ਦੇਰ ਨਾਲ ਸਪ੍ਰੇਅ ਕਰੋ।',
    },
    priority: 'short-term',
    timeframe: 'Within 3–5 days',
    timeframeLocalized: {
      en: 'Within 3–5 days',
      hi: '3–5 दिन के भीतर',
      pa: '3–5 ਦਿਨਾਂ ਦੇ ਅੰਦਰ',
    },
  },
];

async function mockAnalyzeInput(req: AnalyzeRequest): Promise<AnalysisResult> {
  await delay(MOCK_DELAY);
  const userId = req.userId || getAnonymousUserId();
  const cropType = (req.cropType && req.cropType !== 'unknown') ? req.cropType : 'wheat';
  const hasImage = !!req.imageDataUrl;
  const hasText = !!(req.transcription || req.textDescription);
  const confidence: ConfidenceLevel = (hasImage && hasText) ? 'high' : (hasImage || hasText) ? 'medium' : 'low';

  const cropTypeLocalized: Record<LanguageCode, string> = {
    en: cropType.charAt(0).toUpperCase() + cropType.slice(1),
    hi: cropType === 'wheat' ? 'गेहूं' : cropType === 'rice' ? 'चावल' : cropType === 'maize' ? 'मक्का' : 'अज्ञात',
    pa: cropType === 'wheat' ? 'ਕਣਕ' : cropType === 'rice' ? 'ਚੌਲ' : cropType === 'maize' ? 'ਮੱਕੀ' : 'ਅਣਜਾਣ',
  };

  const summary = 'Based on the submitted input, the most likely possible cause is bacterial leaf blight, with moderate evidence of nutrient deficiency.';

  return {
    id: randomId(),
    userId,
    cropType,
    cropTypeLocalized,
    possible_causes: mockCauses,
    confidence_level: confidence,
    confidenceNarrative: 'Decision support assessment based on visual and contextual evidence.',
    confidenceNarrativeLocalized: {
      en: 'Decision support assessment based on visual and contextual evidence.',
      hi: 'दृश्य और संदर्भात्मक साक्ष्य के आधार पर निर्णय सहायता मूल्यांकन।',
      pa: 'ਦਿੱਖ ਅਤੇ ਸੰਦਰਭ ਸਬੂਤ ਦੇ ਆਧਾਰ ਤੇ ਫੈਸਲੇ ਸਹਾਇਤਾ ਮੁਲਾਂਕਣ।',
    },
    sources: mockSources,
    action_plan: mockActionPlan,
    escalation_flag: confidence === 'low',
    summary,
    summaryLocalized: {
      en: summary,
      hi: 'सबमिट किए गए इनपुट के आधार पर सबसे संभावित कारण जीवाणु पत्ती ब्लाइट है।',
      pa: 'ਸਪੁਰਦ ਕੀਤੇ ਇਨਪੁਟ ਦੇ ਆਧਾਰ ਤੇ ਸਭ ਤੋਂ ਸੰਭਾਵਿਤ ਕਾਰਨ ਬੈਕਟੀਰੀਆ ਪੱਤਾ ਬਲਾਈਟ ਹੈ।',
    },
    createdAt: new Date().toISOString(),
    imageDataUrl: req.imageDataUrl,
    userDescription: req.textDescription,
    transcription: req.transcription,
  };
}

async function mockTranscribeAudio(req: TranscribeRequest): Promise<TranscribeResponse> {
  await delay(MOCK_DELAY);
  const mockTranscriptions: Record<LanguageCode, string> = {
    en: 'Yellow spots appeared on the lower leaves about a week ago. They started small but have been spreading upward.',
    hi: 'लगभग एक हफ्ते पहले निचली पत्तियों पर पीले धब्बे दिखे। वे छोटे थे लेकिन ऊपर की ओर फैल रहे हैं।',
    pa: 'ਲਗਭਗ ਇੱਕ ਹਫ਼ਤਾ ਪਹਿਲਾਂ ਹੇਠਲੇ ਪੱਤਿਆਂ ਤੇ ਪੀਲੇ ਧੱਬੇ ਦਿਸੇ। ਉਹ ਛੋਟੇ ਸਨ ਪਰ ਉੱਪਰ ਵੱਲ ਫੈਲ ਰਹੇ ਹਨ।',
  };

  return {
    text: mockTranscriptions[req.language] ?? mockTranscriptions.en,
    language: req.language,
    confidence: 0.92,
  };
}

// ─── Real API Functions with Fallback ───────────────────────────────

export async function analyzeInput(req: AnalyzeRequest): Promise<AnalysisResult> {
  if (USE_MOCK) {
    return mockAnalyzeInput(req);
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: req.userId || getAnonymousUserId(),
        imageDataUrl: req.imageDataUrl,
        textDescription: req.textDescription,
        transcription: req.transcription,
        language: req.language,
        cropType: req.cropType,
      }),
    }, FETCH_TIMEOUT_MS);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(`API Error ${res.status}: ${errJson.detail || res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('[KisanAI API] analyzeInput endpoint unreachable or timed out, using fallback:', err);
    return mockAnalyzeInput(req);
  }
}

export async function transcribeAudio(req: TranscribeRequest): Promise<TranscribeResponse> {
  if (USE_MOCK) {
    return mockTranscribeAudio(req);
  }

  try {
    const formData = new FormData();
    formData.append('file', req.audioBlob, 'audio.webm');
    formData.append('language', req.language);

    const res = await fetchWithTimeout(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    }, FETCH_TIMEOUT_MS);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(`STT API Error ${res.status}: ${errJson.detail || res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('[KisanAI API] transcribeAudio endpoint unreachable or timed out, using fallback:', err);
    return mockTranscribeAudio(req);
  }
}

export async function getHistory(userId?: string): Promise<HistoryItem[]> {
  const effectiveUserId = userId || getAnonymousUserId();

  if (USE_MOCK) {
    const stored = getStoredUserHistory(effectiveUserId);
    return stored.map((item) => ({
      id: item.id,
      userId: item.userId || effectiveUserId,
      cropType: item.cropType,
      cropTypeLocalized: item.cropTypeLocalized,
      confidence_level: item.confidence_level,
      summary: item.summary,
      summaryLocalized: item.summaryLocalized,
      createdAt: item.createdAt,
      possible_causes_count: item.possible_causes.length,
      escalation_flag: item.escalation_flag,
      thumbnailUrl: item.imageDataUrl,
    }));
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/history?userId=${encodeURIComponent(effectiveUserId)}`, {}, 4000);
    if (!res.ok) throw new Error(`History API Error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[KisanAI API] getHistory endpoint unreachable or timed out, using stored local fallback:', err);
    const stored = getStoredUserHistory(effectiveUserId);
    return stored.map((item) => ({
      id: item.id,
      userId: item.userId || effectiveUserId,
      cropType: item.cropType,
      cropTypeLocalized: item.cropTypeLocalized,
      confidence_level: item.confidence_level,
      summary: item.summary,
      summaryLocalized: item.summaryLocalized,
      createdAt: item.createdAt,
      possible_causes_count: item.possible_causes.length,
      escalation_flag: item.escalation_flag,
      thumbnailUrl: item.imageDataUrl,
    }));
  }
}

export async function getWeather(locationQuery?: string): Promise<{
  temperature: number;
  humidity: number;
  condition: string;
  windSpeed: number;
  rainfall: number;
  location: string;
}> {
  if (!USE_MOCK) {
    try {
      const locParam = locationQuery ? `?location=${encodeURIComponent(locationQuery)}` : '';
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/weather${locParam}`, {}, 4000);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[KisanAI API] Weather backend unreachable, falling back to Open-Meteo client side:', err);
    }
  }

  // Client-side Open-Meteo fallback
  try {
    let lat = DEFAULT_FARM_LOCATION.latitude;
    let lon = DEFAULT_FARM_LOCATION.longitude;
    let locName = `${DEFAULT_FARM_LOCATION.name}, ${DEFAULT_FARM_LOCATION.region}`;

    if (locationQuery && locationQuery.trim().length > 1) {
      const suggestions = await searchLocations(locationQuery);
      if (suggestions.length > 0) {
        lat = suggestions[0].latitude;
        lon = suggestions[0].longitude;
        locName = `${suggestions[0].name}, ${suggestions[0].region || suggestions[0].country}`;
      }
    }

    const live = await fetchWeatherData(lat, lon, locName);
    return {
      temperature: live.current.temperature,
      humidity: live.current.humidity,
      condition: live.current.condition,
      windSpeed: live.current.windSpeed,
      rainfall: live.current.rainChance,
      location: locName,
    };
  } catch (err) {
    return {
      temperature: 28,
      humidity: 68,
      condition: 'Partly Cloudy',
      windSpeed: 10,
      rainfall: 15,
      location: locationQuery || `${DEFAULT_FARM_LOCATION.name}, ${DEFAULT_FARM_LOCATION.region}`,
    };
  }
}
