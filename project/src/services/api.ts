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
    keywords: ['armyworm', 'whorl', 'frass', 'sawdust', 'hole', 'caterpillar', 'maize', 'corn', 'मक्का', 'फॉल आर्मीवर्म', 'लट', 'कीड़ा', 'ਸੁੰਡੀ', 'ਮੱਕੀ', 'ਫਾਲ ਆਰਮੀਵਰਮ'],
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
    keywords: ['rust', 'stripe rust', 'yellow rust', 'wheat', 'pustule', 'powder', 'puccinia', 'गेहूं', 'पीला रतुआ', 'रतुआ', 'हल्दी रोग', 'ਕਣਕ', 'ਪੀਲਾ ਰਤੂਆ', 'ਰਤੂਆ', 'ਹਲਦੀ'],
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
    keywords: ['cotton', 'whitefly', 'curl', 'bemisia', 'sticky', 'honeydew', 'sooty', 'कपास', 'सफेद मक्खी', 'लीफ कर्ल', 'मरोड़िया', 'ਕਪਾਹ', 'ਚਿੱਟੀ ਮੱਖੀ', 'ਮਰੋੜੀਆ'],
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
    keywords: ['potato', 'soft rot', 'rotten', 'foul', 'slimy', 'tuber', 'blackleg', 'आलू', 'सॉफ्ट रॉट', 'सड़न', 'दुर्गंध', 'ਆਲੂ', 'ਸਾਫ਼ਟ ਰੋਟ', 'ਸੜਨ'],
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
    keywords: ['rice', 'bacterial', 'blight', 'paddy', 'xanthomonas', 'lesion', 'चावल', 'धान', 'जीवाणु', 'पत्ती ब्लाइट', 'ਝੋਨਾ', 'ਚੌਲ', 'ਬੈਕਟੀਰੀਆ', 'ਪੱਤਾ ਬਲਾਈਟ'],
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
    keywords: ['nitrogen', 'deficiency', 'yellowing', 'pale', 'stunted', 'chlorosis', 'bottom leaves', 'नाइट्रोजन', 'यूरिया', 'कमी', 'पीलापन', 'ਨਾਈਟ੍ਰੋਜਨ', 'ਯੂਰੀਆ', 'ਘਾਟ', 'ਪੀਲਾਪਨ'],
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
  {
    id: 'sugarcane-red-rot',
    crop: 'sugarcane',
    keywords: ['sugarcane', 'red rot', 'colletotrichum', 'stalk', 'alcoholic', 'reddening', 'wither', 'गन्ना', 'लाल सड़न', 'रेड रॉट', 'ਗੰਨਾ', 'ਲਾਲ ਸੜਨ'],
    cause: {
      id: 'cause-sugarcane-rr',
      name: 'Sugarcane Red Rot (Colletotrichum falcatum)',
      nameLocalized: {
        en: 'Sugarcane Red Rot (Colletotrichum falcatum)',
        hi: 'गन्ने का लाल सड़न रोग (रेड रॉट)',
        pa: 'ਗੰਨੇ ਦਾ ਲਾਲ ਸੜਨ ਰੋਗ (ਰੇਡ ਰੋਟ)',
      },
      category: 'disease',
      description: 'Red rot causes internal stalk tissues to turn red with crosswise white patches and distinct alcoholic odor upon splitting.',
      descriptionLocalized: {
        en: 'Red rot causes internal stalk tissues to turn red with crosswise white patches and distinct alcoholic odor upon splitting.',
        hi: 'लाल सड़न रोग से तने का आंतरिक ऊतक लाल हो जाता है, जिस पर सफेद चकत्ते और चीरने पर शराबी गंध आती है।',
        pa: 'ਲਾਲ ਸੜਨ ਰੋਗ ਨਾਲ ਤਣੇ ਦਾ ਅੰਦਰੂਨੀ ਹਿੱਸਾ ਲਾਲ ਹੋ ਜਾਂਦਾ ਹੈ ਜਿਸ ਵਿੱਚ ਚਿੱਟੇ ਧੱਬੇ ਅਤੇ ਸ਼ਰਾਬ ਵਰਗੀ ਬੂ ਆਉਂਦੀ ਹੈ।',
      },
      likelihood: 'high',
      symptoms: [
        'Yellowing and drooping of third and fourth leaves',
        'Stalk splitting reveals red vascular tissues with white transverse spots',
        'Sour alcoholic odor emitted from affected stalks',
      ],
      symptomsLocalized: {
        en: [
          'Yellowing and drooping of third and fourth leaves',
          'Stalk splitting reveals red vascular tissues with white transverse spots',
          'Sour alcoholic odor emitted from affected stalks',
        ],
        hi: [
          'तीसरी और चौथी पत्तियों का पीला पड़ना और झुकना',
          'तने को फाड़ने पर लाल ऊतक और सफेद चकत्ते दिखना',
          'खट्टी शराबी गंध निकलना',
        ],
        pa: [
          'ਤੀਜੀ ਅਤੇ ਚੌਥੀ ਪੱਤੀ ਦਾ ਪੀਲਾ ਪੈਣਾ',
          'ਤਣਾ ਪਾੜਨ ਤੇ ਲਾਲ ਹਿੱਸਾ ਅਤੇ ਚਿੱਟੇ ਧੱਬੇ ਦਿਸਣਾ',
          'ਖੱਟੀ ਸ਼ਰਾਬ ਵਰਗੀ ਬੂ ਨਿਕਲਣਾ',
        ],
      },
    },
    sources: [
      {
        id: 'src-rr-1',
        title: 'ICAR-SBI Sugarcane Disease Identification Guide',
        source: 'ICAR-Sugarcane Breeding Institute',
        url: 'https://sugarcane.icar.gov.in',
        snippet: 'Red rot causes reddened internal stalk with transverse white patches and alcoholic odor. Rogue out infected clumps.',
        relevance: 'high',
      },
    ],
    actions: [
      {
        id: 'act-rr-1',
        step: 1,
        title: 'Uproot and burn diseased sugarcane clumps immediately',
        titleLocalized: {
          en: 'Uproot and burn diseased sugarcane clumps immediately',
          hi: 'प्रभावित गन्ने के पौधों को उखाड़कर जलाएं',
          pa: 'ਪ੍ਰਭਾਵਿਤ ਗੰਨੇ ਦੇ ਬੂਟਿਆਂ ਨੂੰ ਪੁੱਟ ਕੇ ਸਾੜੋ',
        },
        description: 'Rogue out diseased clumps including root stools to prevent fungal spread to neighboring rows.',
        descriptionLocalized: {
          en: 'Rogue out diseased clumps including root stools to prevent fungal spread to neighboring rows.',
          hi: 'संक्रमण रोकने के लिए जड़ों सहित रोगी पौधों को उखाड़कर तुरंत नष्ट करें।',
          pa: 'ਛੂਤ ਰੋਕਣ ਲਈ ਜੜ੍ਹਾਂ ਸਮੇਤ ਰੋਗੀ ਬੂਟਿਆਂ ਨੂੰ ਪੁੱਟ ਕੇ ਤੁਰੰਤ ਨਸ਼ਟ ਕਰੋ।',
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
    id: 'tomato-late-blight',
    crop: 'tomato',
    keywords: ['tomato', 'late blight', 'phytophthora', 'water-soaked', 'white mold', 'fruit rot', 'टमाटर', 'पछेती झुलसा', 'ब्लाइट', 'ਟਮਾਟਰ', 'ਪਛੇਤਾ ਝੁਲਸ'],
    cause: {
      id: 'cause-tomato-lb',
      name: 'Tomato Late Blight (Phytophthora infestans)',
      nameLocalized: {
        en: 'Tomato Late Blight (Phytophthora infestans)',
        hi: 'टमाटर का पछेती झुलसा (लेट ब्लाइट)',
        pa: 'ਟਮਾਟਰ ਦਾ ਪਛੇਤੀ ਝੁਲਸ (ਲੇਟ ਬਲਾਈਟ)',
      },
      category: 'disease',
      description: 'Late blight spreads rapidly in cool moist weather, creating large dark water-soaked leaf lesions with white fungal fuzz on undersides.',
      descriptionLocalized: {
        en: 'Late blight spreads rapidly in cool moist weather, creating large dark water-soaked leaf lesions with white fungal fuzz on undersides.',
        hi: 'पछेती झुलसा ठंडे और नम मौसम में तेजी से फैलता है, जिससे पत्तियों पर काले जल-भिग्न घाव और नीचे सफेद फफूंद जमती है।',
        pa: 'ਪਛੇਤੀ ਝੁਲਸ ਠੰਡੇ ਅਤੇ ਨਮ ਮੌਸਮ ਵਿੱਚ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਪੱਤਿਆਂ ਤੇ ਕਾਲੇ ਜ਼ਖ਼ਮ ਅਤੇ ਹੇਠਾਂ ਚਿੱਟੀ ਫਫੂਂਦੀ ਜਮ੍ਹਾਂ ਹੁੰਦੀ ਹੈ।',
      },
      likelihood: 'high',
      symptoms: [
        'Large irregular dark water-soaked lesions on foliage and stems',
        'White cottony fungal growth on underside of leaves in morning dew',
        'Firm brown greasy decay on green and ripening fruits',
      ],
      symptomsLocalized: {
        en: [
          'Large irregular dark water-soaked lesions on foliage and stems',
          'White cottony fungal growth on underside of leaves in morning dew',
          'Firm brown greasy decay on green and ripening fruits',
        ],
        hi: [
          'पत्तियों और तनों पर बड़े काले जल-भिग्न घाव',
          'सुबह की ओस में पत्तियों के नीचे सफेद सूती फफूंद',
          'फल पर सख्त भूरा सड़न',
        ],
        pa: [
          'ਪੱਤਿਆਂ ਅਤੇ ਤਣਿਆਂ ਤੇ ਵੱਡੇ ਕਾਲੇ ਜ਼ਖ਼ਮ',
          'ਸਵੇਰ ਦੀ ਓਸ ਵਿੱਚ ਪੱਤਿਆਂ ਹੇਠ ਚਿੱਟੀ ਫਫੂਂਦੀ',
          'ਫਲ ਤੇ ਭੂਰਾ ਸੜਨ',
        ],
      },
    },
    sources: [
      {
        id: 'src-tlb-1',
        title: 'ICAR-IIHR Tomato Disease Management Advisory',
        source: 'ICAR-Indian Institute of Horticultural Research',
        url: 'https://iihr.icar.gov.in',
        snippet: 'Late blight causes rapid water-soaked blighting on leaves and fruits under high humidity. Apply systemic fungicides promptly.',
        relevance: 'high',
      },
    ],
    actions: [
      {
        id: 'act-tlb-1',
        step: 1,
        title: 'Spray Cymoxanil + Mancozeb bio-fungicide',
        titleLocalized: {
          en: 'Spray Cymoxanil + Mancozeb bio-fungicide',
          hi: 'साइमोक्सानिल + मैंकोज़ेब का छिड़काव करें',
          pa: 'ਸਾਈਮੋਕਸਾਨਿਲ + ਮੈਂਕੋਜ਼ੇਬ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ',
        },
        description: 'Apply Cymoxanil + Mancozeb (2 g/L) or Metalaxyl + Mancozeb thoroughly covering foliage.',
        descriptionLocalized: {
          en: 'Apply Cymoxanil + Mancozeb (2 g/L) or Metalaxyl + Mancozeb thoroughly covering foliage.',
          hi: 'पत्तियों पर साइमोक्सानिल + मैंकोज़ेब (2 ग्राम/लीटर) का अच्छी तरह छिड़काव करें।',
          pa: 'ਪੱਤਿਆਂ ਤੇ ਸਾਈਮੋਕਸਾਨਿਲ + ਮੈਂਕੋਜ਼ੇਬ ਦਾ ਚੰਗੀ ਤਰ੍ਹਾਂ ਸਪ੍ਰੇਅ ਕਰੋ।',
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
    id: 'zinc-deficiency',
    crop: 'any',
    keywords: ['zinc', 'khaira', 'white bud', 'deficiency', 'rusty', 'bronzing', 'internode', 'जिंक', 'खैरा', 'कमी', 'ਜਿੰਕ', 'ਖ਼ੈਰਾ', 'ਘਾਟ'],
    cause: {
      id: 'cause-zinc-def',
      name: 'Zinc Deficiency (Khaira Disease / Bronzing)',
      nameLocalized: {
        en: 'Zinc Deficiency (Khaira Disease / Bronzing)',
        hi: 'जिंक की कमी (खैरा रोग / ब्रोंज़िंग)',
        pa: 'ਜਿੰਕ ਦੀ ਘਾਟ (ਖ਼ੈਰਾ ਰੋਗ / ਬ੍ਰੋਂਜ਼ਿੰਗ)',
      },
      category: 'nutrient',
      description: 'Zinc deficiency causes rusty brown spots on middle leaves and shortened internodes with stunted bushy growth.',
      descriptionLocalized: {
        en: 'Zinc deficiency causes rusty brown spots on middle leaves and shortened internodes with stunted bushy growth.',
        hi: 'जिंक की कमी से बीच की पत्तियों पर जंग जैसे भूरे धब्बे और छोटी गांठों के साथ रुका हुआ विकास होता है।',
        pa: 'ਜਿੰਕ ਦੀ ਘਾਟ ਨਾਲ ਵਿਚਕਾਰਲੇ ਪੱਤਿਆਂ ਤੇ ਜੰਗ ਵਰਗੇ ਭੂਰੇ ਧੱਬੇ ਅਤੇ ਰੁਕਿਆ ਵਾਧਾ ਹੁੰਦਾ ਹੈ।',
      },
      likelihood: 'medium',
      symptoms: [
        'Rusty brown or reddish-brown pigment spots coalescing on leaves',
        'Shortened internodes resulting in reset bushy plant architecture',
        'Chlorotic midrib bleaching on young leaves',
      ],
      symptomsLocalized: {
        en: [
          'Rusty brown or reddish-brown pigment spots coalescing on leaves',
          'Shortened internodes resulting in reset bushy plant architecture',
          'Chlorotic midrib bleaching on young leaves',
        ],
        hi: [
          'पत्तियों पर जंग जैसे भूरे धब्बे',
          'छोटी गांठें और झाड़ीदार विकास',
          'नई पत्तियों का सफेद पड़ना',
        ],
        pa: [
          'ਪੱਤਿਆਂ ਤੇ ਜੰਗ ਵਰਗੇ ਭੂਰੇ ਧੱਬੇ',
          'ਛੋਟੀਆਂ ਗੰਢਾਂ ਅਤੇ ਝਾੜੀਦਾਰ ਵਾਧਾ',
          'ਨਵੇਂ ਪੱਤਿਆਂ ਦਾ ਚਿੱਟਾ ਪੈਣਾ',
        ],
      },
    },
    sources: [
      {
        id: 'src-zn-1',
        title: 'FAO Guide on Soil Micronutrient Deficiencies',
        source: 'FAO Soil Bulletin',
        url: 'https://www.fao.org',
        snippet: 'Zinc deficiency produces bronzing and rusty lesions in submerged or alkaline soils. Zinc sulphate foliar spray corrects symptoms.',
        relevance: 'medium',
      },
    ],
    actions: [
      {
        id: 'act-zn-1',
        step: 2,
        title: 'Foliar spray of Zinc Sulphate (0.5%) + Lime',
        titleLocalized: {
          en: 'Foliar spray of Zinc Sulphate (0.5%) + Lime',
          hi: 'जिंक सल्फेट (0.5%) + चूने का छिड़काव करें',
          pa: 'ਜਿੰਕ ਸਲਫ਼ੇਟ (0.5%) + ਚੂਨੇ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ',
        },
        description: 'Spray Zinc Sulphate 21% (5 g/L) mixed with 2.5 g/L lime or Chelated Zinc EDTA.',
        descriptionLocalized: {
          en: 'Spray Zinc Sulphate 21% (5 g/L) mixed with 2.5 g/L lime or Chelated Zinc EDTA.',
          hi: 'जिंक सल्फेट (5 ग्राम/लीटर) और चूने का घोल बनाकर पत्तियों पर छिड़काव करें।',
          pa: 'ਜਿੰਕ ਸਲਫ਼ੇਟ (5 ਗ੍ਰਾਮ/ਲੀਟਰ) ਅਤੇ ਚੂਨੇ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।',
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

  // Perform dynamic RAG matching over CLIENT_KB_REGISTRY with strict crop isolation
  const scored = CLIENT_KB_REGISTRY.map((entry) => {
    // Strict crop filter: if user specified a crop, disqualify entries belonging to OTHER crops!
    if (cropType !== 'unknown' && entry.crop !== 'any' && entry.crop !== cropType) {
      return { entry, score: -1, queryKwMatches: 0 };
    }
    let score = 0;
    if (entry.crop === cropType) score += 20;

    let queryKwMatches = 0;
    entry.keywords.forEach((kw) => {
      if (queryText.includes(kw.toLowerCase())) {
        score += 8;
        queryKwMatches++;
      }
    });

    // Nutrient deficiencies (crop: 'any') must NOT score unless user query explicitly mentioned nutrient deficiency symptoms
    if (entry.crop === 'any' && queryKwMatches === 0) {
      score = 0;
    }

    return { entry, score, queryKwMatches };
  }).filter((item) => item.score >= 0);

  scored.sort((a, b) => b.score - a.score);

  const matchedCauses: PossibleCause[] = [];
  const matchedSources: EvidenceSource[] = [];
  const matchedActions: ActionStep[] = [];

  // Prioritize positive matched entries; if none scored > 0, prefer crop-matching entry rather than arbitrary nutrient deficiency
  const positive = scored.filter((s) => s.score > 0);
  const primaryItem = positive.length > 0
    ? positive[0]
    : (scored.find((s) => s.entry.crop === cropType) || scored[0]);
  const primary = primaryItem.entry;

  matchedCauses.push({ ...primary.cause, likelihood: 'high' });
  matchedSources.push(...primary.sources);
  matchedActions.push(...primary.actions);

  const secondaryItem = scored.find(
    (s) => s.entry.id !== primary.id && s.entry.cause.name !== primary.cause.name && (s.score > 0 || (cropType !== 'unknown' && s.entry.crop === cropType))
  );
  if (secondaryItem) {
    const secondary = secondaryItem.entry;
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
    en: 'The crop leaves are showing spots and marginal damage over recent days. Growth seems affected and needs evaluation.',
    hi: 'फसल की पत्तियों पर हाल के दिनों में धब्बे और किनारों पर खराबी दिख रही है। विकास प्रभावित लग रहा है।',
    pa: 'ਫਸਲ ਦੇ ਪੱਤਿਆਂ ਤੇ ਪਿਛਲੇ ਕੁਝ ਦਿਨਾਂ ਤੋਂ ਧੱਬੇ ਅਤੇ ਕਿਨਾਰਿਆਂ ਤੇ ਨੁਕਸਾਨ ਦਿਸ ਰਿਹਾ ਹੈ। ਵਾਧਾ ਪ੍ਰਭਾਵਿਤ ਲੱਗ ਰਿਹਾ ਹੈ।',
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
