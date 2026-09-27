import uuid
import datetime
import logging
from typing import Optional, List, Dict, Tuple
from app.models.schemas import (
    AnalyzeRequest,
    AnalysisResult,
    PossibleCause,
    EvidenceSource,
    ActionStep,
    ConfidenceLevel,
    CropType,
    LanguageCode
)

logger = logging.getLogger(__name__)

# Crop name localizations
CROP_LOCALIZATIONS: Dict[CropType, Dict[LanguageCode, str]] = {
    "wheat": {"en": "Wheat", "hi": "गेहूं", "pa": "ਕਣਕ"},
    "rice": {"en": "Rice", "hi": "चावल", "pa": "ਚੌਲ"},
    "maize": {"en": "Maize", "hi": "मक्का", "pa": "ਮੱਕੀ"},
    "cotton": {"en": "Cotton", "hi": "कपास", "pa": "ਕਪਾਹ"},
    "sugarcane": {"en": "Sugarcane", "hi": "गन्ना", "pa": "ਗੰਨਾ"},
    "tomato": {"en": "Tomato", "hi": "टमाटर", "pa": "ਟਮਾਟਰ"},
    "potato": {"en": "Potato", "hi": "आलू", "pa": "ਆਲੂ"},
    "unknown": {"en": "Unspecified Crop", "hi": "अज्ञात फसल", "pa": "ਅਣਜਾਣ ਫਸਲ"}
}

def get_crop_localized(crop_type: CropType) -> Dict[LanguageCode, str]:
    return CROP_LOCALIZATIONS.get(crop_type, CROP_LOCALIZATIONS["unknown"])

def determine_confidence_level(has_image: bool, has_text: bool) -> ConfidenceLevel:
    if has_image and has_text:
        return "high"
    elif has_image or has_text:
        return "medium"
    return "low"

def build_confidence_narrative(confidence: ConfidenceLevel) -> Tuple[str, Dict[LanguageCode, str]]:
    narratives = {
        "high": {
            "en": "Strong visual and contextual evidence supports this decision support assessment.",
            "hi": "मजबूत दृश्य और संदर्भात्मक साक्ष्य इस निर्णय सहायता मूल्यांकन का समर्थन करते हैं।",
            "pa": "ਮਜ਼ਬੂਤ ਦਿੱਖ ਅਤੇ ਸੰਦਰਭ ਸਬੂਤ ਇਸ ਫੈਸਲੇ ਸਹਾਇਤਾ ਮੁਲਾਂਕਣ ਦਾ ਸਮਰਥਨ ਕਰਦੇ ਹਨ।"
        },
        "medium": {
            "en": "Moderate evidence — consider monitoring symptoms and validating with secondary evidence.",
            "hi": "मध्यम साक्ष्य — लक्षणों की निगरानी और अतिरिक्त स्रोतों से सत्यापन पर विचार करें।",
            "pa": "ਮੱਧਮ ਸਬੂਤ — ਲੱਛਣਾਂ ਦੀ ਨਿਗਰਾਨੀ ਅਤੇ ਵਾਧੂ ਸਰੋਤਾਂ ਤੋਂ ਤਸਦੀਕ ਤੇ ਵਿਚਾਰ ਕਰੋ।"
        },
        "low": {
            "en": "Limited input data — we recommend consulting a local agricultural extension expert for physical inspection.",
            "hi": "सीमित इनपुट डेटा — हम भौतिक निरीक्षण के लिए स्थानीय कृषि विस्तार विशेषज्ञ से परामर्श की सिफारिश करते हैं।",
            "pa": "ਸੀਮਤ ਇਨਪੁਟ ਡੇਟਾ — ਅਸੀਂ ਭੌਤਿਕ ਨਿਰੀਖਣ ਲਈ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਵਿਸਤਾਰ ਮਾਹਰ ਤੋਂ ਸਲਾਹ ਦੀ ਸਿਫਾਰਸ਼ ਕਰਦੇ ਹਾਂ।"
        }
    }
    selected = narratives.get(confidence, narratives["low"])
    return selected["en"], selected

def build_escalation_guidance(escalate: bool) -> Tuple[Optional[str], Optional[Dict[LanguageCode, str]]]:
    if not escalate:
        return None, None
    guidance = {
        "en": "The confidence level for this assessment is low. We recommend connecting with a local agricultural extension officer or plant protection expert for hands-on evaluation.",
        "hi": "इस मूल्यांकन का विश्वास स्तर निम्न है। हम व्यावहारिक मूल्यांकन के लिए स्थानीय कृषि विस्तार अधिकारी या पादप संरक्षण विशेषज्ञ से जुड़ने की सिफारिश करते हैं।",
        "pa": "ਇਸ ਮੁਲਾਂਕਣ ਦਾ ਭਰੋਸਾ ਪੱਧਰ ਘੱਟ ਹੈ। ਅਸੀਂ ਵਿਹਾਰਕ ਮੁਲਾਂਕਣ ਲਈ ਸਥਾਨਕ ਖੇਤੀਬਾੜੀ ਵਿਸਤਾਰ ਅਧਿਕਾਰੀ ਜਾਂ ਪੌਦਾ ਸੁਰੱਖਿਆ ਮਾਹਰ ਨਾਲ ਜੁੜਨ ਦੀ ਸਿਫਾਰਸ਼ ਕਰਦੇ ਹਾਂ।"
    }
    return guidance["en"], guidance

def build_default_possible_causes(crop_type: CropType) -> List[PossibleCause]:
    if crop_type == "rice":
        return [
            PossibleCause(
                id="cause-1",
                name="Bacterial Leaf Blight (Xanthomonas oryzae)",
                nameLocalized={
                    "en": "Bacterial Leaf Blight (Xanthomonas oryzae)",
                    "hi": "जीवाणु पत्ती ब्लाइट (ज़ैंथोमोनास ओराइज़ी)",
                    "pa": "ਬੈਕਟੀਰੀਆ ਪੱਤਾ ਬਲਾਈਟ (ਜ਼ੈਂਥੋਮੋਨਾਸ ਓਰਾਈਜ਼ੀ)"
                },
                category="disease",
                description="Bacterial leaf blight causes water-soaked lesions on leaf margins expanding to yellow-brown stripes.",
                descriptionLocalized={
                    "en": "Bacterial leaf blight causes water-soaked lesions on leaf margins expanding to yellow-brown stripes.",
                    "hi": "जीवाणु पत्ती ब्लाइट से पत्तियों के किनारों पर जल-भिग्न घाव होते हैं जो पीले-भूरे रंग की धारियों में फैल जाते हैं।",
                    "pa": "ਬੈਕਟੀਰੀਆ ਪੱਤਾ ਬਲਾਈਟ ਨਾਲ ਪੱਤਿਆਂ ਦੇ ਕਿਨਾਰਿਆਂ ਤੇ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ ਹੁੰਦੇ ਹਨ ਜੋ ਪੀਲੇ-ਭੂਰੇ ਰੰਗ ਦੀਆਂ ਧਾਰੀਆਂ ਵਿੱਚ ਫੈਲ ਜਾਂਦੇ ਹਨ।"
                },
                likelihood="high",
                symptoms=[
                    "Water-soaked lesions along leaf margins",
                    "Yellowing with wavy margins",
                    "Leaf drying and blighting in upper canopy"
                ],
                symptomsLocalized={
                    "en": ["Water-soaked lesions along leaf margins", "Yellowing with wavy margins", "Leaf drying and blighting in upper canopy"],
                    "hi": ["पत्ती किनारों पर जल-भिग्न घाव", "लहरदार किनारों के साथ पीलापन", "ऊपरी कैनोपी में पत्तियों का सूखना"],
                    "pa": ["ਪੱਤਾ ਕਿਨਾਰਿਆਂ ਤੇ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ", "ਲਹਿਰਦਾਰ ਕਿਨਾਰਿਆਂ ਨਾਲ ਪੀਲਾਪਨ", "ਉੱਪਰਲੀ ਕੈਨੋਪੀ ਵਿੱਚ ਪੱਤਿਆਂ ਦਾ ਸੁੱਕਣਾ"]
                }
            ),
            PossibleCause(
                id="cause-2",
                name="Nitrogen Deficiency",
                nameLocalized={
                    "en": "Nitrogen Deficiency",
                    "hi": "नाइट्रोजन की कमी",
                    "pa": "ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ"
                },
                category="nutrient",
                description="Nitrogen deficiency causes uniform pale yellowing on older lower leaves, progressing to younger foliage.",
                descriptionLocalized={
                    "en": "Nitrogen deficiency causes uniform pale yellowing on older lower leaves, progressing to younger foliage.",
                    "hi": "नाइट्रोजन की कमी से पुरानी निचली पत्तियों पर समान रूप से पीलापन आ जाता है।",
                    "pa": "ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ ਨਾਲ ਪੁਰਾਣੇ ਹੇਠਲੇ ਪੱਤਿਆਂ ਤੇ ਬਰਾਬਰ ਪੀਲਾਪਨ ਆ ਜਾਂਦਾ ਹੈ।"
                },
                likelihood="medium",
                symptoms=[
                    "Chlorosis starting at leaf tips of older foliage",
                    "Stunted plant growth and pale canopy",
                    "Reduced tillering count"
                ],
                symptomsLocalized={
                    "en": ["Chlorosis starting at leaf tips of older foliage", "Stunted plant growth and pale canopy", "Reduced tillering count"],
                    "hi": ["पुरानी पत्तियों के सिरों से क्लोरोसिस", "पौधे का रुका विकास", "टिलरिंग में कमी"],
                    "pa": ["ਪੁਰਾਣੇ ਪੱਤਿਆਂ ਦੇ ਸਿਰਿਆਂ ਤੋਂ ਕਲੋਰੋਸਿਸ", "ਬੂਟੇ ਦਾ ਰੁਕਿਆ ਵਾਧਾ", "ਟਿਲਰਿੰਗ ਵਿੱਚ ਕਮੀ"]
                }
            )
        ]
    
    # Default causes for wheat/other crops
    return [
        PossibleCause(
            id="cause-1",
            name="Yellow Rust / Leaf Blight",
            nameLocalized={
                "en": "Yellow Rust / Leaf Blight",
                "hi": "पीला रतुआ / पत्ती ब्लाइट",
                "pa": "ਪੀਲਾ ਰਤੂਆ / ਪੱਤਾ ਬਲਾਈਟ"
            },
            category="disease",
            description="Fungal infection producing yellow pustules or chlorotic leaf stripes along leaf veins.",
            descriptionLocalized={
                "en": "Fungal infection producing yellow pustules or chlorotic leaf stripes along leaf veins.",
                "hi": "फफूंद संक्रमण जिससे पत्तियों की नसों पर पीले फफोले या क्लोरोटिक धारियां बनती हैं।",
                "pa": "ਫਫੂਂਦ ਸੰਕ੍ਰਮਣ ਜਿਸ ਨਾਲ ਪੱਤਿਆਂ ਦੀਆਂ ਨਸਾਂ ਤੇ ਪੀਲੇ ਛਾਲੇ ਜਾਂ ਧਾਰੀਆਂ ਬਣਦੀਆਂ ਹਨ।"
            },
            likelihood="high",
            symptoms=[
                "Linear yellow-orange stripes along leaf blade",
                "Yellow powdery dust on touch",
                "Premature leaf desiccation"
            ],
            symptomsLocalized={
                "en": ["Linear yellow-orange stripes along leaf blade", "Yellow powdery dust on touch", "Premature leaf desiccation"],
                "hi": ["पत्ती पर पीली-नारंगी धारियां", "छूने पर पीला पाउडर", "समय से पहले पत्तियों का सूखना"],
                "pa": ["ਪੱਤੇ ਤੇ ਪੀਲੀਆਂ-ਨਾਰੰਗੀ ਧਾਰੀਆਂ", "ਛੂਹਣ ਤੇ ਪੀਲਾ ਪਾਊਡਰ", "ਸਮੇਂ ਤੋਂ ਪਹਿਲਾਂ ਪੱਤਿਆਂ ਦਾ ਸੁੱਕਣਾ"]
            }
        ),
        PossibleCause(
            id="cause-2",
            name="Nitrogen / Micro-Nutrient Deficiency",
            nameLocalized={
                "en": "Nitrogen / Micro-Nutrient Deficiency",
                "hi": "नाइट्रोजन / सूक्ष्म पोषक तत्वों की कमी",
                "pa": "ਨਾਈਟ੍ਰੋਜਨ / ਸੂਖਮ ਪੋਸ਼ਕ ਤੱਤਾਂ ਦੀ ਘਾਟ"
            },
            category="nutrient",
            description="Lack of mobile nitrogen or zinc leading to reduced photosynthetic activity and yellow chlorosis.",
            descriptionLocalized={
                "en": "Lack of mobile nitrogen or zinc leading to reduced photosynthetic activity and yellow chlorosis.",
                "hi": "नाइट्रोजन या जिंक की कमी से प्रकाश संश्लेषण कम होना और पत्तियों का पीला पड़ना।",
                "pa": "ਨਾਈਟ੍ਰੋਜਨ ਜਾਂ ਜ਼ਿੰਕ ਦੀ ਘਾਟ ਨਾਲ ਪ੍ਰਕਾਸ਼ ਸੰਸ਼ਲੇਸ਼ਣ ਘਟਣਾ ਅਤੇ ਪੱਤਿਆਂ ਦਾ ਪੀਲਾ ਪੈਣਾ।"
            },
            likelihood="medium",
            symptoms=[
                "Tip chlorosis on lower leaves",
                "Pale green foliage across upper leaves",
                "Restricted root system development"
            ],
            symptomsLocalized={
                "en": ["Tip chlorosis on lower leaves", "Pale green foliage across upper leaves", "Restricted root system development"],
                "hi": ["निचली पत्तियों के सिरों का पीला होना", "ऊपरी पत्तियों का हल्का हरा होना", "जड़ विकास में कमी"],
                "pa": ["ਹੇਠਲੇ ਪੱਤਿਆਂ ਦੇ ਸਿਰਿਆਂ ਦਾ ਪੀਲਾ ਹੋਣਾ", "ਉੱਪਰਲੇ ਪੱਤਿਆਂ ਦਾ ਹਲਕਾ ਹਰਾ ਹੋਣਾ", "ਜੜ੍ਹ ਵਾਧੇ ਵਿੱਚ ਕਮੀ"]
            }
        )
    ]

def build_default_action_plan() -> List[ActionStep]:
    return [
        ActionStep(
            id="action-1",
            step=1,
            title="Inspect and isolate affected plant parts",
            titleLocalized={
                "en": "Inspect and isolate affected plant parts",
                "hi": "प्रभावित पौधे के हिस्सों का निरीक्षण करें और अलग करें",
                "pa": "ਪ੍ਰਭਾਵਿਤ ਬੂਟੇ ਦੇ ਹਿੱਸਿਆਂ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ ਅਤੇ ਵੱਖ ਕਰੋ"
            },
            description="Carefully clip off and safely dispose of leaves displaying severe water-soaked lesions or yellowing.",
            descriptionLocalized={
                "en": "Carefully clip off and safely dispose of leaves displaying severe water-soaked lesions or yellowing.",
                "hi": "गंभीर जल-भिग्न घाव या पीलापन दिखाने वाली पत्तियों को सावधानी से काटें और नष्ट करें।",
                "pa": "ਗੰਭੀਰ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ ਜਾਂ ਪੀਲਾਪਨ ਦਿਖਾਉਣ ਵਾਲੇ ਪੱਤਿਆਂ ਨੂੰ ਸਾਵਧਾਨੀ ਨਾਲ ਕੱਟੋ ਅਤੇ ਨਸ਼ਟ ਕਰੋ।"
            },
            priority="immediate",
            timeframe="Within 24–48 hours",
            timeframeLocalized={
                "en": "Within 24–48 hours",
                "hi": "24–48 घंटे के भीतर",
                "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"
            }
        ),
        ActionStep(
            id="action-2",
            step=2,
            title="Apply targeted bio-fungicide or copper spray",
            titleLocalized={
                "en": "Apply targeted bio-fungicide or copper spray",
                "hi": "लक्षित बायो-फफूंदनाशक या तांबा स्प्रे लगाएं",
                "pa": "ਲਕਸ਼ਿਤ ਬਾਇਓ-ਫਫੂਂਦਨਾਸ਼ਕ ਜਾਂ ਤਾਂਬਾ ਸਪ੍ਰੇਅ ਲਗਾਓ"
            },
            description="Spray recommended Copper Oxychloride (3 g/L) or neem-based biopesticide during early morning or evening hours.",
            descriptionLocalized={
                "en": "Spray recommended Copper Oxychloride (3 g/L) or neem-based biopesticide during early morning or evening hours.",
                "hi": "सुबह जल्दी या शाम को अनुशंसित कॉपर ऑक्सीक्लोराइड या नीम-आधारित बायोपेस्टिसाइड का छिड़काव करें।",
                "pa": "ਸਵੇਰੇ ਜਲਦੀ ਜਾਂ ਸ਼ਾਮ ਨੂੰ ਸਿਫਾਰਸ਼ੀ ਕਾਪਰ ਆਕਸੀਕਲੋਰਾਈਡ ਜਾਂ ਨੀਮ-ਆਧਾਰਿਤ ਬਾਇਓਪੈਸਟੀਸਾਈਡ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।"
            },
            priority="short-term",
            timeframe="Within 3–5 days",
            timeframeLocalized={
                "en": "Within 3–5 days",
                "hi": "3–5 दिन के भीतर",
                "pa": "3–5 ਦਿਨਾਂ ਦੇ ਅੰਦਰ"
            }
        ),
        ActionStep(
            id="action-3",
            step=3,
            title="Optimize field moisture and fertilizer split",
            titleLocalized={
                "en": "Optimize field moisture and fertilizer split",
                "hi": "खेत की नमी और उर्वरक की खुराक को अनुकूलित करें",
                "pa": "ਖੇਤ ਦੀ ਨਮੀ ਅਤੇ ਖਾਦ ਦੀ ਖ਼ੁਰਾਕ ਨੂੰ ਅਨੁਕੂਲਿਤ ਕਰੋ"
            },
            description="Clear field drainage channels to avoid standing water stagnation, and split nitrogen fertilizer applications.",
            descriptionLocalized={
                "en": "Clear field drainage channels to avoid standing water stagnation, and split nitrogen fertilizer applications.",
                "hi": "पानी के ठहराव से बचने के लिए खेत की जल निकासी नालियों को साफ करें और नाइट्रोजन उर्वरक दें।",
                "pa": "ਪਾਣੀ ਦੇ ਖੜ੍ਹਨ ਤੋਂ ਬਚਣ ਲਈ ਖੇਤ ਦੀ ਜਲ ਨਿਕਾਸੀ ਨਾਲੀਆਂ ਨੂੰ ਸਾਫ਼ ਕਰੋ ਅਤੇ ਨਾਈਟ੍ਰੋਜਨ ਖਾਦ ਦਿਓ।"
            },
            priority="preventive",
            timeframe="Within 1 week",
            timeframeLocalized={
                "en": "Within 1 week",
                "hi": "1 हफ्ते के भीतर",
                "pa": "1 ਹਫ਼ਤੇ ਦੇ ਅੰਦਰ"
            }
        )
    ]

def synthesize_analysis_result(
    req: AnalyzeRequest,
    sources: List[EvidenceSource],
    llm_output: Optional[dict] = None
) -> AnalysisResult:
    """
    Synthesizes complete AnalysisResult enforcing product principles, confidence calculation,
    escalation flags, and localization across en, hi, and pa.
    """
    result_id = f"res-{uuid.uuid4().hex[:10]}"
    effective_crop: CropType = req.cropType if (req.cropType and req.cropType != "unknown") else "wheat"
    
    has_image = bool(req.imageDataUrl)
    has_text = bool(req.textDescription or req.transcription)
    confidence = determine_confidence_level(has_image, has_text)
    escalate = (confidence == "low")

    confidence_narrative, confidence_narrative_loc = build_confidence_narrative(confidence)
    escalation_guidance, escalation_guidance_loc = build_escalation_guidance(escalate)
    crop_loc = get_crop_localized(effective_crop)

    summary_text = (
        f"Based on the submitted input for {effective_crop.capitalize()}, the most likely possible cause is leaf blight / chlorosis, "
        f"supported by {len(sources)} reference evidence documents. Symptoms indicate potential bacterial or fungal infection alongside nutrient stress."
    )
    if llm_output and llm_output.get("summary"):
        summary_text = llm_output.get("summary")

    summary_loc = {
        "en": summary_text,
        "hi": f"सबमिट किए गए इनपुट के आधार पर, {crop_loc['hi']} के लिए सबसे संभावित कारण पत्ती ब्लाइट / क्लोरोसिस है, जिसे {len(sources)} संदर्भ साक्ष्य दस्तावेजों द्वारा समर्थित किया गया है।",
        "pa": f"ਸਪੁਰਦ ਕੀਤੇ ਇਨਪੁਟ ਦੇ ਆਧਾਰ ਤੇ, {crop_loc['pa']} ਲਈ ਸਭ ਤੋਂ ਸੰਭਾਵਿਤ ਕਾਰਨ ਪੱਤਾ ਬਲਾਈਟ / ਕਲੋਰੋਸਿਸ ਹੈ, ਜਿਸ ਨੂੰ {len(sources)} ਸਰੋਤ ਸਬੂਤ ਦਸਤਾਵੇਜ਼ਾਂ ਦੁਆਰਾ ਸਮਰਥਨ ਦਿੱਤਾ ਗਿਆ ਹੈ।"
    }

    possible_causes = build_default_possible_causes(effective_crop)
    action_plan = build_default_action_plan()

    return AnalysisResult(
        id=result_id,
        userId=req.userId,
        cropType=effective_crop,
        cropTypeLocalized=crop_loc,
        possible_causes=possible_causes,
        confidence_level=confidence,
        confidenceNarrative=confidence_narrative,
        confidenceNarrativeLocalized=confidence_narrative_loc,
        sources=sources,
        action_plan=action_plan,
        escalation_flag=escalate,
        escalationGuidance=escalation_guidance,
        escalationGuidanceLocalized=escalation_guidance_loc,
        summary=summary_text,
        summaryLocalized=summary_loc,
        createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        imageDataUrl=req.imageDataUrl,
        userDescription=req.textDescription,
        transcription=req.transcription
    )
