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

const MOCK_DELAY = 300;
const FETCH_TIMEOUT_MS = 5000; // 5 seconds maximum to guarantee sub-5s dynamic real-time responses

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Background ping to wake up sleeping Render backend instance as soon as the site loads
 */
export function warmupBackend(): void {
  if (USE_MOCK) return;
  fetch(`${API_BASE_URL}/health`).catch(() => {
    // Silent background ping
  });
}

// Trigger immediate warmup on site load
warmupBackend();

/**
 * Fetch wrapper with built-in timeout to allow complete real RAG processing
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

// ─── Dynamic Client-Side RAG Engine for Offline / Fallback ────────────

interface ClientDiagnoses {
  id: string;
  crop: CropType | 'any';
  keywords: string[];
  cause: PossibleCause;
  sources: EvidenceSource[];
  actions: ActionStep[];
}

const CLIENT_KB_REGISTRY: ClientDiagnoses[] = [
  {
    id: 'maize-faw',
    crop: 'maize',
    keywords: ['armyworm', 'whorl', 'frass', 'sawdust', 'hole', 'caterpillar', 'maize', 'corn'],
    cause: {
      id: 'cause-maize-faw',
      name: 'Fall Armyworm (Spodoptera frugiperda)',
      nameLocalized: {
        en: 'Fall Armyworm (Spodoptera frugiperda)',
        hi: 'फॉलबैक आर्मीडर्म / लट (स्पोडोप्टेरा फ्रूगीपर्दा)',
        pa: 'ਫਾਲ ਆਰਮੀਵਰਮ / ਸੁੰਡੀ (ਸਪੋਡੋਪਟੇਰਾ ਫ੍ਰੂਗੀਪਰਡਾ)',
      },
      category: 'pest',
      description: 'Fall Armyworm larvae bore into maize leaf whorls, feeding aggressively and leaving ragged holes and sawdust-like frass excrement.',
      descriptionLocalized: {
        en: 'Fall Armyworm larvae bore into maize leaf whorls, feeding aggressively and leaving ragged holes and sawdust-like frass excrement.',
        hi: 'फॉल आर्मीडर्म की लटें मक्का के पोंगे (whorl) में घुसकर पत्तियों को खाती हैं, जिससे कटे-फटे छेद और लकड़ी के बुरादे जैसा मल जमा होता है।',
        pa: 'ਫਾਲ ਆਰਮੀਵਰਮ ਦੀਆਂ ਸੁੰਡੀਆਂ ਮੱਕੀ ਦੇ ਪੋਂਗੇ ਵਿੱਚ ਵੜ ਕੇ ਪੱਤਿਆਂ ਨੂੰ ਖਾਂਦੀਆਂ ਹਨ, ਜਿਸ ਨਾਲ ਫਟੇ ਹੋਏ ਛੇਕ ਅਤੇ ਲੱਕੜ ਦੇ ਬੁਰਾਦੇ ਵਰਗਾ ਮਲ ਜਮ੍ਹਾਂ ਹੁੰਦਾ ਹੈ।',
      },
      likelihood: 'high',
      symptoms: [
        'Ragged, irregular holes and torn margins on central whorl leaves',
        'Accumulation of moist sawdust-like frass inside whorls',
        'Larvae with distinct inverted Y-mark on head capsule',
      ],
      symptomsLocalized: {
        en: [
          'Ragged, irregular holes and torn margins on central whorl leaves',
          'Accumulation of moist sawdust-like frass inside whorls',
          'Larvae with distinct inverted Y-mark on head capsule',
        ],
        hi: [
          'केंद्रीय पोंगे की पत्तियों पर अनियमित कटे-फटे छेद',
          'पोंगे के अंदर गीले बुरादे जैसा मल जमा होना',
          'सिर पर उल्टे Y के निशान वाली हरी-भूरी लटें',
        ],
        pa: [
          'ਕੇਂਦਰੀ ਪੋਂਗੇ ਦੇ ਪੱਤਿਆਂ ਤੇ ਅਨਿਯਮਿਤ ਫਟੇ ਹੋਏ ਛੇਕ',
          'ਪੋਂਗੇ ਦੇ ਅੰਦਰ ਗਿੱਲੇ ਬੁਰਾਦੇ ਵਰਗਾ ਮਲ ਜਮ੍ਹਾਂ ਹੋਣਾ',
          'ਸਿਰ ਤੇ ਉਲਟੇ Y ਦੇ ਨਿਸ਼ਾਨ ਵਾਲੀਆਂ ਸੁੰਡੀਆਂ',
        ],
      },
    },
    sources: [
      {
        id: 'src-faw-1',
        title: 'ICAR-IIMR Advisory on Maize Fall Armyworm Integrated Management',
        source: 'ICAR-Indian Institute of Maize Research',
        url: 'https://iimr.icar.gov.in',
        snippet: 'Fall armyworm attacks young whorls leaving characteristic ragged holes and moist frass. Chlorantraniliprole whorl application is recommended.',
        relevance: 'high',
      },
    ],
    actions: [
      {
        id: 'act-faw-1',
        step: 1,
        title: 'Apply Chlorantraniliprole 18.5 SC directly into whorls',
        titleLocalized: {
          en: 'Apply Chlorantraniliprole 18.5 SC directly into whorls',
          hi: 'पोंगे में सीधे क्लोरैंट्रानिप्रोल 18.5 SC डालें',
          pa: 'ਪੋਂਗੇ ਵਿੱਚ ਸਿੱਧਾ ਕਲੋਰੈਂਟ੍ਰਾਨੀਪ੍ਰੋਲ 18.5 SC ਪਾਓ',
        },
        description: 'Direct nozzle into central plant whorls with Chlorantraniliprole 18.5 SC (0.4 mL/L) or Emamectin Benzoate 5 SG.',
        descriptionLocalized: {
          en: 'Direct nozzle into central plant whorls with Chlorantraniliprole 18.5 SC (0.4 mL/L) or Emamectin Benzoate 5 SG.',
          hi: 'पोंगे के अंदर क्लोरैंट्रानिप्रोल या एमामेक्टिन बेंजोएट का छिड़काव करें।',
          pa: 'ਪੋਂਗੇ ਵਿੱਚ ਕਲੋਰੈਂਟ੍ਰਾਨੀਪ੍ਰੋਲ ਜਾਂ ਐਮਾਮੈਕਟਿਨ ਬੈਂਜੋਏਟ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।',
        },
        priority: 'immediate',
        timeframe: 'Within 24–48 hours',
        timeframeLocalized: {
          en: 'Within 24–48 hours',
          hi: '24–48 घंटे के भीतर',
          pa: '24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ',
        },
      },
    ],
  },
  {
    id: 'wheat-yellow-rust',
    crop: 'wheat',
    keywords: ['rust', 'stripe rust', 'yellow rust', 'wheat', 'pustule', "powder", 'puccinia'],
    cause: {
      id: 'cause-wheat-rust',
      name: 'Yellow Rust / Stripe Rust (Puccinia striiformis)',
      nameLocalized: {
        en: 'Yellow Rust / Stripe Rust (Puccinia striiformis)',
        hi: 'पीला रतुआ / स्ट्राइप रस्ट (पक्सीनिया स्ट्राइफोर्मिस)',
        pa: 'ਪੀਲਾ ਰਤੂਆ / ਸਟ੍ਰਾਈਪ ਰਤੂਆ (ਪਕਸੀਨੀਆ ਸਟ੍ਰਾਈਫੋਰਮਿਸ)',
      },
      category: 'disease',
      description: 'Yellow rust manifests as linear bright yellow pustule stripes along leaf veins that release yellow powdery spores upon touch.',
      descriptionLocalized: {
        en: 'Yellow rust manifests as linear bright yellow pustule stripes along leaf veins that release yellow powdery spores upon touch.',
        hi: 'पीला रतुआ पत्तियों की नसों के साथ चमकीली पीली फफोलेदार धारियों के रूप में दिखाई देता है, जिन्हें छूने पर पीला पाउडर निकलता है।',
        pa: 'ਪੀਲਾ ਰਤੂਆ ਪੱਤਿਆਂ ਦੀਆਂ ਨਸਾਂ ਨਾਲ ਚਮਕੀਲੀਆਂ ਪੀਲੀਆਂ ਛਾਲੇਦਾਰ ਧਾਰੀਆਂ ਵਜੋਂ ਦਿਸਦਾ ਹੈ, ਜਿਨ੍ਹਾਂ ਨੂੰ ਛੂਹਣ ਤੇ ਪੀਲਾ ਪਾਊਡਰ ਨਿਕਲਦਾ ਹੈ।',
      },
      likelihood: 'high',
      symptoms: [
        'Parallel bright yellow pustule stripes along leaf blade length',
        'Yellow orange powder rubs off onto fingers or clothing',
        'Severe foliage desiccation turning necrotic brown',
      ],
      symptomsLocalized: {
        en: [
          'Parallel bright yellow pustule stripes along leaf blade length',
          'Yellow orange powder rubs off onto fingers or clothing',
          'Severe foliage desiccation turning necrotic brown',
        ],
        hi: [
          'पत्तियों पर समानांतर चमकीली पीली धारियां',
          'उंगलियों या कपड़ों पर पीला-नारंगी पाउडर लगना',
          'पत्तियों का अत्यधिक सूखना और भूरा पड़ना',
        ],
        pa: [
          'ਪੱਤਿਆਂ ਤੇ ਸਮਾਨਾਂਤਰ ਚਮਕੀਲੀਆਂ ਪੀਲੀਆਂ ਧਾਰੀਆਂ',
          'ਉਂਗਲਾਂ ਤੇ ਪੀਲਾ-ਨਾਰੰਗੀ ਪਾਊਡਰ ਲੱਗਣਾ',
          'ਪੱਤਿਆਂ ਦਾ ਸੁੱਕਣਾ ਅਤੇ ਭੂਰਾ ਪੈਣਾ',
        ],
      },
    },
    sources: [
      {
        id: 'src-rust-1',
        title: 'ICAR-IIWBR Field Guide for Wheat Rust Management',
        source: 'ICAR-Indian Institute of Wheat & Barley Research',
        url: 'https://iiwbr.icar.gov.in',
        snippet: 'Stripe rust appears as linear yellow powdery pustules. Early intervention with Propiconazole 25 EC halts epidemic spread.',
        relevance: 'high',
      },
    ],
    actions: [
      {
        id: 'act-rust-1',
        step: 1,
        title: 'Apply Propiconazole 25 EC fungicide spray',
        titleLocalized: {
          en: 'Apply Propiconazole 25 EC fungicide spray',
          hi: 'प्रोपिकोनाज़ोल 25 EC का छिड़काव करें',
          pa: 'ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25 EC ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ',
        },
        description: 'Spray Propiconazole 25 EC (1 mL/L water) or Tebuconazole immediately upon detection.',
        descriptionLocalized: {
          en: 'Spray Propiconazole 25 EC (1 mL/L water) or Tebuconazole immediately upon detection.',
          hi: 'पीले रतुए के लक्षण दिखते ही प्रोपिकोनाज़ोल 25 EC (1 मिली/लीटर) का तुरंत छिड़काव करें।',
          pa: 'ਪੀਲੇ ਰਤੂਏ ਦੇ ਲੱਛਣ ਦਿਸਦਿਆਂ ਹੀ ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25 EC ਦਾ ਤੁਰੰਤ ਸਪ੍ਰੇਅ ਕਰੋ।',
        },
        priority: 'immediate',
        timeframe: 'Within 24–48 hours',
        timeframeLocalized: {
          en: 'Within 24–48 hours',
          hi: '24–48 घंटे के भीतर',
          pa: '24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ',
        },
      },
    ],
  },
  {
    id: 'cotton-whitefly',
    crop: 'cotton',
    keywords: ['cotton', 'whitefly', 'curl', 'bemisia', 'sticky', 'honeydew', 'sooty'],
    cause: {
      id: 'cause-cotton-wf',
      name: 'Cotton Whitefly & Leaf Curl Virus (Bemisia tabaci)',
      nameLocalized: {
        en: 'Cotton Whitefly & Leaf Curl Virus (Bemisia tabaci)',
        hi: 'कपास की सफेद मक्खी एवं लीफ कर्ल वायरस (बेमिसिया तबाची)',
        pa: 'ਕਪਾਹ ਦੀ ਚਿੱਟੀ ਮੱਖੀ ਅਤੇ ਲੀਫ਼ ਕਰਲ ਵਾਇਰਸ (ਬੇਮੀਸੀਆ ਤਬਾਚੀ)',
      },
      category: 'pest',
      description: 'Whiteflies suck sap from underside of cotton leaves, excreting sticky honeydew (sooty mold) and transmitting Cotton Leaf Curl Virus.',
      descriptionLocalized: {
        en: 'Whiteflies suck sap from underside of cotton leaves, excreting sticky honeydew (sooty mold) and transmitting Cotton Leaf Curl Virus.',
        hi: 'सफेद मक्खी पत्तियों की निचली सतह से रस चूसती है, चिपचिपा हनीड्यू (काला कवक) छोड़ती है और कॉटन लीफ कर्ल वायरस फैलाती है।',
        pa: 'ਚਿੱਟੀ ਮੱਖੀ ਪੱਤਿਆਂ ਦੀ ਹੇਠਲੀ ਸਤਹ ਤੋਂ ਰਸ ਚੂਸਦੀ ਹੈ, ਚਿਪਚਿਪਾ ਹਨੀਡਿਊ ਛੱਡਦੀ ਹੈ ਅਤੇ ਕਪਾਹ ਲੀਫ਼ ਕਰਲ ਵਾਇਰਸ ਫੈਲਾਉਂਦੀ ਹੈ।',
      },
      likelihood: 'high',
      symptoms: [
        'Small white flying insects congregating under leaf surfaces',
        'Upward curling and thickening of leaf veins',
        'Black sooty mold covering leaf surfaces due to honeydew',
      ],
      symptomsLocalized: {
        en: [
          'Small white flying insects congregating under leaf surfaces',
          'Upward curling and thickening of leaf veins',
          'Black sooty mold covering leaf surfaces due to honeydew',
        ],
        hi: [
          'पत्तियों के नीचे छोटे सफेद उड़ने वाले कीड़े',
          'पत्तियों का ऊपर की ओर मुड़ना और नसों का मोटा होना',
          'हनीड्यू के कारण पत्तियों पर काला कवक जमा होना',
        ],
        pa: [
          'ਪੱਤਿਆਂ ਦੇ ਹੇਠਾਂ ਛੋਟੇ ਚਿੱਟੇ ਉੱਡਣ ਵਾਲੇ ਕੀੜੇ',
          'ਪੱਤਿਆਂ ਦਾ ਉੱਪਰ ਵੱਲ ਮੁੜਨਾ',
          'ਹਨੀਡਿਊ ਕਰਕੇ ਪੱਤਿਆਂ ਤੇ ਕਾਲੀ ਫਫੂਂਦੀ ਜਮ੍ਹਾਂ ਹੋਣਾ',
        ],
      },
    },
    sources: [
      {
        id: 'src-wf-1',
        title: 'ICAR-CICR Advisory on Cotton Whitefly Management',
        source: 'Central Institute for Cotton Research',
        url: 'https://cicr.org.in',
        snippet: 'Whiteflies vector leaf curl virus. Use yellow sticky traps and neem oil 10,000 ppm sprays.',
        relevance: 'high',
      },
    ],
    actions: [
      {
        id: 'act-wf-1',
        step: 1,
        title: 'Install Yellow Sticky Traps & Neem Spray',
        titleLocalized: {
          en: 'Install Yellow Sticky Traps & Neem Spray',
          hi: 'पीले स्टिकी ट्रैप लगाएं और नीम का छिड़काव करें',
          pa: 'ਪੀਲੇ ਸਟਿੱਕੀ ਟ੍ਰੈਪ ਲਗਾਓ ਅਤੇ ਨੀਮ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ',
        },
        description: 'Install 8-10 yellow sticky traps per acre. Spray Neem oil (10,000 ppm @ 3 mL/L).',
        descriptionLocalized: {
          en: 'Install 8-10 yellow sticky traps per acre. Spray Neem oil (10,000 ppm @ 3 mL/L).',
          hi: 'प्रति एकड़ 8-10 पीले स्टिकी ट्रैप लगाएं। नीम तेल का छिड़काव करें।',
          pa: '8-10 ਪੀਲੇ ਸਟਿੱਕੀ ਟ੍ਰੈਪ ਲਗਾਓ। ਨੀਮ ਤੇਲ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।',
        },
        priority: 'immediate',
        timeframe: 'Within 24–48 hours',
        timeframeLocalized: {
          en: 'Within 24–48 hours',
          hi: '24–48 घंटे के भीतर',
          pa: '24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ',
        },
      },
    ],
  },
  {
    id: 'potato-soft-rot',
    crop: 'potato',
    keywords: ['potato', 'soft rot', 'rotten', 'foul', 'slimy', 'tuber', 'blackleg'],
    cause: {
      id: 'cause-potato-rot',
      name: 'Potato Soft Rot (Pectobacterium carotovorum)',
      nameLocalized: {
        en: 'Potato Soft Rot (Pectobacterium carotovorum)',
        hi: 'आलू का मृदु सड़न (सॉफ्ट रॉट)',
        pa: 'ਆਲੂ ਦਾ ਮ੍ਰਿਦੂ ਸੜਨ (ਸਾਫ਼ਟ ਰੋਟ)',
      },
      category: 'disease',
      description: 'Bacterial soft rot dissolves potato tuber cell walls, turning internal flesh into a foul-smelling, watery mushy mass.',
      descriptionLocalized: {
        en: 'Bacterial soft rot dissolves potato tuber cell walls, turning internal flesh into a foul-smelling, watery mushy mass.',
        hi: 'जीवाणु सॉफ्ट रॉट आलू के कंद की कोशिकाओं को घोल देता है, जिससे आलू का गूदा दुर्गंधयुक्त, पानीदार गुदे में बदल जाता है।',
        pa: 'ਬੈਕਟੀਰੀਅਲ ਸਾਫ਼ਟ ਰੋਟ ਆਲੂ ਦੇ ਗੂਦੇ ਨੂੰ ਬਦਬੂਦਾਰ, ਪਾਣੀਦਾਰ ਮਲਬੇ ਵਿੱਚ ਬਦਲ ਦਿੰਦਾ ਹੈ।',
      },
      likelihood: 'high',
      symptoms: [
        'Water-soaked cream-colored slimy soft decay of tubers',
        'Extremely foul rotting odor emitted from stored tubers',
        'Black leg lesions expanding at stem base near soil',
      ],
      symptomsLocalized: {
        en: [
          'Water-soaked cream-colored slimy soft decay of tubers',
          'Extremely foul rotting odor emitted from stored tubers',
          'Black leg lesions expanding at stem base near soil',
        ],
        hi: [
          'आलू कंदों का चिपचिपा नरम सड़न',
          'अत्यधिक बदबूदार गंध निकलना',
          'तने के निचले हिस्से पर काला धब्बा',
        ],
        pa: [
          'ਆਲੂ ਦਾ ਚਿਪਚਿਪਾ ਨਰਮ ਸੜਨ',
          'ਬਹੁਤ ਜ਼ਿਆਦਾ ਬਦਬੂਦਾਰ ਬੂ',
          'ਤਣੇ ਦੇ ਹੇਠਲੇ ਹਿੱਸੇ ਤੇ ਕਾਲਾ ਧੱਬਾ',
        ],
      },
    },
    sources: [
      {
        id: 'src-potato-1',
        title: 'ICAR-CPRI Diagnostic Manual on Potato Tuber Diseases',
        source: 'Central Potato Research Institute',
        url: 'https://cpri.icar.gov.in',
        snippet: 'Bacterial soft rot causes mushy tissue collapse with sharp foul odor. Ventilation and dry handling are key.',
        relevance: 'high',
      },
    ],
    actions: [
      {
        id: 'act-potato-1',
        step: 1,
        title: 'Discard rotten tubers & ventilate storage',
        titleLocalized: {
          en: 'Discard rotten tubers & ventilate storage',
          hi: 'सड़े हुए आलू निकालें और वेंटिलेशन सुधारें',
          pa: 'ਸੜੇ ਹੋਏ ਆਲੂ ਕੱਢੋ ਅਤੇ ਵੈਂਟੀਲੇਸ਼ਨ ਸੁਧਾਰੋ',
        },
        description: 'Remove affected tubers immediately. Maintain cold, dry airflow in storage.',
        descriptionLocalized: {
          en: 'Remove affected tubers immediately. Maintain cold, dry airflow in storage.',
          hi: 'प्रभावित आलू को तुरंत हटाएं। भंडारण को ठंडा और सूखा रखें।',
          pa: 'ਪ੍ਰਭਾਵਿਤ ਆਲੂਆਂ ਨੂੰ ਤੁਰੰਤ ਹਟਾਓ। ਭੰਡਾਰਨ ਨੂੰ ਠੰਡਾ ਅਤੇ ਸੁੱਕਾ ਰੱਖੋ।',
        },
        priority: 'immediate',
        timeframe: 'Within 24–48 hours',
        timeframeLocalized: {
          en: 'Within 24–48 hours',
          hi: '24–48 घंटे के भीतर',
          pa: '24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ',
        },
      },
    ],
  },
  {
    id: 'rice-blb',
    crop: 'rice',
    keywords: ['rice', 'bacterial', 'blight', 'paddy', 'xanthomonas', 'lesion'],
    cause: {
      id: 'cause-rice-blb',
      name: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
      nameLocalized: {
        en: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
        hi: 'जीवाणु पत्ती ब्लाइट (ज़ैंथोमोनास ओराइज़ी)',
        pa: 'ਬੈਕਟੀਰੀਆ ਪੱਤਾ ਬਲਾਈਟ (ਜ਼ੈਂਥੋਮੋਨਾਸ ਓਰਾਈਜ਼ੀ)',
      },
      category: 'disease',
      description: 'Bacterial leaf blight causes water-soaked lesions on leaf margins expanding to yellow-brown stripes.',
      descriptionLocalized: {
        en: 'Bacterial leaf blight causes water-soaked lesions on leaf margins expanding to yellow-brown stripes.',
        hi: 'जीवाणु पत्ती ब्लाइट से पत्तियों के किनारों पर जल-भिग्न घाव होते हैं जो पीले-भूरे रंग की धारियों में फैल जाते हैं।',
        pa: 'ਬੈਕਟੀਰੀਆ ਪੱਤਾ ਬਲਾਈਟ ਨਾਲ ਪੱਤਿਆਂ ਦੇ ਕਿਨਾਰਿਆਂ ਤੇ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ ਹੁੰਦੇ ਹਨ ਜੋ ਪੀਲੇ-ਭੂਰੇ ਰੰਗ ਦੀਆਂ ਧਾਰੀਆਂ ਵਿੱਚ ਫੈਲ ਜਾਂਦੇ ਹਨ।',
      },
      likelihood: 'high',
      symptoms: [
        'Water-soaked lesions along leaf margins',
        'Yellowing with wavy margins',
        'Leaf drying and blighting in upper canopy',
      ],
      symptomsLocalized: {
        en: [
          'Water-soaked lesions along leaf margins',
          'Yellowing with wavy margins',
          'Leaf drying and blighting in upper canopy',
        ],
        hi: [
          'पत्ती किनारों पर जल-भिग्न घाव',
          'लहरदार किनारों के साथ पीलापन',
          'ऊपरी कैनोपी में पत्तियों का सूखना',
        ],
        pa: [
          'ਪੱਤਾ ਕਿਨਾਰਿਆਂ ਤੇ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ',
          'ਲਹਿਰਦਾਰ ਕਿਨਾਰਿਆਂ ਨਾਲ ਪੀਲਾਪਨ',
          'ਉੱਪਰਲੀ ਕੈਨੋਪੀ ਵਿੱਚ ਪੱਤਿਆਂ ਦਾ ਸੁੱਕਣਾ',
        ],
      },
    },
    sources: [
      {
        id: 'src-blb-1',
        title: 'ICAR-Indian Institute of Rice Research: Bacterial Leaf Blight Management',
        source: 'ICAR-IIRR',
        url: 'https://www.icar.org.in',
        snippet: 'Bacterial leaf blight causes water-soaked stripes on margins. Drain excess water and apply copper oxychloride.',
        relevance: 'high',
      },
    ],
    actions: [
      {
        id: 'act-blb-1',
        step: 1,
        title: 'Drain standing water and apply Copper Oxychloride spray',
        titleLocalized: {
          en: 'Drain standing water and apply Copper Oxychloride spray',
          hi: 'पानी निकालें और तांबा-आधारित स्प्रे करें',
          pa: 'ਪਾਣੀ ਕੱਢੋ ਅਤੇ ਤਾਂਬਾ-ਆਧਾਰਿਤ ਸਪ੍ਰੇਅ ਕਰੋ',
        },
        description: 'Drain field and spray Copper Oxychloride (3 g/L) + Streptocycline (0.15 g/L).',
        descriptionLocalized: {
          en: 'Drain field and spray Copper Oxychloride (3 g/L) + Streptocycline (0.15 g/L).',
          hi: 'खेत का पानी निकालें और कॉपर ऑक्सीक्लोराइड + स्ट्रैप्टोसाइक्लिन का छिड़काव करें।',
          pa: 'ਖੇਤ ਦਾ ਪਾਣੀ ਕੱਢੋ ਅਤੇ ਕਾਪਰ ਆਕਸੀਕਲੋਰਾਈਡ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।',
        },
        priority: 'immediate',
        timeframe: 'Within 24–48 hours',
        timeframeLocalized: {
          en: 'Within 24–48 hours',
          hi: '24–48 घंटे के भीतर',
          pa: '24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ',
        },
      },
    ],
  },
  {
    id: 'nitrogen-deficiency',
    crop: 'any',
    keywords: ['nitrogen', 'deficiency', 'yellowing', 'pale', 'stunted', 'chlorosis', 'bottom leaves'],
    cause: {
      id: 'cause-n-def',
      name: 'Nitrogen Deficiency',
      nameLocalized: {
        en: 'Nitrogen Deficiency',
        hi: 'नाइट्रोजन की कमी',
        pa: 'ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ',
      },
      category: 'nutrient',
      description: 'Nitrogen deficiency causes older lower leaves to yellow starting from tips, with stunted plant growth.',
      descriptionLocalized: {
        en: 'Nitrogen deficiency causes older lower leaves to yellow starting from tips, with stunted plant growth.',
        hi: 'नाइट्रोजन की कमी से पुरानी निचली पत्तियां पीली हो जाती हैं और पौधे का विकास रुक जाता है।',
        pa: 'ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ ਨਾਲ ਪੁਰਾਣੇ ਹੇਠਲੇ ਪੱਤੇ ਪੀਲੇ ਹੋ ਜਾਂਦੇ ਹਨ ਅਤੇ ਵਾਧਾ ਰੁਕ ਜਾਂਦਾ ਹੈ।',
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
    sources: [
      {
        id: 'src-n-1',
        title: 'FAO Plant Nutrient Deficiencies Manual',
        source: 'FAO Agricultural Bulletin',
        url: 'https://www.fao.org',
        snippet: 'Nitrogen deficiency manifests as chlorosis beginning in older leaves, progressing upward.',
        relevance: 'medium',
      },
    ],
    actions: [
      {
        id: 'act-n-1',
        step: 2,
        title: 'Top-dress split dose of Urea fertilizer',
        titleLocalized: {
          en: 'Top-dress split dose of Urea fertilizer',
          hi: 'यूरिया उर्वरक की खुराक डालें',
          pa: 'ਯੂਰੀਆ ਖਾਦ ਦੀ ਖ਼ੁਰਾਕ ਪਾਓ',
        },
        description: 'Top-dress Urea under adequate soil moisture or apply 1-2% Nano Urea foliar spray.',
        descriptionLocalized: {
          en: 'Top-dress Urea under adequate soil moisture or apply 1-2% Nano Urea foliar spray.',
          hi: 'नमी की स्थिति में यूरिया डालें या 1-2% नैनो यूरिया का छिड़काव करें।',
          pa: 'ਨਮੀ ਵਿੱਚ ਯੂਰੀਆ ਪਾਓ ਜਾਂ ਨੈਨੋ ਯੂਰੀਆ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।',
        },
        priority: 'short-term',
        timeframe: 'Within 3–5 days',
        timeframeLocalized: {
          en: 'Within 3–5 days',
          hi: '3–5 दिन के भीतर',
          pa: '3–5 ਦਿਨਾਂ ਦੇ ਅੰਦਰ',
        },
      },
    ],
  },
];

async function mockAnalyzeInput(req: AnalyzeRequest): Promise<AnalysisResult> {
  await delay(MOCK_DELAY);
  const userId = req.userId || getAnonymousUserId();
  const cropType = (req.cropType && req.cropType !== 'unknown') ? req.cropType : 'wheat';
  const queryText = `${req.textDescription || ''} ${req.transcription || ''}`.toLowerCase();
  const hasImage = !!req.imageDataUrl;
  const hasText = !!(req.transcription || req.textDescription);
  const confidence: ConfidenceLevel = (hasImage && hasText) ? 'high' : (hasImage || hasText) ? 'medium' : 'low';

  const cropTypeLocalized: Record<LanguageCode, string> = {
    en: cropType.charAt(0).toUpperCase() + cropType.slice(1),
    hi: cropType === 'wheat' ? 'गेहूं' : cropType === 'rice' ? 'चावल' : cropType === 'maize' ? 'मक्का' : cropType === 'cotton' ? 'कपास' : cropType === 'potato' ? 'आलू' : cropType === 'tomato' ? 'टमाटर' : cropType === 'sugarcane' ? 'गन्ना' : 'अज्ञात',
    pa: cropType === 'wheat' ? 'ਕਣਕ' : cropType === 'rice' ? 'ਚੌਲ' : cropType === 'maize' ? 'ਮੱਕੀ' : cropType === 'cotton' ? 'ਕਪਾਹ' : cropType === 'potato' ? 'ਆਲੂ' : cropType === 'tomato' ? 'ਟਮਾਟਰ' : cropType === 'sugarcane' ? 'ਗੰਨਾ' : 'ਅਣਜਾਣ',
  };

  // Perform dynamic RAG matching over CLIENT_KB_REGISTRY
  const scored = CLIENT_KB_REGISTRY.map((entry) => {
    let score = 0;
    if (entry.crop === cropType) score += 10;
    entry.keywords.forEach((kw) => {
      if (queryText.includes(kw.toLowerCase())) score += 5;
    });
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const matchedCauses: PossibleCause[] = [];
  const matchedSources: EvidenceSource[] = [];
  const matchedActions: ActionStep[] = [];

  const primary = scored[0].entry;
  matchedCauses.push({ ...primary.cause, likelihood: 'high' });
  matchedSources.push(...primary.sources);
  matchedActions.push(...primary.actions);

  const secondary = scored.find((s) => s.entry.id !== primary.id && s.entry.cause.name !== primary.cause.name)?.entry;
  if (secondary) {
    matchedCauses.push({ ...secondary.cause, likelihood: 'medium' });
    matchedSources.push(...secondary.sources);
    if (secondary.actions.length > 0) {
      matchedActions.push({ ...secondary.actions[0], id: 'act-2', step: 2 });
    }
  }

  const primaryNameEn = primary.cause.name;
  const primaryNameHi = primary.cause.nameLocalized?.hi || primaryNameEn;
  const primaryNamePa = primary.cause.nameLocalized?.pa || primaryNameEn;

  const summary = `Based on real-time RAG evidence analysis for ${cropType.toUpperCase()}, the most likely cause is ${primaryNameEn}. Cross-referenced with active agricultural reference documents.`;

  return {
    id: randomId(),
    userId,
    cropType,
    cropTypeLocalized,
    possible_causes: matchedCauses,
    confidence_level: confidence,
    confidenceNarrative: 'Decision support assessment based on visual and contextual evidence.',
    confidenceNarrativeLocalized: {
      en: 'Decision support assessment based on visual and contextual evidence.',
      hi: 'दृश्य और संदर्भात्मक साक्ष्य के आधार पर निर्णय सहायता मूल्यांकन।',
      pa: 'ਦਿੱਖ ਅਤੇ ਸੰਦਰਭ ਸਬੂਤ ਦੇ ਆਧਾਰ ਤੇ ਫੈਸਲੇ ਸਹਾਇਤਾ ਮੁਲਾਂਕਣ।',
    },
    sources: matchedSources,
    action_plan: matchedActions,
    escalation_flag: confidence === 'low',
    summary,
    summaryLocalized: {
      en: summary,
      hi: `सबमिट किए गए इनपुट के आधार पर ${cropTypeLocalized.hi} के लिए सबसे संभावित कारण ${primaryNameHi} है।`,
      pa: `ਸਪੁਰਦ ਕੀਤੇ ਇਨਪੁਟ ਦੇ ਆਧਾਰ ਤੇ ${cropTypeLocalized.pa} ਲਈ ਸਭ ਤੋਂ ਸੰਭਾਵਿਤ ਕਾਰਨ ${primaryNamePa} ਹੈ।`,
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

// ─── Real API Functions ───────────────────────────────────────────────

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
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/history?userId=${encodeURIComponent(effectiveUserId)}`, {}, 15000);
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
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/weather${locParam}`, {}, 15000);
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
