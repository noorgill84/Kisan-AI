import type { LanguageCode } from '@/types';

// ─── Centralized i18n Strings ────────────────────────────────────────
// All static UI text lives here. The LanguageContext reads from this object
// and re-renders the entire tree on language change — no reload needed.

export interface StringTree {
  // Brand
  brand: { name: string; tagline: string };

  // Nav
  nav: {
    home: string;
    diagnose: string;
    history: string;
    weather: string;
    about: string;
    startDiagnosis: string;
  };

  // Language labels
  language: { en: string; hi: string; pa: string; label: string };

  // Home / Landing
  home: {
    badge: string;
    heroTitle: string;
    heroTitleAccent: string;
    heroSubtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    statFarmers: string;
    statCrops: string;
    statAccuracy: string;
    statLanguages: string;
    featureTitle: string;
    featureSubtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    feature4Title: string;
    feature4Desc: string;
    howItWorksTitle: string;
    howItWorksSubtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
    ctaSectionTitle: string;
    ctaSectionSubtitle: string;
    ctaSectionButton: string;
    weatherBtn: string;
  };

  // Diagnosis input
  diagnosis: {
    title: string;
    subtitle: string;
    imageLabel: string;
    imageHint: string;
    imageDragHint: string;
    imageRemove: string;
    voiceLabel: string;
    voiceHint: string;
    recordStart: string;
    recordStop: string;
    recordRecording: string;
    recordProcessing: string;
    transcriptionLabel: string;
    transcriptionPlaceholder: string;
    textLabel: string;
    textPlaceholder: string;
    cropLabel: string;
    cropPlaceholder: string;
    cropWheat: string;
    cropRice: string;
    cropMaize: string;
    cropCotton: string;
    cropSugarcane: string;
    cropTomato: string;
    cropPotato: string;
    cropUnknown: string;
    submit: string;
    submitting: string;
    errorNoInput: string;
    errorTranscribe: string;
    optional: string;
    languageLabel: string;
  };

  // Processing
  processing: {
    title: string;
    subtitle: string;
    stageImage: string;
    stageImageDesc: string;
    stageRetrieval: string;
    stageRetrievalDesc: string;
    stageReasoning: string;
    stageReasoningDesc: string;
    stageComplete: string;
    stageCompleteDesc: string;
  };

  // Results
  results: {
    title: string;
    subtitle: string;
    summaryLabel: string;
    possibleCausesLabel: string;
    confidenceLabel: string;
    confidenceHigh: string;
    confidenceMedium: string;
    confidenceLow: string;
    confidenceHighDesc: string;
    confidenceMediumDesc: string;
    confidenceLowDesc: string;
    evidenceLabel: string;
    evidenceSubtitle: string;
    actionPlanLabel: string;
    actionPlanSubtitle: string;
    escalationTitle: string;
    escalationDesc: string;
    escalationCta: string;
    newDiagnosis: string;
    saveToHistory: string;
    saved: string;
    stepLabel: string;
    priorityImmediate: string;
    priorityShortTerm: string;
    priorityPreventive: string;
    relevanceHigh: string;
    relevanceMedium: string;
    relevanceLow: string;
    categoryDisease: string;
    categoryPest: string;
    categoryNutrient: string;
    categoryEnvironmental: string;
    categoryPhysiological: string;
    symptomsLabel: string;
    sourceLabel: string;
    viewSource: string;
    cropLabel: string;
    dateLabel: string;
  };

  // History
  history: {
    title: string;
    subtitle: string;
    empty: string;
    emptyCta: string;
    viewLabel: string;
    deleteLabel: string;
    clearAll: string;
    confirmClear: string;
    dateLabel: string;
    causesCount: string;
    escalated: string;
  };

  // About
  about: {
    title: string;
    subtitle: string;
    missionTitle: string;
    missionDesc: string;
    pipelineTitle: string;
    pipelineSubtitle: string;
    stage1Title: string;
    stage1Desc: string;
    stage2Title: string;
    stage2Desc: string;
    stage3Title: string;
    stage3Desc: string;
    stage4Title: string;
    stage4Desc: string;
    stage5Title: string;
    stage5Desc: string;
    techTitle: string;
    techSubtitle: string;
    tech1: string;
    tech2: string;
    tech3: string;
    tech4: string;
    tech5: string;
    disclaimerTitle: string;
    disclaimerDesc: string;
  };

  // Weather
  weather: {
    title: string;
    subtitle: string;
    diagnoseCta: string;
    sprayTimingTitle: string;
    sprayTimingDesc: string;
    humidityTitle: string;
    humidityDesc: string;
    scoutingTitle: string;
    scoutingDesc: string;
    searchPlaceholder: string;
    useMyLocation: string;
    agriHubs: string;
    liveOpenMeteo: string;
    feelsLike: string;
    humidityLabel: string;
    moistRisk: string;
    balanced: string;
    rainChanceLabel: string;
    precipitationExpected: string;
    lowRainChance: string;
    windLabel: string;
    windUnit: string;
    sprayAdvisory: string;
    diseasePressure: string;
    forecastTitle: string;
    scrollHorizontally: string;
    weatherUnavailable: string;
    retryFetch: string;
    locationDenied: string;
    fetchError: string;
  };

  // Footer
  footer: {
    tagline: string;
    rights: string;
    madeWith: string;
    links: { about: string; privacy: string; terms: string };
    disclaimer: string;
  };
}

// ─── English ────────────────────────────────────────────────────────
const en: StringTree = {
  brand: { name: 'KisanAI', tagline: 'AI Crop Decision Support' },

  nav: {
    home: 'Home',
    diagnose: 'Diagnose',
    history: 'History',
    weather: 'Weather',
    about: 'How It Works',
    startDiagnosis: 'Start Diagnosis',
  },

  language: { en: 'English', hi: 'हिन्दी', pa: 'ਪੰਜਾਬੀ', label: 'Language' },

  home: {
    badge: 'AI-Powered Crop Decision Support',
    heroTitle: 'Protect your harvest with',
    heroTitleAccent: 'AI-driven insights',
    heroSubtitle:
      'Submit a crop photo and a voice or text description. Get possible causes, evidence-backed action plans, and expert guidance — in your language.',
    ctaPrimary: 'Start Diagnosis',
    ctaSecondary: 'How It Works',
    statFarmers: 'Farmers Supported',
    statCrops: 'Crop Types',
    statAccuracy: 'Assessment Quality',
    statLanguages: 'Languages',
    featureTitle: 'Why KisanAI',
    featureSubtitle: 'Built for farmers, powered by evidence-based AI',
    feature1Title: 'Multimodal Input',
    feature1Desc: 'Combine crop photos with voice or text descriptions for richer, more accurate assessments.',
    feature2Title: 'Evidence-Backed',
    feature2Desc: 'Every possible cause is supported by retrieved research and knowledge sources you can verify.',
    feature3Title: 'Actionable Plans',
    feature3Desc: 'Get clear, step-by-step action plans with priorities and timeframes — not just labels.',
    feature4Title: 'Expert Escalation',
    feature4Desc: 'When confidence is low, we guide you to local agricultural experts for hands-on support.',
    howItWorksTitle: 'How It Works',
    howItWorksSubtitle: 'Four simple steps from photo to action plan',
    step1Title: 'Capture',
    step1Desc: 'Upload a clear photo of your affected crop — leaves, stems, or roots.',
    step2Title: 'Describe',
    step2Desc: 'Add a voice note or text describing what you see and when it started.',
    step3Title: 'Analyze',
    step3Desc: 'Our AI pipeline analyzes the image, retrieves evidence, and reasons through possible causes.',
    step4Title: 'Act',
    step4Desc: 'Review possible causes, evidence, and a step-by-step action plan. Escalate to an expert if needed.',
    ctaSectionTitle: 'Ready to protect your crop?',
    ctaSectionSubtitle: 'Start a diagnosis in under a minute. No signup required.',
    ctaSectionButton: 'Start Free Diagnosis',
    weatherBtn: 'Weather & Spray Advisory',
  },

  diagnosis: {
    title: 'New Diagnosis',
    subtitle: 'Provide a crop photo and a description for the most accurate assessment',
    imageLabel: 'Crop Photo',
    imageHint: 'Upload a clear, well-lit photo of the affected plant',
    imageDragHint: 'Drag & drop or click to upload',
    imageRemove: 'Remove photo',
    voiceLabel: 'Voice Description',
    voiceHint: 'Describe what you see in your own words',
    recordStart: 'Start Recording',
    recordStop: 'Stop Recording',
    recordRecording: 'Listening...',
    recordProcessing: 'Transcribing...',
    transcriptionLabel: 'Transcription',
    transcriptionPlaceholder: 'Your speech will appear here...',
    textLabel: 'Text Description',
    textPlaceholder: 'e.g. Yellow spots appeared on the lower leaves last week, spreading upward...',
    cropLabel: 'Crop Type',
    cropPlaceholder: 'Select crop (optional)',
    cropWheat: 'Wheat',
    cropRice: 'Rice',
    cropMaize: 'Maize',
    cropCotton: 'Cotton',
    cropSugarcane: 'Sugarcane',
    cropTomato: 'Tomato',
    cropPotato: 'Potato',
    cropUnknown: 'Not sure / Other',
    submit: 'Analyze Crop',
    submitting: 'Analyzing...',
    errorNoInput: 'Please provide at least a photo or a text description to begin.',
    errorTranscribe: 'Could not transcribe audio. Please try again or use text input.',
    optional: 'optional',
    languageLabel: 'Assessment Language',
  },

  processing: {
    title: 'Analyzing Your Crop',
    subtitle: 'This usually takes 10–15 seconds. Please wait...',
    stageImage: 'Analyzing Image',
    stageImageDesc: 'Identifying visual symptoms and patterns in your crop photo',
    stageRetrieval: 'Retrieving Evidence',
    stageRetrievalDesc: 'Searching knowledge base for matching diseases, pests, and conditions',
    stageReasoning: 'Reasoning & Assessment',
    stageReasoningDesc: 'Cross-referencing findings with evidence to determine possible causes',
    stageComplete: 'Assessment Ready',
    stageCompleteDesc: 'Your results are prepared and ready to review',
  },

  results: {
    title: 'Assessment Results',
    subtitle: 'Review the possible causes and recommended actions below',
    summaryLabel: 'Summary',
    possibleCausesLabel: 'Possible Causes',
    confidenceLabel: 'Confidence',
    confidenceHigh: 'High Confidence',
    confidenceMedium: 'Medium Confidence',
    confidenceLow: 'Low Confidence',
    confidenceHighDesc: 'Strong visual and contextual evidence supports this assessment.',
    confidenceMediumDesc: 'Moderate evidence — consider monitoring and consulting additional sources.',
    confidenceLowDesc: 'Limited evidence — we recommend consulting a local agricultural expert.',
    evidenceLabel: 'Evidence & Sources',
    evidenceSubtitle: 'Retrieved knowledge supporting this assessment',
    actionPlanLabel: 'Recommended Action Plan',
    actionPlanSubtitle: 'Step-by-step guidance to address the issue',
    escalationTitle: 'Expert Consultation Recommended',
    escalationDesc: 'The confidence level for this assessment is low. We recommend connecting with a local agricultural extension officer or plant protection expert for a hands-on evaluation.',
    escalationCta: 'Find Local Expert',
    newDiagnosis: 'New Diagnosis',
    saveToHistory: 'Save to History',
    saved: 'Saved',
    stepLabel: 'Step',
    priorityImmediate: 'Immediate',
    priorityShortTerm: 'Short-term',
    priorityPreventive: 'Preventive',
    relevanceHigh: 'High relevance',
    relevanceMedium: 'Medium relevance',
    relevanceLow: 'Low relevance',
    categoryDisease: 'Disease',
    categoryPest: 'Pest',
    categoryNutrient: 'Nutrient',
    categoryEnvironmental: 'Environmental',
    categoryPhysiological: 'Physiological',
    symptomsLabel: 'Key symptoms',
    sourceLabel: 'Source',
    viewSource: 'View source',
    cropLabel: 'Crop',
    dateLabel: 'Analyzed on',
  },

  history: {
    title: 'Diagnosis History',
    subtitle: 'Your past crop assessments',
    empty: 'No diagnoses yet. Start your first crop assessment to see it here.',
    emptyCta: 'Start First Diagnosis',
    viewLabel: 'View',
    deleteLabel: 'Delete',
    clearAll: 'Clear All',
    confirmClear: 'Are you sure you want to clear all history? This cannot be undone.',
    dateLabel: 'Date',
    causesCount: 'possible causes',
    escalated: 'Expert escalation recommended',
  },

  about: {
    title: 'How KisanAI Works',
    subtitle: 'A transparent look at the AI pipeline behind every assessment',
    missionTitle: 'Our Mission',
    missionDesc:
      'KisanAI puts evidence-based crop decision support in every farmer\'s pocket. We combine visual AI, knowledge retrieval, and expert escalation to help you act early and protect your harvest — in your own language.',
    pipelineTitle: 'The Assessment Pipeline',
    pipelineSubtitle: 'Five stages from raw input to actionable output',
    stage1Title: 'Image Analysis',
    stage1Desc: 'A multimodal vision model examines your crop photo for visual symptoms — discoloration, lesions, spots, wilting, pest damage, and growth abnormalities.',
    stage2Title: 'Speech Transcription',
    stage2Desc: 'If you provide a voice note, a speech-to-text model transcribes it in your language, capturing contextual details that the image alone cannot convey.',
    stage3Title: 'Evidence Retrieval (RAG)',
    stage3Desc: 'A retrieval-augmented generation system searches a curated knowledge base of crop diseases, pests, and conditions to find relevant evidence for your specific case.',
    stage4Title: 'Multimodal Reasoning',
    stage4Desc: 'The AI cross-references visual symptoms with your description and retrieved evidence to identify possible causes, estimate confidence, and build an action plan.',
    stage5Title: 'Expert Escalation',
    stage5Desc: 'When confidence is low or symptoms are ambiguous, the system flags the case for expert consultation and provides guidance on connecting with local agricultural officers.',
    techTitle: 'Technology Stack',
    techSubtitle: 'The systems powering KisanAI',
    tech1: 'Multimodal LLM — Vision + Language Understanding',
    tech2: 'RAG Pipeline — FAISS / Chroma Vector Retrieval',
    tech3: 'Whisper STT — Multilingual Speech Transcription',
    tech4: 'FastAPI — High-Performance Backend',
    tech5: 'Supabase — Data & History Persistence',
    disclaimerTitle: 'Important Disclaimer',
    disclaimerDesc:
      'KisanAI provides decision support, not a confirmed diagnosis. Always consult a qualified agricultural expert before taking action on commercially significant crops. The assessment is based on visual and contextual evidence and may not capture all factors.',
  },

  weather: {
    title: 'Crop Weather & Spray Advisory',
    subtitle: 'Real-time meteorological insights powered by Open-Meteo. Optimize spray windows, avoid pesticide runoff, and predict foliar disease susceptibility.',
    diagnoseCta: 'Diagnose Crops',
    sprayTimingTitle: 'Spray Timing & Rain Risk',
    sprayTimingDesc: 'Applying chemical or organic foliar treatments when rain probability exceeds 40% leads to wash-off, soil contamination, and financial loss. Spray during dry calm windows.',
    humidityTitle: 'Humidity & Fungal Infection',
    humidityDesc: 'Relative humidity over 75% combined with temperatures above 24°C drastically accelerates fungal spore germination (e.g. Blight, Rust, Downy Mildew).',
    scoutingTitle: 'Micro-climate Scouting',
    scoutingDesc: 'Calibrated field scouting right before forecasted weather shifts allows early containment before microbial infestations reach economic injury thresholds.',
    searchPlaceholder: 'Search farm city or district (e.g. Ludhiana, Nashik)...',
    useMyLocation: 'Use My Location',
    agriHubs: 'Agri Hubs:',
    liveOpenMeteo: 'Live Open-Meteo',
    feelsLike: 'Feels like',
    humidityLabel: 'Humidity',
    moistRisk: 'Moist / Fungal risk',
    balanced: 'Balanced',
    rainChanceLabel: 'Rain Chance',
    precipitationExpected: 'Precipitation expected',
    lowRainChance: 'Low rain chance',
    windLabel: 'Wind',
    windUnit: 'km/h',
    sprayAdvisory: 'Spray Advisory:',
    diseasePressure: 'Disease Pressure:',
    forecastTitle: '7-Day Farm Forecast',
    scrollHorizontally: 'Scroll horizontally →',
    weatherUnavailable: 'Weather Unavailable',
    retryFetch: 'Retry Fetch',
    locationDenied: 'Location access was denied or timed out. Please search for your district or village above.',
    fetchError: 'Unable to fetch live weather. Please check your internet connection or try again.',
  },

  footer: {
    tagline: 'AI-powered crop decision support for every farmer.',
    rights: 'All rights reserved.',
    madeWith: 'Built for farmers',
    links: { about: 'How It Works', privacy: 'Privacy', terms: 'Terms' },
    disclaimer: 'KisanAI provides decision support, not confirmed diagnoses.',
  },
};

// ─── Hindi ──────────────────────────────────────────────────────────
const hi: StringTree = {
  brand: { name: 'KisanAI', tagline: 'एआई फसल निर्णय सहायता' },

  nav: {
    home: 'होम',
    diagnose: 'निदान',
    history: 'इतिहास',
    weather: 'मौसम',
    about: 'कैसे काम करता है',
    startDiagnosis: 'निदान शुरू करें',
  },

  language: { en: 'English', hi: 'हिन्दी', pa: 'ਪੰਜਾਬੀ', label: 'भाषा' },

  home: {
    badge: 'एआई-संचालित फसल निर्णय सहायता',
    heroTitle: 'अपनी फसल की रक्षा करें',
    heroTitleAccent: 'एआई-संचालित जानकारी से',
    heroSubtitle:
      'फसल की तस्वीर और आवाज़ या टेक्स्ट विवरण दें। संभावित कारण, साक्ष्य-आधारित कार्य योजना, और विशेषज्ञ मार्गदर्शन पाएं — अपनी भाषा में।',
    ctaPrimary: 'निदान शुरू करें',
    ctaSecondary: 'कैसे काम करता है',
    statFarmers: 'किसान समर्थित',
    statCrops: 'फसल प्रकार',
    statAccuracy: 'मूल्यांकन गुणवत्ता',
    statLanguages: 'भाषाएं',
    featureTitle: 'किसानएआई क्यों',
    featureSubtitle: 'किसानों के लिए बनाया गया, साक्ष्य-आधारित एआई द्वारा संचालित',
    feature1Title: 'मल्टीमॉडल इनपुट',
    feature1Desc: 'अधिक सटीक मूल्यांकन के लिए फसल फोटो को आवाज़ या टेक्स्ट विवरण के साथ जोड़ें।',
    feature2Title: 'साक्ष्य-आधारित',
    feature2Desc: 'प्रत्येक संभावित कारण समर्थित है रिट्रीव किए गए शोध और ज्ञान स्रोतों द्वारा जिन्हें आप सत्यापित कर सकते हैं।',
    feature3Title: 'कार्रवाई योग्य योजना',
    feature3Desc: 'प्राथमिकताओं और समय-सीमा के साथ स्पष्ट, चरण-दर-चरण कार्य योजना पाएं — केवल लेबल नहीं।',
    feature4Title: 'विशेषज्ञ स्तर वृद्धि',
    feature4Desc: 'जब विश्वास कम हो, हम आपको व्यावहारिक सहायता के लिए स्थानीय कृषि विशेषज्ञों से जोड़ते हैं।',
    howItWorksTitle: 'कैसे काम करता है',
    howItWorksSubtitle: 'फोटो से कार्य योजना तक चार सरल चरण',
    step1Title: 'कैप्चर',
    step1Desc: 'अपनी प्रभावित फसल की स्पष्ट फोटो अपलोड करें — पत्तियां, तने, या जड़ें।',
    step2Title: 'वर्णन',
    step2Desc: 'आवाज़ नोट या टेक्स्ट जोड़ें जिसमें बताएं कि आप क्या देख रहे हैं और यह कब शुरू हुआ।',
    step3Title: 'विश्लेषण',
    step3Desc: 'हमारी एआई पाइपलाइन छवि का विश्लेषण करती है, साक्ष्य रिट्रीव करती है, और संभावित कारणों पर विचार करती है।',
    step4Title: 'कार्रवाई',
    step4Desc: 'संभावित कारण, साक्ष्य, और चरण-दर-चरण कार्य योजना की समीक्षा करें। आवश्यक हो तो विशेषज्ञ से सलाह लें।',
    ctaSectionTitle: 'अपनी फसल की रक्षा के लिए तैयार हैं?',
    ctaSectionSubtitle: 'एक मिनट में निदान शुरू करें। साइनअप की आवश्यकता नहीं।',
    ctaSectionButton: 'मुफ्त निदान शुरू करें',
    weatherBtn: 'मौसम और स्प्रे सलाह',
  },

  diagnosis: {
    title: 'नया निदान',
    subtitle: 'सबसे सटीक मूल्यांकन के लिए फसल फोटो और विवरण प्रदान करें',
    imageLabel: 'फसल फोटो',
    imageHint: 'प्रभावित पौधे की स्पष्ट, अच्छी रोशनी वाली फोटो अपलोड करें',
    imageDragHint: 'खींचें और छोड़ें या अपलोड करने के लिए क्लिक करें',
    imageRemove: 'फोटो हटाएं',
    voiceLabel: 'आवाज़ विवरण',
    voiceHint: 'अपने शब्दों में बताएं कि आप क्या देख रहे हैं',
    recordStart: 'रिकॉर्डिंग शुरू करें',
    recordStop: 'रिकॉर्डिंग बंद करें',
    recordRecording: 'सुन रहा है...',
    recordProcessing: 'लिप्यंतरण...',
    transcriptionLabel: 'लिप्यंतरण',
    transcriptionPlaceholder: 'आपकी आवाज़ यहां दिखाई देगी...',
    textLabel: 'टेक्स्ट विवरण',
    textPlaceholder: 'जैसे पिछले हफ्ते निचली पत्तियों पर पीले धब्बे दिखे, ऊपर की ओर फैल रहे हैं...',
    cropLabel: 'फसल प्रकार',
    cropPlaceholder: 'फसल चुनें (वैकल्पिक)',
    cropWheat: 'गेहूं',
    cropRice: 'चावल',
    cropMaize: 'मक्का',
    cropCotton: 'कपास',
    cropSugarcane: 'गन्ना',
    cropTomato: 'टमाटर',
    cropPotato: 'आलू',
    cropUnknown: 'पक्का नहीं / अन्य',
    submit: 'फसल विश्लेषण करें',
    submitting: 'विश्लेषण हो रहा है...',
    errorNoInput: 'शुरू करने के लिए कम से कम एक फोटो या टेक्स्ट विवरण दें।',
    errorTranscribe: 'आवाज़ लिप्यंतरित नहीं हो सकी। पुनः प्रयास करें या टेक्स्ट इनपुट का उपयोग करें।',
    optional: 'वैकल्पिक',
    languageLabel: 'मूल्यांकन भाषा',
  },

  processing: {
    title: 'आपकी फसल का विश्लेषण हो रहा है',
    subtitle: 'इसमें आमतौर पर 10–15 सेकंड लगते हैं। कृपया प्रतीक्षा करें...',
    stageImage: 'छवि विश्लेषण',
    stageImageDesc: 'आपकी फसल फोटो में दृश्य लक्षण और पैटर्न की पहचान',
    stageRetrieval: 'साक्ष्य रिट्रीवल',
    stageRetrievalDesc: 'मिलान रोगों, कीटों, और स्थितियों के लिए ज्ञान आधार खोज',
    stageReasoning: 'तर्क और मूल्यांकन',
    stageReasoningDesc: 'संभावित कारण निर्धारित करने के लिए साक्ष्य के साथ निष्कर्शों की समानता',
    stageComplete: 'मूल्यांकन तैयार',
    stageCompleteDesc: 'आपके परिणाम तैयार हैं और समीक्षा के लिए उपलब्ध हैं',
  },

  results: {
    title: 'मूल्यांकन परिणाम',
    subtitle: 'नीचे संभावित कारण और अनुशंसित कार्रवाइयां समीक्षा करें',
    summaryLabel: 'सारांश',
    possibleCausesLabel: 'संभावित कारण',
    confidenceLabel: 'विश्वास',
    confidenceHigh: 'उच्च विश्वास',
    confidenceMedium: 'मध्यम विश्वास',
    confidenceLow: 'निम्न विश्वास',
    confidenceHighDesc: 'मजबूत दृश्य और संदर्भात्मक साक्ष्य इस मूल्यांकन का समर्थन करते हैं।',
    confidenceMediumDesc: 'मध्यम साक्ष्य — निगरानी और अतिरिक्त स्रोतों से परामर्श पर विचार करें।',
    confidenceLowDesc: 'सीमित साक्ष्य — हम स्थानीय कृषि विशेषज्ञ से परामर्श की सिफारिश करते हैं।',
    evidenceLabel: 'साक्ष्य और स्रोत',
    evidenceSubtitle: 'इस मूल्यांकन का समर्थन करने वाला रिट्रीव किया गया ज्ञान',
    actionPlanLabel: 'अनुशंसित कार्य योजना',
    actionPlanSubtitle: 'समस्या को संबोधित करने के लिए चरण-दर-चरण मार्गदर्शन',
    escalationTitle: 'विशेषज्ञ परामर्श अनुशंसित',
    escalationDesc: 'इस मूल्यांकन का विश्वास स्तर निम्न है। हम व्यावहारिक मूल्यांकन के लिए स्थानीय कृषि विस्तार अधिकारी या पादप संरक्षण विशेषज्ञ से जुड़ने की सिफारिश करते हैं।',
    escalationCta: 'स्थानीय विशेषज्ञ खोजें',
    newDiagnosis: 'नया निदान',
    saveToHistory: 'इतिहास में सहेजें',
    saved: 'सहेजा गया',
    stepLabel: 'चरण',
    priorityImmediate: 'तत्काल',
    priorityShortTerm: 'अल्पकालिक',
    priorityPreventive: 'निवारक',
    relevanceHigh: 'उच्च प्रासंगिकता',
    relevanceMedium: 'मध्यम प्रासंगिकता',
    relevanceLow: 'निम्न प्रासंगिकता',
    categoryDisease: 'रोग',
    categoryPest: 'कीट',
    categoryNutrient: 'पोषक',
    categoryEnvironmental: 'पर्यावरणीय',
    categoryPhysiological: 'शारीरिक',
    symptomsLabel: 'मुख्य लक्षण',
    sourceLabel: 'स्रोत',
    viewSource: 'स्रोत देखें',
    cropLabel: 'फसल',
    dateLabel: 'विश्लेषण तिथि',
  },

  history: {
    title: 'निदान इतिहास',
    subtitle: 'आपके पिछले फसल मूल्यांकन',
    empty: 'अभी तक कोई निदान नहीं। यहां देखने के लिए अपना पहला फसल मूल्यांकन शुरू करें।',
    emptyCta: 'पहला निदान शुरू करें',
    viewLabel: 'देखें',
    deleteLabel: 'हटाएं',
    clearAll: 'सभी साफ़ करें',
    confirmClear: 'क्या आप निश्चित हैं कि आप सभी इतिहास साफ़ करना चाहते हैं? यह पूर्ववत नहीं हो सकता।',
    dateLabel: 'तिथि',
    causesCount: 'संभावित कारण',
    escalated: 'विशेषज्ञ स्तर वृद्धि अनुशंसित',
  },

  about: {
    title: 'KisanAI कैसे काम करता है',
    subtitle: 'हर मूल्यांकन के पीछे एआई पाइपलाइन की पारदर्शी झलक',
    missionTitle: 'हमारा मिशन',
    missionDesc:
      'KisanAI हर किसान की जेब में साक्ष्य-आधारित फसल निर्णय सहायता रखता है। हम विज़ुअल एआई, ज्ञान रिट्रीवल, और विशेषज्ञ स्तर वृद्धि को जोड़ते हैं ताकि आप जल्दी कार्रवाई करें और अपनी फसल की रक्षा करें — अपनी भाषा में।',
    pipelineTitle: 'मूल्यांकन पाइपलाइन',
    pipelineSubtitle: 'कच्चे इनपुट से कार्रवाई योग्य आउटपुट तक पांच चरण',
    stage1Title: 'छवि विश्लेषण',
    stage1Desc: 'एक मल्टीमॉडल विज़न मॉडल आपकी फसल फोटो में दृश्य लक्षणों की जांच करता है — रंग परिवर्तन, घाव, धब्बे, मुरझाना, कीट क्षति, और वृद्धि असामान्यताएं।',
    stage2Title: 'आवाज़ लिप्यंतरण',
    stage2Desc: 'यदि आप आवाज़ नोट देते हैं, एक स्पीच-टू-टेक्स्ट मॉडल इसे आपकी भाषा में लिप्यंतरित करता है, संदर्भात्मक विवरण कैप्चर करता है जो केवल छवि नहीं दे सकती।',
    stage3Title: 'साक्ष्य रिट्रीवल (RAG)',
    stage3Desc: 'एक रिट्रीवल-संवर्धित जनरेशन सिस्टम फसल रोगों, कीटों, और स्थितियों के क्यूरेटेड ज्ञान आधार को खोजता है ताकि आपके विशिष्ट मामले के लिए प्रासंगिक साक्ष्य मिले।',
    stage4Title: 'मल्टीमॉडल तर्क',
    stage4Desc: 'एआई दृश्य लक्षणों को आपके विवरण और रिट्रीव किए गए साक्ष्य के साथ संदर्भित करता है ताकि संभावित कारण पहचाने, विश्वास अनुमानित करे, और कार्य योजना बनाए।',
    stage5Title: 'विशेषज्ञ स्तर वृद्धि',
    stage5Desc: 'जब विश्वास कम हो या लक्षण अस्पष्ट हों, सिस्टम मामले को विशेषज्ञ परामर्श के लिए चिह्नित करता है और स्थानीय कृषि अधिकारियों से जुड़ने का मार्गदर्शन देता है।',
    techTitle: 'तकनीकी स्टैक',
    techSubtitle: 'KisanAI को संचालित करने वाले सिस्टम',
    tech1: 'मल्टीमॉडल LLM — विज़न + भाषा समझ',
    tech2: 'RAG पाइपलाइन — FAISS / Chroma वेक्टर रिट्रीवल',
    tech3: 'Whisper STT — बहुभाषी आवाज़ लिप्यंतरण',
    tech4: 'FastAPI — उच्च-प्रदर्शन बैकएंड',
    tech5: 'Supabase — डेटा और इतिहास स्थायित्व',
    disclaimerTitle: 'महत्वपूर्ण अस्वीकरण',
    disclaimerDesc:
      'KisanAI निर्णय सहायता प्रदान करता है, पुष्ट निदान नहीं। व्यावसायिक रूप से महत्वपूर्ण फसलों पर कार्रवाई करने से पहले हमेशा योग्य कृषि विशेषज्ञ से परामर्श करें।',
  },

  weather: {
    title: 'फसल मौसम और स्प्रे सलाह',
    subtitle: 'ओपन-मीटियो द्वारा संचालित वास्तविक समय की मौसम संबंधी जानकारी। स्प्रे के समय को अनुकूलित करें, कीटनाशक के बहाव से बचें, और फंगल रोग की संवेदनशीलता की भविष्यवाणी करें।',
    diagnoseCta: 'फसलों का निदान करें',
    sprayTimingTitle: 'स्प्रे का समय और बारिश का जोखिम',
    sprayTimingDesc: 'जब बारिश की संभावना 40% से अधिक हो तो रासायनिक या जैविक पत्तेदार उपचार लागू करने से धुलाई, मिट्टी का प्रदूषण और वित्तीय नुकसान होता है। सूखे शांत समय के दौरान स्प्रे करें।',
    humidityTitle: 'नमी और फंगल संक्रमण',
    humidityDesc: '75% से अधिक सापेक्ष आर्द्रता 24°C से अधिक तापमान के साथ संयुक्त रूप से फंगल बीजाणु अंकुरण को तेज करती है (जैसे ब्लाइट, रस्ट, डाउनी मिल्ड्यू)।',
    scoutingTitle: 'माइक्रो-क्लाइमेट स्काउटिंग',
    scoutingDesc: 'मौसम में बदलाव से ठीक पहले कैलिब्रेटेड फील्ड स्काउटिंग से माइक्रोबियल संक्रमण के आर्थिक चोट की सीमा तक पहुंचने से पहले प्रारंभिक रोकथाम की अनुमति मिलती है।',
    searchPlaceholder: 'खेत का शहर या जिला खोजें (जैसे लुधियाना, नासिक)...',
    useMyLocation: 'मेरे स्थान का उपयोग करें',
    agriHubs: 'कृषि केंद्र:',
    liveOpenMeteo: 'लाइव ओपन-मीटियो',
    feelsLike: 'महसूस होता है',
    humidityLabel: 'नमी',
    moistRisk: 'नम / फंगल जोखिम',
    balanced: 'संतुलित',
    rainChanceLabel: 'बारिश की संभावना',
    precipitationExpected: 'बारिश की उम्मीद',
    lowRainChance: 'बारिश की कम संभावना',
    windLabel: 'हवा',
    windUnit: 'किमी/घंटा',
    sprayAdvisory: 'स्प्रे सलाह:',
    diseasePressure: 'रोग का दबाव:',
    forecastTitle: '7-दिवसीय खेत का पूर्वानुमान',
    scrollHorizontally: 'क्षैतिज रूप से स्क्रॉल करें →',
    weatherUnavailable: 'मौसम उपलब्ध नहीं',
    retryFetch: 'पुनः प्रयास करें',
    locationDenied: 'स्थान पहुंच से इनकार किया गया या समय समाप्त हो गया। कृपया ऊपर अपना जिला या गांव खोजें।',
    fetchError: 'लाइव मौसम लाने में असमर्थ। कृपया अपना इंटरनेट कनेक्शन जांचें या पुनः प्रयास करें।',
  },

  footer: {
    tagline: 'हर किसान के लिए एआई-संचालित फसल निर्णय सहायता।',
    rights: 'सर्वाधिकार सुरक्षित।',
    madeWith: 'किसानों के लिए बनाया गया',
    links: { about: 'कैसे काम करता है', privacy: 'गोपनीयता', terms: 'शर्तें' },
    disclaimer: 'KisanAI निर्णय सहायता प्रदान करता है, पुष्ट निदान नहीं।',
  },
};

// ─── Punjabi ────────────────────────────────────────────────────────
const pa: StringTree = {
  brand: { name: 'KisanAI', tagline: 'ਏਆਈ ਫਸਲ ਫੈਸਲਾ ਸਹਾਇਤਾ' },

  nav: {
    home: 'ਹੋਮ',
    diagnose: 'ਨਿਦਾਨ',
    history: 'ਇਤਿਹਾਸ',
    weather: 'ਮੌਸਮ',
    about: 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    startDiagnosis: 'ਨਿਦਾਨ ਸ਼ੁਰੂ ਕਰੋ',
  },

  language: { en: 'English', hi: 'हिन्दी', pa: 'ਪੰਜਾਬੀ', label: 'ਭਾਸ਼ਾ' },

  home: {
    badge: 'ਏਆਈ-ਚਲਾਇਤ ਫਸਲ ਫੈਸਲਾ ਸਹਾਇਤਾ',
    heroTitle: 'ਆਪਣੀ ਫਸਲ ਦੀ ਰੱਖਿਆ ਕਰੋ',
    heroTitleAccent: 'ਏਆਈ-ਚਲਾਇਤ ਜਾਣਕਾਰੀ ਨਾਲ',
    heroSubtitle:
      'ਫਸਲ ਦੀ ਫੋਟੋ ਅਤੇ ਆਵਾਜ਼ ਜਾਂ ਟੈਕਸਟ ਵੇਰਵਾ ਦਿਓ। ਸੰਭਾਵਿਤ ਕਾਰਨ, ਸਬੂਤ-ਆਧਾਰਿਤ ਕਾਰਵਾਈ ਯੋਜਨਾ, ਅਤੇ ਮਾਹਰ ਮਾਰਗਦਰਸ਼ਨ ਪਾਓ — ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ।',
    ctaPrimary: 'ਨਿਦਾਨ ਸ਼ੁਰੂ ਕਰੋ',
    ctaSecondary: 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    statFarmers: 'ਕਿਸਾਨ ਸਮਰਥਿਤ',
    statCrops: 'ਫਸਲ ਕਿਸਮਾਂ',
    statAccuracy: 'ਮੁਲਾਂਕਣ ਗੁਣਵੱਤਾ',
    statLanguages: 'ਭਾਸ਼ਾਵਾਂ',
    featureTitle: 'KisanAI ਕਿਉਂ',
    featureSubtitle: 'ਕਿਸਾਨਾਂ ਲਈ ਬਣਾਇਆ ਗਿਆ, ਸਬੂਤ-ਆਧਾਰਿਤ ਏਆਈ ਨਾਲ ਚਲਾਇਆ',
    feature1Title: 'ਮਲਟੀਮੋਡਲ ਇਨਪੁੱਟ',
    feature1Desc: 'ਵਧੇਰੇ ਸਟੀਕ ਮੁਲਾਂਕਣ ਲਈ ਫਸਲ ਫੋਟੋ ਨੂੰ ਆਵਾਜ਼ ਜਾਂ ਟੈਕਸਟ ਵੇਰਵੇ ਨਾਲ ਜੋੜੋ।',
    feature2Title: 'ਸਬੂਤ-ਆਧਾਰਿਤ',
    feature2Desc: 'ਹਰ ਸੰਭਾਵਿਤ ਕਾਰਨ ਰਿਟ੍ਰੀਵ ਕੀਤੇ ਖੋਜ ਅਤੇ ਗਿਆਨ ਸਰੋਤਾਂ ਦੁਆਰਾ ਸਮਰਥਿਤ ਹੈ ਜਿਨ੍ਹਾਂ ਨੂੰ ਤੁਸੀਂ ਪ੍ਰਮਾਣਿਤ ਕਰ ਸਕਦੇ ਹੋ।',
    feature3Title: 'ਕਾਰਵਾਈ ਯੋਗ ਯੋਜਨਾਵਾਂ',
    feature3Desc: 'ਤਰਜੀਹਾਂ ਅਤੇ ਸਮਾਂ-ਸੀਮਾ ਨਾਲ ਸਪਸ਼ਟ, ਕਦਮ-ਦਰ-ਕਦਮ ਕਾਰਵਾਈ ਯੋਜਨਾ ਪਾਓ — ਸਿਰਫ ਲੇਬਲ ਨਹੀਂ।',
    feature4Title: 'ਮਾਹਰ ਵਧੀਕ',
    feature4Desc: 'ਜਦੋਂ ਭਰੋਸਾ ਘੱਟ ਹੋਵੇ, ਅਸੀਂ ਤੁਹਾਨੂੰ ਵਿਹਾਰਕ ਸਹਾਇਤਾ ਲਈ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਮਾਹਰਾਂ ਨਾਲ ਜੋੜਦੇ ਹਾਂ।',
    howItWorksTitle: 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    howItWorksSubtitle: 'ਫੋਟੋ ਤੋਂ ਕਾਰਵਾਈ ਯੋਜਨਾ ਤੱਕ ਚਾਰ ਸਧਾਰਨ ਕਦਮ',
    step1Title: 'ਕੈਪਚਰ',
    step1Desc: 'ਆਪਣੀ ਪ੍ਰਭਾਵਿਤ ਫਸਲ ਦੀ ਸਪਸ਼ਟ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ — ਪੱਤੇ, ਤਣੇ, ਜਾਂ ਜੜ੍ਹਾਂ।',
    step2Title: 'ਵੇਰਵਾ',
    step2Desc: 'ਆਵਾਜ਼ ਨੋਟ ਜਾਂ ਟੈਕਸਟ ਜੋੜੋ ਜਿਸ ਵਿੱਚ ਦੱਸੋ ਕਿ ਤੁਸੀਂ ਕੀ ਦੇਖ ਰਹੇ ਹੋ ਅਤੇ ਇਹ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਇਆ।',
    step3Title: 'ਵਿਸ਼ਲੇਸ਼ਣ',
    step3Desc: 'ਸਾਡੀ ਏਆਈ ਪਾਈਪਲਾਈਨ ਚਿੱਤਰ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰਦੀ ਹੈ, ਸਬੂਤ ਰਿਟ੍ਰੀਵ ਕਰਦੀ ਹੈ, ਅਤੇ ਸੰਭਾਵਿਤ ਕਾਰਨਾਂ ਤੇ ਵਿਚਾਰ ਕਰਦੀ ਹੈ।',
    step4Title: 'ਕਾਰਵਾਈ',
    step4Desc: 'ਸੰਭਾਵਿਤ ਕਾਰਨ, ਸਬੂਤ, ਅਤੇ ਕਦਮ-ਦਰ-ਕਦਮ ਕਾਰਵਾਈ ਯੋਜਨਾ ਦੀ ਸਮੀਖਿਆ ਕਰੋ। ਲੋੜ ਪਵੇ ਤਾਂ ਮਾਹਰ ਨਾਲ ਸਲਾਹ ਲਓ।',
    ctaSectionTitle: 'ਆਪਣੀ ਫਸਲ ਦੀ ਰੱਖਿਆ ਲਈ ਤਿਆਰ ਹੋ?',
    ctaSectionSubtitle: 'ਇੱਕ ਮਿੰਟ ਵਿੱਚ ਨਿਦਾਨ ਸ਼ੁਰੂ ਕਰੋ। ਸਾਈਨਅੱਪ ਦੀ ਲੋੜ ਨਹੀਂ।',
    ctaSectionButton: 'ਮੁਫਤ ਨਿਦਾਨ ਸ਼ੁਰੂ ਕਰੋ',
    weatherBtn: 'ਮੌਸਮ ਅਤੇ ਸਪਰੇਅ ਸਲਾਹ',
  },

  diagnosis: {
    title: 'ਨਵਾਂ ਨਿਦਾਨ',
    subtitle: 'ਸਭ ਤੋਂ ਸਟੀਕ ਮੁਲਾਂਕਣ ਲਈ ਫਸਲ ਫੋਟੋ ਅਤੇ ਵੇਰਵਾ ਦਿਓ',
    imageLabel: 'ਫਸਲ ਫੋਟੋ',
    imageHint: 'ਪ੍ਰਭਾਵਿਤ ਬੂਟੇ ਦੀ ਸਪਸ਼ਟ, ਚੰਗੀ ਰੋਸ਼ਨੀ ਵਾਲੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ',
    imageDragHint: 'ਖਿੱਚੋ ਅਤੇ ਛੱਡੋ ਜਾਂ ਅਪਲੋਡ ਕਰਨ ਲਈ ਕਲਿੱਕ ਕਰੋ',
    imageRemove: 'ਫੋਟੋ ਹਟਾਓ',
    voiceLabel: 'ਆਵਾਜ਼ ਵੇਰਵਾ',
    voiceHint: 'ਆਪਣੇ ਸ਼ਬਦਾਂ ਵਿੱਚ ਦੱਸੋ ਕਿ ਤੁਸੀਂ ਕੀ ਦੇਖ ਰਹੇ ਹੋ',
    recordStart: 'ਰਿਕਾਰਡਿੰਗ ਸ਼ੁਰੂ ਕਰੋ',
    recordStop: 'ਰਿਕਾਰਡਿੰਗ ਬੰਦ ਕਰੋ',
    recordRecording: 'ਸੁਣ ਰਿਹਾ ਹੈ...',
    recordProcessing: 'ਟ੍ਰਾਂਸਕ੍ਰਾਈਬ ਕਰ ਰਿਹਾ ਹੈ...',
    transcriptionLabel: 'ਟ੍ਰਾਂਸਕ੍ਰਿਪਸ਼ਨ',
    transcriptionPlaceholder: 'ਤੁਹਾਡੀ ਆਵਾਜ਼ ਇੱਥੇ ਦਿਖਾਈ ਦੇਵੇਗੀ...',
    textLabel: 'ਟੈਕਸਟ ਵੇਰਵਾ',
    textPlaceholder: 'ਜਿਵੇਂ ਪਿਛਲੇ ਹਫ਼ਤੇ ਹੇਠਲੇ ਪੱਤਿਆਂ ਤੇ ਪੀਲੇ ਧੱਬੇ ਦਿਸੇ, ਉੱਪਰ ਵੱਲ ਫੈਲ ਰਹੇ ਹਨ...',
    cropLabel: 'ਫਸਲ ਕਿਸਮ',
    cropPlaceholder: 'ਫਸਲ ਚੁਣੋ (ਵਿਕਲਪਿਕ)',
    cropWheat: 'ਕਣਕ',
    cropRice: 'ਚੌਲ',
    cropMaize: 'ਮੱਕੀ',
    cropCotton: 'ਕਪਾਹ',
    cropSugarcane: 'ਗੰਨਾ',
    cropTomato: 'ਟਮਾਟਰ',
    cropPotato: 'ਆਲੂ',
    cropUnknown: 'ਯਕੀਨੀ ਨਹੀਂ / ਹੋਰ',
    submit: 'ਫਸਲ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ',
    submitting: 'ਵਿਸ਼ਲੇਸ਼ਣ ਹੋ ਰਿਹਾ ਹੈ...',
    errorNoInput: 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਫੋਟੋ ਜਾਂ ਟੈਕਸਟ ਵੇਰਵਾ ਦਿਓ।',
    errorTranscribe: 'ਆਵਾਜ਼ ਟ੍ਰਾਂਸਕ੍ਰਾਈਬ ਨਹੀਂ ਹੋ ਸਕੀ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਟੈਕਸਟ ਇਨਪੁੱਟ ਵਰਤੋ।',
    optional: 'ਵਿਕਲਪਿਕ',
    languageLabel: 'ਮੁਲਾਂਕਣ ਭਾਸ਼ਾ',
  },

  processing: {
    title: 'ਤੁਹਾਡੀ ਫਸਲ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਹੋ ਰਿਹਾ ਹੈ',
    subtitle: 'ਇਸ ਵਿੱਚ ਆਮ ਤੌਰ ਤੇ 10–15 ਸਕਿੰਟ ਲੱਗਦੇ ਹਨ। ਉਡੀਕ ਕਰੋ...',
    stageImage: 'ਚਿੱਤਰ ਵਿਸ਼ਲੇਸ਼ਣ',
    stageImageDesc: 'ਤੁਹਾਡੀ ਫਸਲ ਫੋਟੋ ਵਿੱਚ ਦਿੱਖ ਲੱਛਣ ਅਤੇ ਨਮੂਨਿਆਂ ਦੀ ਪਛਾਣ',
    stageRetrieval: 'ਸਬੂਤ ਰਿਟ੍ਰੀਵਲ',
    stageRetrievalDesc: 'ਮਿਲਦੇ ਰੋਗਾਂ, ਕੀਟਾਂ, ਅਤੇ ਸਥਿਤੀਆਂ ਲਈ ਗਿਆਨ ਆਧਾਰ ਖੋਜ',
    stageReasoning: 'ਤਰਕ ਅਤੇ ਮੁਲਾਂਕਣ',
    stageReasoningDesc: 'ਸੰਭਾਵਿਤ ਕਾਰਨ ਨਿਰਧਾਰਤ ਕਰਨ ਲਈ ਸਬੂਤ ਨਾਲ ਨਤੀਜਿਆਂ ਦੀ ਮਿਲਾਣ',
    stageComplete: 'ਮੁਲਾਂਕਣ ਤਿਆਰ',
    stageCompleteDesc: 'ਤੁਹਾਡੇ ਨਤੀਜੇ ਤਿਆਰ ਹਨ ਅਤੇ ਸਮੀਖਿਆ ਲਈ ਉਪਲਬਧ ਹਨ',
  },

  results: {
    title: 'ਮੁਲਾਂਕਣ ਨਤੀਜੇ',
    subtitle: 'ਹੇਠਾਂ ਸੰਭਾਵਿਤ ਕਾਰਨ ਅਤੇ ਸਿਫਾਰਸ਼ੀ ਕਾਰਵਾਈਆਂ ਸਮੀਖਿਆ ਕਰੋ',
    summaryLabel: 'ਸਾਰ',
    possibleCausesLabel: 'ਸੰਭਾਵਿਤ ਕਾਰਨ',
    confidenceLabel: 'ਭਰੋਸਾ',
    confidenceHigh: 'ਉੱਚ ਭਰੋਸਾ',
    confidenceMedium: 'ਮੱਧਮ ਭਰੋਸਾ',
    confidenceLow: 'ਘੱਟ ਭਰੋਸਾ',
    confidenceHighDesc: 'ਮਜ਼ਬੂਤ ਦਿੱਖ ਅਤੇ ਸੰਦਰਭ ਸਬੂਤ ਇਸ ਮੁਲਾਂਕਣ ਦਾ ਸਮਰਥਨ ਕਰਦੇ ਹਨ।',
    confidenceMediumDesc: 'ਮੱਧਮ ਸਬੂਤ — ਨਿਗਰਾਨੀ ਅਤੇ ਵਾਧੂ ਸਰੋਤਾਂ ਤੋਂ ਸਲਾਹ ਤੇ ਵਿਚਾਰ ਕਰੋ।',
    confidenceLowDesc: 'ਸੀਮਤ ਸਬੂਤ — ਅਸੀਂ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਮਾਹਰ ਤੋਂ ਸਲਾਹ ਦੀ ਸਿਫਾਰਸ਼ ਕਰਦੇ ਹਾਂ।',
    evidenceLabel: 'ਸਬੂਤ ਅਤੇ ਸਰੋਤ',
    evidenceSubtitle: 'ਇਸ ਮੁਲਾਂਕਣ ਦਾ ਸਮਰਥਨ ਕਰਨ ਵਾਲਾ ਰਿਟ੍ਰੀਵ ਕੀਤਾ ਗਿਆਨ',
    actionPlanLabel: 'ਸਿਫਾਰਸ਼ੀ ਕਾਰਵਾਈ ਯੋਜਨਾ',
    actionPlanSubtitle: 'ਸਮੱਸਿਆ ਨੂੰ ਹੱਲ ਕਰਨ ਲਈ ਕਦਮ-ਦਰ-ਕਦਮ ਮਾਰਗਦਰਸ਼ਨ',
    escalationTitle: 'ਮਾਹਰ ਸਲਾਹ ਸਿਫਾਰਸ਼ੀ',
    escalationDesc: 'ਇਸ ਮੁਲਾਂਕਣ ਦਾ ਭਰੋਸਾ ਪੱਧਰ ਘੱਟ ਹੈ। ਅਸੀਂ ਵਿਹਾਰਕ ਮੁਲਾਂਕਣ ਲਈ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਵਿਸਤਾਰ ਅਧਿਕਾਰੀ ਜਾਂ ਪੌਦਾ ਸੁਰੱਖਿਆ ਮਾਹਰ ਨਾਲ ਜੁੜਨ ਦੀ ਸਿਫਾਰਸ਼ ਕਰਦੇ ਹਾਂ।',
    escalationCta: 'ਸਥਾਨਕ ਮਾਹਰ ਲੱਭੋ',
    newDiagnosis: 'ਨਵਾਂ ਨਿਦਾਨ',
    saveToHistory: 'ਇਤਿਹਾਸ ਵਿੱਚ ਸੰਭਾਲੋ',
    saved: 'ਸੰਭਾਲਿਆ',
    stepLabel: 'ਕਦਮ',
    priorityImmediate: 'ਤੁਰੰਤ',
    priorityShortTerm: 'ਅਲਪਕਾਲੀ',
    priorityPreventive: 'ਰੋਕਥਾਮ',
    relevanceHigh: 'ਉੱਚ ਪ੍ਰਸੰਗਿਕਤਾ',
    relevanceMedium: 'ਮੱਧਮ ਪ੍ਰਸੰਗਿਕਤਾ',
    relevanceLow: 'ਘੱਟ ਪ੍ਰਸੰਗਿਕਤਾ',
    categoryDisease: 'ਰੋਗ',
    categoryPest: 'ਕੀਟ',
    categoryNutrient: 'ਪੋਸ਼ਕ',
    categoryEnvironmental: 'ਵਾਤਾਵਰਣੀ',
    categoryPhysiological: 'ਸਰੀਰਕ',
    symptomsLabel: 'ਮੁੱਖ ਲੱਛਣ',
    sourceLabel: 'ਸਰੋਤ',
    viewSource: 'ਸਰੋਤ ਵੇਖੋ',
    cropLabel: 'ਫਸਲ',
    dateLabel: 'ਵਿਸ਼ਲੇਸ਼ਣ ਮਿਤੀ',
  },

  history: {
    title: 'ਨਿਦਾਨ ਇਤਿਹਾਸ',
    subtitle: 'ਤੁਹਾਡੇ ਪਿਛਲੇ ਫਸਲ ਮੁਲਾਂਕਣ',
    empty: 'ਅਜੇ ਤੱਕ ਕੋਈ ਨਿਦਾਨ ਨਹੀਂ। ਇੱਥੇ ਵੇਖਣ ਲਈ ਆਪਣਾ ਪਹਿਲਾ ਫਸਲ ਮੁਲਾਂਕਣ ਸ਼ੁਰੂ ਕਰੋ।',
    emptyCta: 'ਪਹਿਲਾਂ ਨਿਦਾਨ ਸ਼ੁਰੂ ਕਰੋ',
    viewLabel: 'ਵੇਖੋ',
    deleteLabel: 'ਮਿਟਾਓ',
    clearAll: 'ਸਭ ਸਾਫ਼ ਕਰੋ',
    confirmClear: 'ਕੀ ਤੁਸੀਂ ਨਿਸ਼ਚਤ ਹੋ ਕਿ ਸਾਰਾ ਇਤਿਹਾਸ ਸਾਫ਼ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ? ਇਹ ਵਾਪਸ ਨਹੀਂ ਹੋ ਸਕਦਾ।',
    dateLabel: 'ਮਿਤੀ',
    causesCount: 'ਸੰਭਾਵਿਤ ਕਾਰਨ',
    escalated: 'ਮਾਹਰ ਵਧੀਕ ਸਿਫਾਰਸ਼ੀ',
  },

  about: {
    title: 'KisanAI ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    subtitle: 'ਹਰ ਮੁਲਾਂਕਣ ਦੇ ਪਿੱਛੇ ਏਆਈ ਪਾਈਪਲਾਈਨ ਦੀ ਪਾਰਦਰਸ਼ੀ ਝਲਕ',
    missionTitle: 'ਸਾਡਾ ਮਿਸ਼ਨ',
    missionDesc:
      'KisanAI ਹਰ ਕਿਸਾਨ ਦੀ ਜੇਬ ਵਿੱਚ ਸਬੂਤ-ਆਧਾਰਿਤ ਫਸਲ ਫੈਸਲਾ ਸਹਾਇਤਾ ਰੱਖਦਾ ਹੈ। ਅਸੀਂ ਵਿਜ਼ੁਅਲ ਏਆਈ, ਗਿਆਨ ਰਿਟ੍ਰੀਵਲ, ਅਤੇ ਮਾਹਰ ਵਧੀਕ ਨੂੰ ਜੋੜਦੇ ਹਾਂ ਤਾਂ ਜੋ ਤੁਸੀਂ ਜਲਦੀ ਕਾਰਵਾਈ ਕਰੋ ਅਤੇ ਆਪਣੀ ਫਸਲ ਦੀ ਰੱਖਿਆ ਕਰੋ — ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ।',
    pipelineTitle: 'ਮੁਲਾਂਕਣ ਪਾਈਪਲਾਈਨ',
    pipelineSubtitle: 'ਕੱਚੇ ਇਨਪੁੱਟ ਤੋਂ ਕਾਰਵਾਈ ਯੋਗ ਆਉਟਪੁੱਟ ਤੱਕ ਪੰਜ ਕਦਮ',
    stage1Title: 'ਚਿੱਤਰ ਵਿਸ਼ਲੇਸ਼ਣ',
    stage1Desc: 'ਇੱਕ ਮਲਟੀਮੋਡਲ ਵਿਜ਼ਨ ਮਾਡਲ ਤੁਹਾਡੀ ਫਸਲ ਫੋਟੋ ਵਿੱਚ ਦਿੱਖ ਲੱਛਣਾਂ ਦੀ ਜਾਂਚ ਕਰਦਾ ਹੈ — ਰੰਗ ਬਦਲਾਅ, ਜ਼ਖ਼ਮ, ਧੱਬੇ, ਮੁਰਝਾਉਣਾ, ਕੀਟ ਨੁਕਸਾਨ, ਅਤੇ ਵਾਧਾ ਅਸਧਾਰਨਤਾਵਾਂ।',
    stage2Title: 'ਆਵਾਜ਼ ਟ੍ਰਾਂਸਕ੍ਰਿਪਸ਼ਨ',
    stage2Desc: 'ਜੇ ਤੁਸੀਂ ਆਵਾਜ਼ ਨੋਟ ਦਿੰਦੇ ਹੋ, ਇੱਕ ਸਪੀਚ-ਟੂ-ਟੈਕਸਟ ਮਾਡਲ ਇਸ ਨੂੰ ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਟ੍ਰਾਂਸਕ੍ਰਾਈਬ ਕਰਦਾ ਹੈ, ਸੰਦਰਭ ਵੇਰਵੇ ਕੈਪਚਰ ਕਰਦਾ ਹੈ ਜੋ ਕੇਵਲ ਚਿੱਤਰ ਨਹੀਂ ਦੇ ਸਕਦਾ।',
    stage3Title: 'ਸਬੂਤ ਰਿਟ੍ਰੀਵਲ (RAG)',
    stage3Desc: 'ਇੱਕ ਰਿਟ੍ਰੀਵਲ-ਸੰਵਰਧਿਤ ਜਨਰੇਸ਼ਨ ਸਿਸਟਮ ਫਸਲ ਰੋਗਾਂ, ਕੀਟਾਂ, ਅਤੇ ਸਥਿਤੀਆਂ ਦੇ ਕਿਊਰੇਟਡ ਗਿਆਨ ਆਧਾਰ ਨੂੰ ਖੋਜਦਾ ਹੈ ਤਾਂ ਜੋ ਤੁਹਾਡੇ ਵਿਸ਼ੇਸ਼ ਕੇਸ ਲਈ ਪ੍ਰਸੰਗਿਕ ਸਬੂਤ ਮਿਲੇ।',
    stage4Title: 'ਮਲਟੀਮੋਡਲ ਤਰਕ',
    stage4Desc: 'ਏਆਈ ਦਿੱਖ ਲੱਛਣਾਂ ਨੂੰ ਤੁਹਾਡੇ ਵੇਰਵੇ ਅਤੇ ਰਿਟ੍ਰੀਵ ਕੀਤੇ ਸਬੂਤ ਨਾਲ ਮਿਲਾਉਂਦਾ ਹੈ ਤਾਂ ਜੋ ਸੰਭਾਵਿਤ ਕਾਰਨ ਪਛਾਣੇ, ਭਰੋਸਾ ਅਨੁਮਾਨਿਤ ਕਰੇ, ਅਤੇ ਕਾਰਵਾਈ ਯੋਜਨਾ ਬਣਾਏ।',
    stage5Title: 'ਮਾਹਰ ਵਧੀਕ',
    stage5Desc: 'ਜਦੋਂ ਭਰੋਸਾ ਘੱਟ ਹੋਵੇ ਜਾਂ ਲੱਛਣ ਅਸਪਸ਼ਟ ਹੋਣ, ਸਿਸਟਮ ਕੇਸ ਨੂੰ ਮਾਹਰ ਸਲਾਹ ਲਈ ਚਿੰਨ੍ਹਿਤ ਕਰਦਾ ਹੈ ਅਤੇ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਅਧਿਕਾਰੀਆਂ ਨਾਲ ਜੁੜਨ ਦਾ ਮਾਰਗਦਰਸ਼ਨ ਦਿੰਦਾ ਹੈ।',
    techTitle: 'ਤਕਨੀਕੀ ਸਟੈਕ',
    techSubtitle: 'KisanAI ਨੂੰ ਚਲਾਉਣ ਵਾਲੇ ਸਿਸਟਮ',
    tech1: 'ਮਲਟੀਮੋਡਲ LLM — ਵਿਜ਼ਨ + ਭਾਸ਼ਾ ਸਮਝ',
    tech2: 'RAG ਪਾਈਪਲਾਈਨ — FAISS / Chroma ਵੈਕਟਰ ਰਿਟ੍ਰੀਵਲ',
    tech3: 'Whisper STT — ਬਹੁਭਾਸ਼ੀ ਆਵਾਜ਼ ਟ੍ਰਾਂਸਕ੍ਰਿਪਸ਼ਨ',
    tech4: 'FastAPI — ਉੱਚ-ਪ੍ਰਦਰਸ਼ਨ ਬੈਕਐਂਡ',
    tech5: 'Supabase — ਡਾਟਾ ਅਤੇ ਇਤਿਹਾਸ ਸਥਾਈਤਾ',
    disclaimerTitle: 'ਮਹੱਤਵਪੂਰਨ ਅਸਵੀਕਰਣ',
    disclaimerDesc:
      'KisanAI ਫੈਸਲਾ ਸਹਾਇਤਾ ਦਿੰਦਾ ਹੈ, ਪੁਸ਼ਟੀ ਨਿਦਾਨ ਨਹੀਂ। ਵਪਾਰਕ ਤੌਰ ਤੇ ਮਹੱਤਵਪੂਰਨ ਫਸਲਾਂ ਤੇ ਕਾਰਵਾਈ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਹਮੇਸ਼ਾ ਯੋਗ ਖੇਤੀਬਾੜੀ ਮਾਹਰ ਤੋਂ ਸਲਾਹ ਲਓ।',
  },

  weather: {
    title: 'ਫਸਲ ਮੌਸਮ ਅਤੇ ਸਪਰੇਅ ਸਲਾਹ',
    subtitle: 'ਓਪਨ-ਮੀਟਿਓ ਦੁਆਰਾ ਸੰਚਾਲਿਤ ਅਸਲ-ਸਮੇਂ ਦੀ ਮੌਸਮ ਸੰਬੰਧੀ ਜਾਣਕਾਰੀ। ਸਪਰੇਅ ਦੇ ਸਮੇਂ ਨੂੰ ਅਨੁਕੂਲਿਤ ਕਰੋ, ਕੀਟਨਾਸ਼ਕ ਦੇ ਵਹਿਣ ਤੋਂ ਬਚੋ, ਅਤੇ ਫੰਗਲ ਰੋਗ ਦੀ ਸੰਵੇਦਨਸ਼ੀਲਤਾ ਦੀ ਭਵਿੱਖਬਾਣੀ ਕਰੋ।',
    diagnoseCta: 'ਫਸਲਾਂ ਦਾ ਨਿਦਾਨ ਕਰੋ',
    sprayTimingTitle: 'ਸਪਰੇਅ ਦਾ ਸਮਾਂ ਅਤੇ ਮੀਂਹ ਦਾ ਜੋਖਮ',
    sprayTimingDesc: 'ਜਦੋਂ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ 40% ਤੋਂ ਵੱਧ ਹੁੰਦੀ ਹੈ ਤਾਂ ਰਸਾਇਣਕ ਜਾਂ ਜੈਵਿਕ ਪੱਤੇਦਾਰ ਉਪਚਾਰ ਲਾਗੂ ਕਰਨ ਨਾਲ ਧੁਆਈ, ਮਿੱਟੀ ਦਾ ਪ੍ਰਦੂਸ਼ਣ ਅਤੇ ਵਿੱਤੀ ਨੁਕਸਾਨ ਹੁੰਦਾ ਹੈ। ਸੁੱਕੇ ਸ਼ਾਂਤ ਸਮੇਂ ਦੌਰਾਨ ਸਪਰੇਅ ਕਰੋ।',
    humidityTitle: 'ਨਮੀ ਅਤੇ ਫੰਗਲ ਇਨਫੈਕਸ਼ਨ',
    humidityDesc: '75% ਤੋਂ ਵੱਧ ਸਾਪੇਖਿਕ ਨਮੀ 24°C ਤੋਂ ਵੱਧ ਤਾਪਮਾਨ ਦੇ ਨਾਲ ਸੰਯੁਕਤ ਰੂਪ ਵਿੱਚ ਫੰਗਲ ਬੀਜਾਣੂ ਉਗਣ ਨੂੰ ਤੇਜ਼ ਕਰਦੀ ਹੈ (ਜਿਵੇਂ ਕਿ ਬਲਾਈਟ, ਰਸਟ, ਡਾਊਨੀ ਮਿਲਡਿਊ)।',
    scoutingTitle: 'ਮਾਈਕ੍ਰੋ-ਕਲਾਈਮੇਟ ਸਕਾਊਟਿੰਗ',
    scoutingDesc: 'ਮੌਸਮ ਵਿੱਚ ਤਬਦੀਲੀ ਤੋਂ ਠੀਕ ਪਹਿਲਾਂ ਕੈਲੀਬ੍ਰੇਟਿਡ ਫੀਲਡ ਸਕਾਊਟਿੰਗ ਨਾਲ ਮਾਈਕ੍ਰੋਬਾਇਲ ਇਨਫੈਕਸ਼ਨ ਦੇ ਆਰਥਿਕ ਸੱਟ ਦੀ ਹੱਦ ਤੱਕ ਪਹੁੰਚਣ ਤੋਂ ਪਹਿਲਾਂ ਸ਼ੁਰੂਆਤੀ ਰੋਕਥਾਮ ਦੀ ਇਜਾਜ਼ਤ ਮਿਲਦੀ ਹੈ।',
    searchPlaceholder: 'ਖੇਤ ਦਾ ਸ਼ਹਿਰ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਲੱਭੋ (ਜਿਵੇਂ ਕਿ ਲੁਧਿਆਣਾ, ਨਾਸਿਕ)...',
    useMyLocation: 'ਮੇਰਾ ਸਥਾਨ ਵਰਤੋ',
    agriHubs: 'ਖੇਤੀ ਕੇਂਦਰ:',
    liveOpenMeteo: 'ਲਾਈਵ ਓਪਨ-ਮੀਟਿਓ',
    feelsLike: 'ਮਹਿਸੂਸ ਹੁੰਦਾ ਹੈ',
    humidityLabel: 'ਨਮੀ',
    moistRisk: 'ਨਮ / ਫੰਗਲ ਜੋਖਮ',
    balanced: 'ਸੰਤੁਲਿਤ',
    rainChanceLabel: 'ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ',
    precipitationExpected: 'ਮੀਂਹ ਦੀ ਉਮੀਦ',
    lowRainChance: 'ਮੀਂਹ ਦੀ ਘੱਟ ਸੰਭਾਵਨਾ',
    windLabel: 'ਹਵਾ',
    windUnit: 'ਕਿਮੀ/ਘੰਟਾ',
    sprayAdvisory: 'ਸਪਰੇਅ ਸਲਾਹ:',
    diseasePressure: 'ਰੋਗ ਦਾ ਦਬਾਅ:',
    forecastTitle: '7-ਦਿਨਾਂ ਦੇ ਖੇਤ ਦੀ ਭਵਿੱਖਬਾਣੀ',
    scrollHorizontally: 'ਲੇਟਵੇਂ ਤੌਰ ਤੇ ਸਕ੍ਰੋਲ ਕਰੋ →',
    weatherUnavailable: 'ਮੌਸਮ ਉਪਲਬਧ ਨਹੀਂ',
    retryFetch: 'ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    locationDenied: 'ਸਥਾਨ ਪਹੁੰਚ ਤੋਂ ਇਨਕਾਰ ਕੀਤਾ ਗਿਆ ਜਾਂ ਸਮਾਂ ਸਮਾਪਤ ਹੋ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਉੱਪਰ ਆਪਣਾ ਜ਼ਿਲ੍ਹਾ ਜਾਂ ਪਿੰਡ ਲੱਭੋ।',
    fetchError: 'ਲਾਈਵ ਮੌਸਮ ਲਿਆਉਣ ਵਿੱਚ ਅਸਮਰੱਥ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਇੰਟਰਨੈਟ ਕਨੈਕਸ਼ਨ ਜਾਂਚੋ ਜਾਂ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  },

  footer: {
    tagline: 'ਹਰ ਕਿਸਾਨ ਲਈ ਏਆਈ-ਚਲਾਇਤ ਫਸਲ ਫੈਸਲਾ ਸਹਾਇਤਾ।',
    rights: 'ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ।',
    madeWith: 'ਕਿਸਾਨਾਂ ਲਈ ਬਣਾਇਆ',
    links: { about: 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ', privacy: 'ਪਰਦੇਦਾਰੀ', terms: 'ਸ਼ਰਤਾਂ' },
    disclaimer: 'KisanAI ਫੈਸਲਾ ਸਹਾਇਤਾ ਦਿੰਦਾ ਹੈ, ਪੁਸ਼ਟੀ ਨਿਦਾਨ ਨਹੀਂ।',
  },
};

// ─── Export ──────────────────────────────────────────────────────────
export const strings: Record<LanguageCode, StringTree> = { en, hi, pa };

export function getStrings(lang: LanguageCode): StringTree {
  return strings[lang] ?? strings.en;
}
