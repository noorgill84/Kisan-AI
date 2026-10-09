import uuid
import datetime
import logging
import re
from typing import Optional, List, Dict, Tuple, Any
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

# ─── Knowledge Base Database & Topic Mapper for Dynamic RAG Synthesis ───

KB_DIAGNOSES: Dict[str, Dict[str, Any]] = {
    "rice_bacterial_leaf_blight": {
        "id": "kb-rice-blb",
        "keywords": ["rice", "bacterial", "blight", "paddy", "xanthomonas", "lesion", "wavy", "water-soaked"],
        "cause": PossibleCause(
            id="cause-rice-blb",
            name="Bacterial Leaf Blight (Xanthomonas oryzae)",
            nameLocalized={
                "en": "Bacterial Leaf Blight (Xanthomonas oryzae)",
                "hi": "जीवाणु पत्ती ब्लाइट (ज़ैंथोमोनास ओराइज़ी)",
                "pa": "ਬੈਕਟੀਰੀਆ ਪੱਤਾ ਬਲਾਈਟ (ਜ਼ੈਂਥੋਮੋਨਾਸ ਓਰਾਈਜ਼ੀ)"
            },
            category="disease",
            description="Bacterial leaf blight causes water-soaked lesions on leaf margins that coalesce into yellow and straw-colored drying stripes.",
            descriptionLocalized={
                "en": "Bacterial leaf blight causes water-soaked lesions on leaf margins that coalesce into yellow and straw-colored drying stripes.",
                "hi": "जीवाणु पत्ती ब्लाइट से पत्तियों के किनारों पर जल-भिग्न घाव होते हैं जो फैलकर पीले और भूसे के रंग की धारियों में बदल जाते हैं।",
                "pa": "ਬੈਕਟੀਰੀਆ ਪੱਤਾ ਬਲਾਈਟ ਨਾਲ ਪੱਤਿਆਂ ਦੇ ਕਿਨਾਰਿਆਂ ਤੇ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ ਹੁੰਦੇ ਹਨ ਜੋ ਫੈਲ ਕੇ ਪੀਲੇ ਅਤੇ ਤੂੜੀ ਦੇ ਰੰਗ ਦੀਆਂ ਧਾਰੀਆਂ ਵਿੱਚ ਬਦਲ ਜਾਂਦੇ ਹਨ।"
            },
            likelihood="high",
            symptoms=[
                "Water-soaked lesions on leaf margins with wavy edges",
                "Lesions turn yellow to white-grayish as leaf dries",
                "Bacterial ooze droplets visible under high humidity"
            ],
            symptomsLocalized={
                "en": ["Water-soaked lesions on leaf margins with wavy edges", "Lesions turn yellow to white-grayish as leaf dries", "Bacterial ooze droplets visible under high humidity"],
                "hi": ["पत्ती किनारों पर जल-भिग्न घाव", "पत्तियां सूखने पर पीली से सफेद-सलेटी होना", "उच्च आर्द्रता में जीवाणु रिसाव की बूंदें"],
                "pa": ["ਪੱਤਾ ਕਿਨਾਰਿਆਂ ਤੇ ਜਲ-ਭਿੱਗ ਜ਼ਖ਼ਮ", "ਪੱਤੇ ਸੁੱਕਣ ਤੇ ਪੀਲੇ ਤੋਂ ਚਿੱਟੇ-ਲੇਟੀ ਹੋਣਾ", "ਉੱਚ ਨਮੀ ਵਿੱਚ ਬੈਕਟੀਰੀਆ ਰਿਸਾਅ ਦੀਆਂ ਬੂੰਦਾਂ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-blb-1", step=1,
                title="Drain field water and split nitrogen applications",
                titleLocalized={"en": "Drain field water and split nitrogen applications", "hi": "खेत का पानी निकालें और नाइट्रोजन की खुराक बांटें", "pa": "ਖੇਤ ਦਾ ਪਾਣੀ ਕੱਢੋ ਅਤੇ ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਖ਼ੁਰਾਕ ਵੰਡੋ"},
                description="Avoid excess nitrogen fertilizer. Temporarily drain stagnant water to restrict bacterial multiplication.",
                descriptionLocalized={"en": "Avoid excess nitrogen fertilizer. Temporarily drain stagnant water to restrict bacterial multiplication.", "hi": "अत्यधिक नाइट्रोजन उर्वरक से बचें। जीवाणु प्रसार को रोकने के लिए अस्थायी रूप से स्थिर पानी निकालें।", "pa": "ਬਹੁਤ ਜ਼ਿਆਦਾ ਨਾਈਟ੍ਰੋਜਨ ਤੋਂ ਬਚੋ। ਬੈਕਟੀਰੀਆ ਦੇ ਫੈਲਾਅ ਨੂੰ ਰੋਕਣ ਲਈ ਅਸਥਾਈ ਤੌਰ ਤੇ ਖੜ੍ਹਾ ਪਾਣੀ ਕੱਢੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            ),
            ActionStep(
                id="act-blb-2", step=2,
                title="Apply Copper Oxychloride bactericide spray",
                titleLocalized={"en": "Apply Copper Oxychloride bactericide spray", "hi": "कॉपर ऑक्सीक्लोराइड जीवाणुनाशक स्प्रे करें", "pa": "ਕਾਪਰ ਆਕਸੀਕਲੋਰਾਈਡ ਬੈਕਟੀਰੀਸਾਈਡ ਸਪ੍ਰੇਅ ਕਰੋ"},
                description="Spray Copper Oxychloride (3 g/L) combined with Streptocycline (0.15 g/L) on early stage lesions.",
                descriptionLocalized={"en": "Spray Copper Oxychloride (3 g/L) combined with Streptocycline (0.15 g/L) on early stage lesions.", "hi": "शुरुआती लक्षणों पर कॉपर ऑक्सीक्लोराइड (3 ग्राम/लीटर) और स्ट्रैप्टोसाइक्लिन का छिड़काव करें।", "pa": "ਸ਼ੁਰੂਆਤੀ ਲੱਛਣਾਂ ਤੇ ਕਾਪਰ ਆਕਸੀਕਲੋਰਾਈਡ (3 ਗ੍ਰਾਮ/ਲੀਟਰ) ਅਤੇ ਸਟ੍ਰੈਪਟੋਸਾਈਕਲਿਨ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।"},
                priority="short-term", timeframe="Within 3–5 days",
                timeframeLocalized={"en": "Within 3–5 days", "hi": "3–5 दिन के भीतर", "pa": "3–5 ਦਿਨਾਂ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "rice_blast": {
        "id": "kb-rice-blast",
        "keywords": ["blast", "spindle", "diamond", "pyricularia", "magnaporthe", "neck blast", "whiteheads"],
        "cause": PossibleCause(
            id="cause-rice-blast",
            name="Rice Blast Disease (Magnaporthe oryzae)",
            nameLocalized={
                "en": "Rice Blast Disease (Magnaporthe oryzae)",
                "hi": "चावल का ब्लास्ट रोग (मैग्नापोर्थे ओराइज़ी)",
                "pa": "ਚੌਲਾਂ ਦਾ ਬਲਾਸਟ ਰੋਗ (ਮੈਗਨਾਪੋਰਥੇ ਓਰਾਈਜ਼ੀ)"
            },
            category="disease",
            description="Rice blast is a serious fungal disease forming spindle-shaped lesions with whitish-gray centers and dark brown margins.",
            descriptionLocalized={
                "en": "Rice blast is a serious fungal disease forming spindle-shaped lesions with whitish-gray centers and dark brown margins.",
                "hi": "चावल का ब्लास्ट एक गंभीर फफूंद रोग है जो भूरे किनारों और सफेद-ग्रे केंद्र वाले तकला-आकार (spindle-shaped) के घाव बनाता है।",
                "pa": "ਚੌਲਾਂ ਦਾ ਬਲਾਸਟ ਇੱਕ ਗੰਭੀਰ ਫਫੂਂਦ ਰੋਗ ਹੈ ਜੋ ਭੂਰੇ ਕਿਨਾਰਿਆਂ ਅਤੇ ਚਿੱਟੇ-ਗ੍ਰੇ ਕੇਂਦਰ ਵਾਲੇ ਸਪਿੰਡਲ-ਆਕਾਰ ਦੇ ਜ਼ਖ਼ਮ ਬਣਾਉਂਦਾ ਹੈ।"
            },
            likelihood="high",
            symptoms=[
                "Spindle-shaped eye spots on leaf blades with gray centers",
                "Lesions enlarge causing leaves to wither and burn",
                "Dark neck rot causing panicle collapse ('whiteheads')"
            ],
            symptomsLocalized={
                "en": ["Spindle-shaped eye spots on leaf blades with gray centers", "Lesions enlarge causing leaves to wither and burn", "Dark neck rot causing panicle collapse ('whiteheads')"],
                "hi": ["पत्तियों पर ग्रे केंद्र वाले तकला-आकार के धब्बे", "घाव बढ़ने से पत्तियों का सूखना और जलना", "गर्दन का काला पड़ना जिससे बालियां गिर जाती हैं"],
                "pa": ["ਪੱਤਿਆਂ ਤੇ ਗ੍ਰੇ ਕੇਂਦਰ ਵਾਲੇ ਸਪਿੰਡਲ-ਆਕਾਰ ਦੇ ਧੱਬੇ", "ਜ਼ਖ਼ਮ ਵਧਣ ਨਾਲ ਪੱਤਿਆਂ ਦਾ ਸੁੱਕਣਾ", "ਗਰਦਨ ਦਾ ਕਾਲਾ ਪੈਣਾ ਜਿਸ ਨਾਲ ਬਾਲੀਆਂ ਡਿੱਗ ਜਾਂਦੀਆਂ ਹਨ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-blast-1", step=1,
                title="Spray Tricyclazole 75 WP bio-fungicide",
                titleLocalized={"en": "Spray Tricyclazole 75 WP bio-fungicide", "hi": "ट्राइसाइक्लाज़ोल 75 WP फफूंदनाशक का छिड़काव करें", "pa": "ਟ੍ਰਾਈਸਾਈਕਲਾਜ਼ੋਲ 75 WP ਫਫੂਂਦਨਾਸ਼ਕ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ"},
                description="Apply Tricyclazole 75 WP (0.6 g/L water) or Isoprothiolane 40 EC at first appearance of blast eye-spots.",
                descriptionLocalized={"en": "Apply Tricyclazole 75 WP (0.6 g/L water) or Isoprothiolane 40 EC at first appearance of blast eye-spots.", "hi": "ब्लास्ट के धब्बे दिखते ही ट्राइसाइक्लाज़ोल 75 WP (0.6 ग्राम/लीटर) का छिड़काव करें।", "pa": "ਬਲਾਸਟ ਦੇ ਧੱਬੇ ਦਿਸਦਿਆਂ ਹੀ ਟ੍ਰਾਈਸਾਈਕਲਾਜ਼ੋਲ 75 WP (0.6 ਗ੍ਰਾਮ/ਲੀਟਰ) ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "maize_fall_armyworm": {
        "id": "kb-maize-faw",
        "keywords": ["armyworm", "maize", "corn", "whorl", "frass", "sawdust", "holes", "caterpillar", "spodoptera"],
        "cause": PossibleCause(
            id="cause-maize-faw",
            name="Fall Armyworm (Spodoptera frugiperda)",
            nameLocalized={
                "en": "Fall Armyworm (Spodoptera frugiperda)",
                "hi": "फॉलबैक आर्मीडर्म / लट (स्पोडोप्टेरा फ्रूगीपर्दा)",
                "pa": "ਫਾਲ ਆਰਮੀਵਰਮ / ਸੁੰਡੀ (ਸਪੋਡੋਪਟੇਰਾ ਫ੍ਰੂਗੀਪਰਡਾ)"
            },
            category="pest",
            description="Fall Armyworm larvae bore into maize leaf whorls, feeding aggressively and leaving ragged holes and sawdust-like frass excrement.",
            descriptionLocalized={
                "en": "Fall Armyworm larvae bore into maize leaf whorls, feeding aggressively and leaving ragged holes and sawdust-like frass excrement.",
                "hi": "फॉल आर्मीडर्म की लटें मक्का के पोंगे (whorl) में घुसकर पत्तियों को खाती हैं, जिससे कटे-फटे छेद और लकड़ी के बुरादे जैसा मल जमा होता है।",
                "pa": "ਫਾਲ ਆਰਮੀਵਰਮ ਦੀਆਂ ਸੁੰਡੀਆਂ ਮੱਕੀ ਦੇ ਪੋਂਗੇ ਵਿੱਚ ਵੜ ਕੇ ਪੱਤਿਆਂ ਨੂੰ ਖਾਂਦੀਆਂ ਹਨ, ਜਿਸ ਨਾਲ ਫਟੇ ਹੋਏ ਛੇਕ ਅਤੇ ਲੱਕੜ ਦੇ ਬੁਰਾਦੇ ਵਰਗਾ ਮਲ ਜਮ੍ਹਾਂ ਹੁੰਦਾ ਹੈ।"
            },
            likelihood="high",
            symptoms=[
                "Ragged, irregular holes and torn margins on central whorl leaves",
                "Accumulation of moist sawdust-like frass inside whorls",
                "Larvae with distinct inverted Y-mark on head capsule"
            ],
            symptomsLocalized={
                "en": ["Ragged, irregular holes and torn margins on central whorl leaves", "Accumulation of moist sawdust-like frass inside whorls", "Larvae with distinct inverted Y-mark on head capsule"],
                "hi": ["केंद्रीय पोंगे की पत्तियों पर अनियमित कटे-फटे छेद", "पोंगे के अंदर गीले बुरादे जैसा मल जमा होना", "सिर पर उल्टे Y के निशान वाली हरी-भूरी लटें"],
                "pa": ["ਕੇਂਦਰੀ ਪੋਂਗੇ ਦੇ ਪੱਤਿਆਂ ਤੇ ਅਨਿਯਮਿਤ ਫਟੇ ਹੋਏ ਛੇਕ", "ਪੋਂਗੇ ਦੇ ਅੰਦਰ ਗਿੱਲੇ ਬੁਰਾਦੇ ਵਰਗਾ ਮਲ ਜਮ੍ਹਾਂ ਹੋਣਾ", "ਸਿਰ ਤੇ ਉਲਟੇ Y ਦੇ ਨਿਸ਼ਾਨ ਵਾਲੀਆਂ ਸੁੰਡੀਆਂ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-faw-1", step=1,
                title="Apply Chlorantraniliprole or Emamectin Benzoate directly into whorls",
                titleLocalized={"en": "Apply Chlorantraniliprole or Emamectin Benzoate directly into whorls", "hi": "पोंगे में सीधे क्लोरैंट्रानिप्रोल या एमामेक्टिन बेंजोएट डालें", "pa": "ਪੋਂਗੇ ਵਿੱਚ ਸਿੱਧਾ ਕਲੋਰੈਂਟ੍ਰਾਨੀਪ੍ਰੋਲ ਜਾਂ ਐਮਾਮੈਕਟਿਨ ਬੈਂਜੋਏਟ ਪਾਓ"},
                description="Direct spray nozzle into crop central whorls using Chlorantraniliprole 18.5 SC (0.4 mL/L) or Emamectin Benzoate 5 SG (0.4 g/L).",
                descriptionLocalized={"en": "Direct spray nozzle into crop central whorls using Chlorantraniliprole 18.5 SC (0.4 mL/L) or Emamectin Benzoate 5 SG (0.4 g/L).", "hi": "पोंगे के अंदर स्प्रे नोजल से क्लोरैंट्रानिप्रोल (0.4 मिली/लीटर) या एमामेक्टिन बेंजोएट (0.4 ग्राम/लीटर) का छिड़काव करें।", "pa": "ਪੋਂਗੇ ਦੇ ਅੰਦਰ ਸਪ੍ਰੇਅ ਨੋਜ਼ਲ ਨਾਲ ਕਲੋਰੈਂਟ੍ਰਾਨੀਪ੍ਰੋਲ ਜਾਂ ਐਮਾਮੈਕਟਿਨ ਬੈਂਜੋਏਟ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            ),
            ActionStep(
                id="act-faw-2", step=2,
                title="Deploy Pheromone Traps and Neem Cake application",
                titleLocalized={"en": "Deploy Pheromone Traps and Neem Cake application", "hi": "फेरोमोन ट्रैप लगाएं और नीम केक का उपयोग करें", "pa": "ਫੇਰੋਮੋਨ ਟ੍ਰੈਪ ਲਗਾਓ ਅਤੇ ਨੀਮ ਕੇਕ ਵਰਤੋ"},
                description="Install 4-5 FAW pheromone traps per acre for adult moth monitoring. Drop sand-neem powder mix into whorls.",
                descriptionLocalized={"en": "Install 4-5 FAW pheromone traps per acre for adult moth monitoring. Drop sand-neem powder mix into whorls.", "hi": "नर पतंगों की निगरानी के लिए प्रति एकड़ 4-5 फेरोमोन ट्रैप लगाएं। पोंगे में रेत और नीम पाउडर का मिश्रण डालें।", "pa": "ਨਰ ਪਤੰਗਾਂ ਦੀ ਨਿਗਰਾਨੀ ਲਈ 4-5 ਫੇਰੋਮੋਨ ਟ੍ਰੈਪ ਲਗਾਓ। ਪੋਂਗੇ ਵਿੱਚ ਰੇਤ-ਨੀਮ ਪਾਊਡਰ ਪਾਓ।"},
                priority="short-term", timeframe="Within 3–5 days",
                timeframeLocalized={"en": "Within 3–5 days", "hi": "3–5 दिन के भीतर", "pa": "3–5 ਦਿਨਾਂ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "wheat_yellow_rust": {
        "id": "kb-wheat-rust",
        "keywords": ["rust", "yellow rust", "stripe rust", "wheat", "puccinia", "pustule", "powder", "stripes"],
        "cause": PossibleCause(
            id="cause-wheat-rust",
            name="Yellow Rust / Stripe Rust (Puccinia striiformis)",
            nameLocalized={
                "en": "Yellow Rust / Stripe Rust (Puccinia striiformis)",
                "hi": "पीला रतुआ / स्ट्राइप रस्ट (पक्सीनिया स्ट्राइफोर्मिस)",
                "pa": "ਪੀਲਾ ਰਤੂਆ / ਸਟ੍ਰਾਈਪ ਰਤੂਆ (ਪਕਸੀਨੀਆ ਸਟ੍ਰਾਈਫੋਰਮਿਸ)"
            },
            category="disease",
            description="Yellow rust manifests as linear bright yellow pustule stripes along leaf veins that release yellow powdery spores upon touch.",
            descriptionLocalized={
                "en": "Yellow rust manifests as linear bright yellow pustule stripes along leaf veins that release yellow powdery spores upon touch.",
                "hi": "पीला रतुआ पत्तियों की नसों के साथ चमकीली पीली फफोलेदार धारियों के रूप में दिखाई देता है, जिन्हें छूने पर पीला पाउडर निकलता है।",
                "pa": "ਪੀਲਾ ਰਤੂਆ ਪੱਤਿਆਂ ਦੀਆਂ ਨਸਾਂ ਨਾਲ ਚਮਕੀਲੀਆਂ ਪੀਲੀਆਂ ਛਾਲੇਦਾਰ ਧਾਰੀਆਂ ਵਜੋਂ ਦਿਸਦਾ ਹੈ, ਜਿਨ੍ਹਾਂ ਨੂੰ ਛੂਹਣ ਤੇ ਪੀਲਾ ਪਾਊਡਰ ਨਿਕਲਦਾ ਹੈ।"
            },
            likelihood="high",
            symptoms=[
                "Parallel bright yellow pustule stripes along leaf blade length",
                "Yellow orange powder rubs off onto fingers or clothing",
                "Severe foliage desiccation turning necrotic brown"
            ],
            symptomsLocalized={
                "en": ["Parallel bright yellow pustule stripes along leaf blade length", "Yellow orange powder rubs off onto fingers or clothing", "Severe foliage desiccation turning necrotic brown"],
                "hi": ["पत्तियों पर समानांतर चमकीली पीली धारियां", "उंगलियों या कपड़ों पर पीला-नारंगी पाउडर लगना", "पत्तियों का अत्यधिक सूखना और भूरा पड़ना"],
                "pa": ["ਪੱਤਿਆਂ ਤੇ ਸਮਾਨਾਂਤਰ ਚਮਕੀਲੀਆਂ ਪੀਲੀਆਂ ਧਾਰੀਆਂ", "ਉਂਗਲਾਂ ਤੇ ਪੀਲਾ-ਨਾਰੰਗੀ ਪਾਊਡਰ ਲੱਗਣਾ", "ਪੱਤਿਆਂ ਦਾ ਸੁੱਕਣਾ ਅਤੇ ਭੂਰਾ ਪੈਣਾ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-rust-1", step=1,
                title="Apply Propiconazole 25 EC or Tebuconazole fungicide spray",
                titleLocalized={"en": "Apply Propiconazole 25 EC or Tebuconazole fungicide spray", "hi": "प्रोपिकोनाज़ोल 25 EC या टेबुकोनाज़ोल का छिड़काव करें", "pa": "ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25 EC ਜਾਂ ਟੈਬੂਕੋਨਾਜ਼ੋਲ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ"},
                description="Spray Propiconazole 25 EC (1 mL/L water) or Tebuconazole 259 EC immediately upon detection of yellow pustule patches.",
                descriptionLocalized={"en": "Spray Propiconazole 25 EC (1 mL/L water) or Tebuconazole 259 EC immediately upon detection of yellow pustule patches.", "hi": "पीले रतुए के पैच दिखते ही प्रोपिकोनाज़ोल 25 EC (1 मिली/लीटर) का तुरंत छिड़काव करें।", "pa": "ਪੀਲੇ ਰਤੂਏ ਦੇ ਧੱਬੇ ਦਿਸਦਿਆਂ ਹੀ ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25 EC (1 ਮਿਲੀ/ਲੀਟਰ) ਦਾ ਤੁਰੰਤ ਸਪ੍ਰੇਅ ਕਰੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "cotton_whitefly": {
        "id": "kb-cotton-whitefly",
        "keywords": ["cotton", "whitefly", "bemisia", "leaf curl", "virus", "sticky", "honeydew", "sooty mold"],
        "cause": PossibleCause(
            id="cause-cotton-whitefly",
            name="Cotton Whitefly & Leaf Curl Virus (Bemisia tabaci)",
            nameLocalized={
                "en": "Cotton Whitefly & Leaf Curl Virus (Bemisia tabaci)",
                "hi": "कपास की सफेद मक्खी एवं लीफ कर्ल वायरस (बेमिसिया तबाची)",
                "pa": "ਕਪਾਹ ਦੀ ਚਿੱਟੀ ਮੱਖੀ ਅਤੇ ਲੀਫ਼ ਕਰਲ ਵਾਇਰਸ (ਬੇਮੀਸੀਆ ਤਬਾਚੀ)"
            },
            category="pest",
            description="Whiteflies suck sap from underside of cotton leaves, excreting sticky honeydew (sooty mold) and transmitting Cotton Leaf Curl Virus.",
            descriptionLocalized={
                "en": "Whiteflies suck sap from underside of cotton leaves, excreting sticky honeydew (sooty mold) and transmitting Cotton Leaf Curl Virus.",
                "hi": "सफेद मक्खी पत्तियों की निचली सतह से रस चूसती है, चिपचिपा हनीड्यू (काला कवक) छोड़ती है और कॉटन लीफ कर्ल वायरस फैलाती है।",
                "pa": "ਚਿੱਟੀ ਮੱਖੀ ਪੱਤਿਆਂ ਦੀ ਹੇਠਲੀ ਸਤਹ ਤੋਂ ਰਸ ਚੂਸਦੀ ਹੈ, ਚਿਪਚਿਪਾ ਹਨੀਡਿਊ ਛੱਡਦੀ ਹੈ ਅਤੇ ਕਪਾਹ ਲੀਫ਼ ਕਰਲ ਵਾਇਰਸ ਫੈਲਾਉਂਦੀ ਹੈ।"
            },
            likelihood="high",
            symptoms=[
                "Small white flying insects congregating under leaf surfaces",
                "Upward curling and thickening of leaf veins",
                "Black sooty mold covering leaf surfaces due to honeydew"
            ],
            symptomsLocalized={
                "en": ["Small white flying insects congregating under leaf surfaces", "Upward curling and thickening of leaf veins", "Black sooty mold covering leaf surfaces due to honeydew"],
                "hi": ["पत्तियों के नीचे छोटे सफेद उड़ने वाले कीड़े", "पत्तियों का ऊपर की ओर मुड़ना और नसों का मोटा होना", "हनीड्यू के कारण पत्तियों पर काला कवक जमा होना"],
                "pa": ["ਪੱਤਿਆਂ ਦੇ ਹੇਠਾਂ ਛੋਟੇ ਚਿੱਟੇ ਉੱਡਣ ਵਾਲੇ ਕੀੜੇ", "ਪੱਤਿਆਂ ਦਾ ਉੱਪਰ ਵੱਲ ਮੁੜਨਾ", "ਹਨੀਡਿਊ ਕਰਕੇ ਪੱਤਿਆਂ ਤੇ ਕਾਲੀ ਫਫੂਂਦੀ ਜਮ੍ਹਾਂ ਹੋਣਾ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-wf-1", step=1,
                title="Install Yellow Sticky Traps and spray Neem Oil",
                titleLocalized={"en": "Install Yellow Sticky Traps and spray Neem Oil", "hi": "पीले स्टिकी ट्रैप लगाएं और नीम तेल का छिड़काव करें", "pa": "ਪੀਲੇ ਸਟਿੱਕੀ ਟ੍ਰੈਪ ਲਗਾਓ ਅਤੇ ਨੀਮ ਤੇਲ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ"},
                description="Set up 8-10 yellow sticky traps per acre. Spray Neem oil (10,000 ppm @ 3 mL/L) or Afidopyropen 50 g/L.",
                descriptionLocalized={"en": "Set up 8-10 yellow sticky traps per acre. Spray Neem oil (10,000 ppm @ 3 mL/L) or Afidopyropen 50 g/L.", "hi": "प्रति एकड़ 8-10 पीले स्टिकी ट्रैप लगाएं। नीम तेल (10,000 ppm @ 3 मिली/लीटर) का छिड़काव करें।", "pa": "8-10 ਪੀਲੇ ਸਟਿੱਕੀ ਟ੍ਰੈਪ ਲਗਾਓ। ਨੀਮ ਤੇਲ (3 ਮਿਲੀ/ਲੀਟਰ) ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "sugarcane_red_rot": {
        "id": "kb-sugarcane-redrot",
        "keywords": ["sugarcane", "red rot", "colletotrichum", "stalk", "alcoholic", "reddening", "wither"],
        "cause": PossibleCause(
            id="cause-sugarcane-redrot",
            name="Sugarcane Red Rot (Colletotrichum falcatum)",
            nameLocalized={
                "en": "Sugarcane Red Rot (Colletotrichum falcatum)",
                "hi": "गन्ने का लाल सड़न रोग (रेड रॉट)",
                "pa": "ਗੰਨੇ ਦਾ ਲਾਲ ਸੜਨ ਰੋਗ (ਰੇਡ ਰੋਟ)"
            },
            category="disease",
            description="Red rot causes internal stalk tissues to turn red with crosswise white patches and distinct alcoholic odor upon splitting.",
            descriptionLocalized={
                "en": "Red rot causes internal stalk tissues to turn red with crosswise white patches and distinct alcoholic odor upon splitting.",
                "hi": "लाल सड़न रोग से तने का आंतरिक ऊतक लाल हो जाता है, जिस पर सफेद चकत्ते और चीरने पर शराबी गंध आती है।",
                "pa": "ਲਾਲ ਸੜਨ ਰੋਗ ਨਾਲ ਤਣੇ ਦਾ ਅੰਦਰੂਨੀ ਹਿੱਸਾ ਲਾਲ ਹੋ ਜਾਂਦਾ ਹੈ ਜਿਸ ਵਿੱਚ ਚਿੱਟੇ ਧੱਬੇ ਅਤੇ ਸ਼ਰਾਬ ਵਰਗੀ ਬੂ ਆਉਂਦੀ ਹੈ।"
            },
            likelihood="high",
            symptoms=[
                "Yellowing and drooping of third and fourth leaves",
                "Stalk splitting reveals red vascular tissues with white transverse spots",
                "Sour alcoholic odor emitted from affected stalks"
            ],
            symptomsLocalized={
                "en": ["Yellowing and drooping of third and fourth leaves", "Stalk splitting reveals red vascular tissues with white transverse spots", "Sour alcoholic odor emitted from affected stalks"],
                "hi": ["तीसरी और चौथी पत्तियों का पीला पड़ना और झुकना", "तने को फाड़ने पर लाल ऊतक और सफेद चकत्ते दिखना", "खट्टी शराबी गंध निकलना"],
                "pa": ["ਤੀਜੀ ਅਤੇ ਚੌਥੀ ਪੱਤੀ ਦਾ ਪੀਲਾ ਪੈਣਾ", "ਤਣਾ ਪਾੜਨ ਤੇ ਲਾਲ ਹਿੱਸਾ ਅਤੇ ਚਿੱਟੇ ਧੱਬੇ ਦਿਸਣਾ", "ਖੱਟੀ ਸ਼ਰਾਬ ਵਰਗੀ ਬੂ ਨਿਕਲਣਾ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-redrot-1", step=1,
                title="Uproot and burn affected clumps immediately",
                titleLocalized={"en": "Uproot and burn affected clumps immediately", "hi": "प्रभावित गन्ने के पौधों को उखाड़कर जलाएं", "pa": "ਪ੍ਰਭਾਵਿਤ ਗੰਨੇ ਦੇ ਬੂਟਿਆਂ ਨੂੰ ਪੁੱਟ ਕੇ ਸਾੜੋ"},
                description="Rogue out diseased clumps including roots to prevent soilborne fungal spore contamination to neighboring stools.",
                descriptionLocalized={"en": "Rogue out diseased clumps including roots to prevent soilborne fungal spore contamination to neighboring stools.", "hi": "संक्रमण रोकने के लिए जड़ों सहित रोगी पौधों को उखाड़कर तुरंत नष्ट करें।", "pa": "ਛੂਤ ਰੋਕਣ ਲਈ ਜੜ੍ਹਾਂ ਸਮੇਤ ਰੋਗੀ ਬੂਟਿਆਂ ਨੂੰ ਪੁੱਟ ਕੇ ਤੁਰੰਤ ਨਸ਼ਟ ਕਰੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "tomato_late_blight": {
        "id": "kb-tomato-lateblight",
        "keywords": ["tomato", "late blight", "phytophthora", "water-soaked", "white mold", "fruit rot"],
        "cause": PossibleCause(
            id="cause-tomato-lateblight",
            name="Tomato Late Blight (Phytophthora infestans)",
            nameLocalized={
                "en": "Tomato Late Blight (Phytophthora infestans)",
                "hi": "टमाटर का पछेती झुलसा (लेट ब्लाइट)",
                "pa": "ਟਮਾਟਰ ਦਾ ਪਛੇਤੀ ਝੁਲਸ (ਲੇਟ ਬਲਾਈਟ)"
            },
            category="disease",
            description="Late blight spreads rapidly in cool moist weather, creating large dark water-soaked leaf lesions with white fungal fuzz on undersides.",
            descriptionLocalized={
                "en": "Late blight spreads rapidly in cool moist weather, creating large dark water-soaked leaf lesions with white fungal fuzz on undersides.",
                "hi": "पछेती झुलसा ठंडे और नम मौसम में तेजी से फैलता है, जिससे पत्तियों पर काले जल-भिग्न घाव और नीचे सफेद फफूंद जमती है।",
                "pa": "ਪਛੇਤੀ ਝੁਲਸ ਠੰਡੇ ਅਤੇ ਨਮ ਮੌਸਮ ਵਿੱਚ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਪੱਤਿਆਂ ਤੇ ਕਾਲੇ ਜ਼ਖ਼ਮ ਅਤੇ ਹੇਠਾਂ ਚਿੱਟੀ ਫਫੂਂਦੀ ਜਮ੍ਹਾਂ ਹੁੰਦੀ ਹੈ।"
            },
            likelihood="high",
            symptoms=[
                "Large irregular dark water-soaked lesions on foliage and stems",
                "White cottony fungal growth on underside of leaves in morning dew",
                "Firm brown greasy decay on green and ripening fruits"
            ],
            symptomsLocalized={
                "en": ["Large irregular dark water-soaked lesions on foliage and stems", "White cottony fungal growth on underside of leaves in morning dew", "Firm brown greasy decay on green and ripening fruits"],
                "hi": ["पत्तियों और तनों पर बड़े काले जल-भिग्न घाव", "सुबह की ओस में पत्तियों के नीचे सफेद सूती फफूंद", "फल पर सख्त भूरा सड़न"],
                "pa": ["ਪੱਤਿਆਂ ਅਤੇ ਤਣਿਆਂ ਤੇ ਵੱਡੇ ਕਾਲੇ ਜ਼ਖ਼ਮ", "ਸਵੇਰ ਦੀ ਓਸ ਵਿੱਚ ਪੱਤਿਆਂ ਹੇਠ ਚਿੱਟੀ ਫਫੂਂਦੀ", "ਫਲ ਤੇ ਭੂਰਾ ਸੜਨ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-tlb-1", step=1,
                title="Apply Cymoxanil + Mancozeb or Ridomil Gold spray",
                titleLocalized={"en": "Apply Cymoxanil + Mancozeb or Ridomil Gold spray", "hi": "साइमोक्सानिल + मैंकोज़ेब का छिड़काव करें", "pa": "ਸਾਈਮੋਕਸਾਨਿਲ + ਮੈਂਕੋਜ਼ੇਬ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ"},
                description="Spray Cymoxanil + Mancozeb (2 g/L) or Metalaxyl + Mancozeb (Ridomil Gold 2.5 g/L) thoroughly over foliage.",
                descriptionLocalized={"en": "Spray Cymoxanil + Mancozeb (2 g/L) or Metalaxyl + Mancozeb (Ridomil Gold 2.5 g/L) thoroughly over foliage.", "hi": "पत्तियों पर साइमोक्सानिल + मैंकोज़ेब (2 ग्राम/लीटर) या रिडोमिल गोल्ड का अच्छी तरह छिड़काव करें।", "pa": "ਪੱਤਿਆਂ ਤੇ ਸਾਈਮੋਕਸਾਨਿਲ + ਮੈਂਕੋਜ਼ੇਬ (2 ਗ੍ਰਾਮ/ਲੀਟਰ) ਦਾ ਚੰਗੀ ਤਰ੍ਹਾਂ ਸਪ੍ਰੇਅ ਕਰੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "potato_soft_rot": {
        "id": "kb-potato-softrot",
        "keywords": ["potato", "soft rot", "pectobacterium", "erwinia", "foul", "mushy", "tuber"],
        "cause": PossibleCause(
            id="cause-potato-softrot",
            name="Potato Soft Rot (Pectobacterium carotovorum)",
            nameLocalized={
                "en": "Potato Soft Rot (Pectobacterium carotovorum)",
                "hi": "आलू का मृदु सड़न (सॉफ्ट रॉट)",
                "pa": "ਆਲੂ ਦਾ ਮ੍ਰਿਦੂ ਸੜਨ (ਸਾਫ਼ਟ ਰੋਟ)"
            },
            category="disease",
            description="Bacterial soft rot dissolves potato tuber cell walls, turning internal flesh into a foul-smelling, watery mushy mass.",
            descriptionLocalized={
                "en": "Bacterial soft rot dissolves potato tuber cell walls, turning internal flesh into a foul-smelling, watery mushy mass.",
                "hi": "जीवाणु सॉफ्ट रॉट आलू के कंद की कोशिकाओं को घोल देता है, जिससे आलू का गूदा दुर्गंधयुक्त, पानीदार गुदे में बदल जाता है।",
                "pa": "ਬੈਕਟੀਰੀਅਲ ਸਾਫ਼ਟ ਰੋਟ ਆਲੂ ਦੇ ਗੂਦੇ ਨੂੰ ਬਦਬੂਦਾਰ, ਪਾਣੀਦਾਰ ਮਲਬੇ ਵਿੱਚ ਬਦਲ ਦਿੰਦਾ ਹੈ।"
            },
            likelihood="high",
            symptoms=[
                "Water-soaked cream-colored slimy soft decay of tubers",
                "Extremely foul rotting odor emitted from stored or field tubers",
                "Black leg lesions expanding at lower stem base near soil level"
            ],
            symptomsLocalized={
                "en": ["Water-soaked cream-colored slimy soft decay of tubers", "Extremely foul rotting odor emitted from stored or field tubers", "Black leg lesions expanding at lower stem base near soil level"],
                "hi": ["आलू कंदों का चिपचिपा नरम सड़न", "अत्यधिक बदबूदार गंध निकलना", "तने के निचले हिस्से पर काला धब्बा (ब्लैक लेग)"],
                "pa": ["ਆਲੂ ਦਾ ਚਿਪਚਿਪਾ ਨਰਮ ਸੜਨ", "ਬਹੁਤ ਜ਼ਿਆਦਾ ਬਦਬੂਦਾਰ ਬੂ", "ਤਣੇ ਦੇ ਹੇਠਲੇ ਹਿੱਸੇ ਤੇ ਕਾਲਾ ਧੱਬਾ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-psr-1", step=1,
                title="Discard rotten tubers and improve storage ventilation",
                titleLocalized={"en": "Discard rotten tubers and improve storage ventilation", "hi": "सड़े हुए आलू निकालें और वेंटिलेशन सुधारें", "pa": "ਸੜੇ ਹੋਏ ਆਲੂ ਕੱਢੋ ਅਤੇ ਵੈਂਟੀਲੇਸ਼ਨ ਸੁਧਾਰੋ"},
                description="Separate and destroy affected tubers. Keep storage cool (<10°C) and dry with positive airflow.",
                descriptionLocalized={"en": "Separate and destroy affected tubers. Keep storage cool (<10°C) and dry with positive airflow.", "hi": "प्रभावित आलू को अलग करके नष्ट करें। भंडारण को ठंडा और सूखा रखें।", "pa": "ਪ੍ਰਭਾਵਿਤ ਆਲੂਆਂ ਨੂੰ ਵੱਖ ਕਰਕੇ ਨਸ਼ਟ ਕਰੋ। ਭੰਡਾਰਨ ਨੂੰ ਠੰਡਾ ਅਤੇ ਸੁੱਕਾ ਰੱਖੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "nitrogen_deficiency": {
        "id": "kb-nitrogen-def",
        "keywords": ["nitrogen", "deficiency", "yellowing", "pale", "stunted", "chlorosis", "older leaves"],
        "cause": PossibleCause(
            id="cause-nitrogen-def",
            name="Nitrogen Deficiency",
            nameLocalized={
                "en": "Nitrogen Deficiency",
                "hi": "नाइट्रोजन की कमी",
                "pa": "ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ"
            },
            category="nutrient",
            description="Lack of mobile nitrogen leads to uniform pale green to yellow chlorosis starting on older lower foliage, while plant growth is stunted.",
            descriptionLocalized={
                "en": "Lack of mobile nitrogen leads to uniform pale green to yellow chlorosis starting on older lower foliage, while plant growth is stunted.",
                "hi": "नाइट्रोजन की कमी से पुरानी निचली पत्तियों पर पीलापन शुरू होता है और पौधे की वृद्धि रुक जाती है।",
                "pa": "ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਘਾਟ ਨਾਲ ਪੁਰਾਣੇ ਹੇਠਲੇ ਪੱਤਿਆਂ ਤੇ ਪੀਲਾਪਨ ਸ਼ੁਰੂ ਹੁੰਦਾ ਹੈ ਅਤੇ ਬੂਟੇ ਦਾ ਵਾਧਾ ਰੁਕ ਜਾਂਦਾ ਹੈ।"
            },
            likelihood="medium",
            symptoms=[
                "V-shaped tip-to-base chlorosis on older lower leaves",
                "Stunted overall canopy growth and reduced tillering",
                "Pale yellowing foliage across upper canopy under severe stress"
            ],
            symptomsLocalized={
                "en": ["V-shaped tip-to-base chlorosis on older lower leaves", "Stunted overall canopy growth and reduced tillering", "Pale yellowing foliage across upper canopy under severe stress"],
                "hi": ["पुरानी पत्तियों के सिरों से V-आकार में पीलापन", "पौधे का रुका विकास और कम कल्ले निकलना", "ऊपरी कैनोपी का हल्का पीला होना"],
                "pa": ["ਪੁਰਾਣੇ ਪੱਤਿਆਂ ਦੇ ਸਿਰਿਆਂ ਤੋਂ V-ਆਕਾਰ ਵਿੱਚ ਪੀਲਾਪਨ", "ਬੂਟੇ ਦਾ ਰੁਕਿਆ ਵਾਧਾ", "ਉੱਪਰਲੀ ਕੈਨੋਪੀ ਦਾ ਹਲਕਾ ਪੀਲਾ ਹੋਣਾ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-n-1", step=1,
                title="Top-dress split dose of Urea or Foliar N Spray",
                titleLocalized={"en": "Top-dress split dose of Urea or Foliar N Spray", "hi": "यूरिया की टॉप-ड्रेसिंग या पर्णीय स्प्रे करें", "pa": "ਯੂਰੀਆ ਦੀ ਟੌਪ-ਡ੍ਰੈਸਿੰਗ ਜਾਂ ਪੱਤਿਆਂ ਤੇ ਸਪ੍ਰੇਅ ਕਰੋ"},
                description="Apply top-dressed Urea (25–30 kg/acre) under adequate soil moisture, or spray 1-2% Nano Urea foliar solution.",
                descriptionLocalized={"en": "Apply top-dressed Urea (25–30 kg/acre) under adequate soil moisture, or spray 1-2% Nano Urea foliar solution.", "hi": "पर्याप्त नमी में यूरिया (25-30 किग्रा/एकड़) डालें या 1-2% नैनो यूरिया का छिड़काव करें।", "pa": "ਨਮੀ ਵਿੱਚ ਯੂਰੀਆ (25-30 ਕਿਗ੍ਰਾ/ਏਕੜ) ਪਾਓ ਜਾਂ 1-2% ਨੈਨੋ ਯੂਰੀਆ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            )
        ]
    },
    "zinc_deficiency": {
        "id": "kb-zinc-def",
        "keywords": ["zinc", "khaira", "white bud", "deficiency", "rusty", "bronzing", "internode"],
        "cause": PossibleCause(
            id="cause-zinc-def",
            name="Zinc Deficiency (Khaira Disease / Bronzing)",
            nameLocalized={
                "en": "Zinc Deficiency (Khaira Disease / Bronzing)",
                "hi": "जिंक की कमी (खैरा रोग / ब्रोंज़िंग)",
                "pa": "ਜਿੰਕ ਦੀ ਘਾਟ (ਖ਼ੈਰਾ ਰੋਗ / ਬ੍ਰੋਂਜ਼ਿੰਗ)"
            },
            category="nutrient",
            description="Zinc deficiency causes rusty brown spots on middle leaves (Khaira disease in rice) and shortened internodes with stunted bushy growth.",
            descriptionLocalized={
                "en": "Zinc deficiency causes rusty brown spots on middle leaves (Khaira disease in rice) and shortened internodes with stunted bushy growth.",
                "hi": "जिंक की कमी से बीच की पत्तियों पर जंग जैसे भूरे धब्बे (धान में खैरा रोग) और छोटी गांठों के साथ रुका हुआ विकास होता है।",
                "pa": "ਜਿੰਕ ਦੀ ਘਾਟ ਨਾਲ ਵਿਚਕਾਰਲੇ ਪੱਤਿਆਂ ਤੇ ਜੰਗ ਵਰਗੇ ਭੂਰੇ ਧੱਬੇ (ਝੋਨੇ ਵਿੱਚ ਖ਼ੈਰਾ ਰੋਗ) ਅਤੇ ਰੁਕਿਆ ਵਾਧਾ ਹੁੰਦਾ ਹੈ।"
            },
            likelihood="medium",
            symptoms=[
                "Rusty brown or reddish-brown pigment spots coalescing on leaves",
                "Shortened internodes resulting in reset bushy plant architecture",
                "Chlorotic midrib bleaching on young leaves ('white bud' in maize)"
            ],
            symptomsLocalized={
                "en": ["Rusty brown or reddish-brown pigment spots coalescing on leaves", "Shortened internodes resulting in reset bushy plant architecture", "Chlorotic midrib bleaching on young leaves ('white bud' in maize)"],
                "hi": ["पत्तियों पर जंग जैसे भूरे धब्बे", "छोटी गांठें और झाड़ीदार विकास", "नई पत्तियों की मुख्य नस का सफेद पड़ना"],
                "pa": ["ਪੱਤਿਆਂ ਤੇ ਜੰਗ ਵਰਗੇ ਭੂਰੇ ਧੱਬੇ", "ਛੋਟੀਆਂ ਗੰਢਾਂ ਅਤੇ ਝਾੜੀਦਾਰ ਵਾਧਾ", "ਨਵੇਂ ਪੱਤਿਆਂ ਦਾ ਚਿੱਟਾ ਪੈਣਾ"]
            }
        ),
        "actions": [
            ActionStep(
                id="act-zn-1", step=1,
                title="Foliar spray of Zinc Sulphate (0.5%) + Lime",
                titleLocalized={"en": "Foliar spray of Zinc Sulphate (0.5%) + Lime", "hi": "जिंक सल्फेट (0.5%) + चूने का छिड़काव करें", "pa": "ਜਿੰਕ ਸਲਫ਼ੇਟ (0.5%) + ਚੂਨੇ ਦਾ ਸਪ੍ਰੇਅ ਕਰੋ"},
                description="Spray Zinc Sulphate 21% (5 g/L) mixed with 2.5 g/L quicklime or Chelated Zinc EDTA (1 g/L).",
                descriptionLocalized={"en": "Spray Zinc Sulphate 21% (5 g/L) mixed with 2.5 g/L quicklime or Chelated Zinc EDTA (1 g/L).", "hi": "जिंक सल्फेट 21% (5 ग्राम/लीटर) और बुझे चूने का घोल बनाकर पत्तियों पर छिड़काव करें।", "pa": "ਜਿੰਕ ਸਲਫ਼ੇਟ 21% (5 ਗ੍ਰਾਮ/ਲੀਟਰ) ਅਤੇ ਚੂਨੇ ਦਾ ਘੋਲ ਬਣਾ ਕੇ ਸਪ੍ਰੇਅ ਕਰੋ।"},
                priority="immediate", timeframe="Within 24–48 hours",
                timeframeLocalized={"en": "Within 24–48 hours", "hi": "24–48 घंटे के भीतर", "pa": "24–48 ਘੰਟੇ ਦੇ ਅੰਦਰ"}
            )
        ]
    }
}

# ─── Dynamic RAG Synthesis Helper Functions ───

def match_kb_diagnoses_from_sources(query: str, crop_type: CropType, sources: List[EvidenceSource]) -> List[PossibleCause]:
    """Matches top retrieved RAG evidence sources against KB diagnosis registry using weighted keyword scoring."""
    query_lower = f"{crop_type} {query}".lower()
    sources_text = " ".join([f"{src.title} {src.source} {src.snippet}" for src in sources]).lower()
    
    scores: Dict[str, float] = {}

    for key, entry in KB_DIAGNOSES.items():
        key_crop = key.split("_")[0]
        # Crop strictness: exclude diagnoses for other specific crops
        if crop_type and crop_type != "unknown":
            if key_crop in ["rice", "wheat", "maize", "cotton", "sugarcane", "tomato", "potato"] and key_crop != crop_type:
                continue

        score = 0.0
        if crop_type and crop_type != "unknown" and crop_type in key_crop:
            score += 15.0

        for kw in entry["keywords"]:
            kw_l = kw.lower()
            if kw_l in query_lower:
                score += 5.0
            if kw_l in sources_text:
                score += 3.0

        scores[key] = score

    # Sort keys descending by score
    sorted_keys = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)
    
    # Select top scored keys
    matched_keys = [k for k in sorted_keys if scores[k] > 0]
    if not matched_keys:
        matched_keys = sorted_keys

    results: List[PossibleCause] = []
    for idx, key in enumerate(matched_keys[:3]):
        base_cause = KB_DIAGNOSES[key]["cause"]
        likelihood_val: ConfidenceLevel = "high" if idx == 0 else ("medium" if idx == 1 else "low")
        c_copy = PossibleCause(
            id=f"cause-{idx+1}",
            name=base_cause.name,
            nameLocalized=base_cause.nameLocalized,
            category=base_cause.category,
            description=base_cause.description,
            descriptionLocalized=base_cause.descriptionLocalized,
            likelihood=likelihood_val,
            symptoms=base_cause.symptoms,
            symptomsLocalized=base_cause.symptomsLocalized
        )
        results.append(c_copy)

    return results


def match_kb_actions_from_causes(causes: List[PossibleCause]) -> List[ActionStep]:
    """Generates specific action plan steps corresponding to identified causes."""
    actions: List[ActionStep] = []
    step_num = 1

    for cause in causes:
        # Search KB_DIAGNOSES for matching cause
        for key, entry in KB_DIAGNOSES.items():
            if entry["cause"].name == cause.name or entry["cause"].category == cause.category:
                for act in entry["actions"]:
                    a_copy = ActionStep(
                        id=f"action-{step_num}",
                        step=step_num,
                        title=act.title,
                        titleLocalized=act.titleLocalized,
                        description=act.description,
                        descriptionLocalized=act.descriptionLocalized,
                        priority=act.priority,
                        timeframe=act.timeframe,
                        timeframeLocalized=act.timeframeLocalized
                    )
                    actions.append(a_copy)
                    step_num += 1
                    if len(actions) >= 3:
                        break
            if len(actions) >= 3:
                break
        if len(actions) >= 3:
            break

    # Fallback default preventive step if needed
    if len(actions) < 2:
        actions.append(
            ActionStep(
                id=f"action-{step_num}",
                step=step_num,
                title="Field sanitation and monitoring",
                titleLocalized={
                    "en": "Field sanitation and monitoring",
                    "hi": "खेत की स्वच्छता और निगरानी",
                    "pa": "ਖੇਤ ਦੀ ਸਫ਼ਾਈ ਅਤੇ ਨਿਗਰਾਨੀ"
                },
                description="Scout field twice weekly. Clear weeds and avoid waterlogging to promote root aeration.",
                descriptionLocalized={
                    "en": "Scout field twice weekly. Clear weeds and avoid waterlogging to promote root aeration.",
                    "hi": "सप्ताह में दो बार खेत का निरीक्षण करें। खरपतवार हटाएं और जलभराव से बचें।",
                    "pa": "ਹਫ਼ਤੇ ਵਿੱਚ ਦੋ ਵਾਰ ਖੇਤ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ। ਨਦੀਨ ਹਟਾਓ ਅਤੇ ਪਾਣੀ ਖੜ੍ਹਾ ਹੋਣ ਤੋਂ ਬਚੋ।"
                },
                priority="preventive",
                timeframe="Within 1 week",
                timeframeLocalized={
                    "en": "Within 1 week",
                    "hi": "1 हफ्ते के भीतर",
                    "pa": "1 ਹਫ਼ਤੇ ਦੇ ਅੰਦਰ"
                }
            )
        )

    return actions

def parse_llm_causes(llm_causes: list, crop_loc: Dict[LanguageCode, str]) -> List[PossibleCause]:
    """Parses raw JSON possible_causes list from LLM output into structured schema."""
    results: List[PossibleCause] = []
    for idx, raw in enumerate(llm_causes[:3]):
        if isinstance(raw, dict):
            name = raw.get("name", f"Agronomic Condition {idx+1}")
            cat = raw.get("category", "disease")
            if cat not in ["disease", "pest", "nutrient", "environmental", "physiological"]:
                cat = "disease"
            like = raw.get("likelihood", "high" if idx == 0 else "medium")
            if like not in ["high", "medium", "low"]:
                like = "medium"
            desc = raw.get("description", "Condition analyzed based on submitted crop symptoms and RAG evidence.")
            symptoms = raw.get("symptoms", ["Leaf discoloration or spotting", "Stunted growth"])
            if not isinstance(symptoms, list):
                symptoms = [str(symptoms)]

            results.append(
                PossibleCause(
                    id=f"cause-{idx+1}",
                    name=name,
                    nameLocalized={"en": name, "hi": name, "pa": name},
                    category=cat,
                    description=desc,
                    descriptionLocalized={"en": desc, "hi": desc, "pa": desc},
                    likelihood=like,
                    symptoms=symptoms,
                    symptomsLocalized={"en": symptoms, "hi": symptoms, "pa": symptoms}
                )
            )
    return results

def parse_llm_actions(llm_actions: list) -> List[ActionStep]:
    """Parses raw JSON action_plan list from LLM output into structured schema."""
    results: List[ActionStep] = []
    for idx, raw in enumerate(llm_actions[:3]):
        if isinstance(raw, dict):
            step_num = raw.get("step", idx + 1)
            title = raw.get("title", f"Action Step {step_num}")
            desc = raw.get("description", "Execute recommended management practice.")
            prio = raw.get("priority", "immediate" if idx == 0 else "short-term")
            if prio not in ["immediate", "short-term", "preventive"]:
                prio = "immediate"
            tf = raw.get("timeframe", "Within 24-48 hours")

            results.append(
                ActionStep(
                    id=f"action-{step_num}",
                    step=step_num,
                    title=title,
                    titleLocalized={"en": title, "hi": title, "pa": title},
                    description=desc,
                    descriptionLocalized={"en": desc, "hi": desc, "pa": desc},
                    priority=prio,
                    timeframe=tf,
                    timeframeLocalized={"en": tf, "hi": tf, "pa": tf}
                )
            )
    return results

def synthesize_analysis_result(
    req: AnalyzeRequest,
    sources: List[EvidenceSource],
    llm_output: Optional[dict] = None
) -> AnalysisResult:
    """
    Synthesizes complete AnalysisResult enforcing dynamic RAG evidence retrieval,
    multimodal LLM output parsing, confidence calculation, escalation flags, and multi-language localizations.
    """
    result_id = f"res-{uuid.uuid4().hex[:10]}"
    effective_crop: CropType = req.cropType if (req.cropType and req.cropType != "unknown") else "wheat"
    crop_loc = get_crop_localized(effective_crop)
    
    has_image = bool(req.imageDataUrl)
    has_text = bool(req.textDescription or req.transcription)
    confidence = determine_confidence_level(has_image, has_text)
    
    # Override confidence if LLM provides explicit confidence level
    if llm_output and llm_output.get("confidence_level") in ["high", "medium", "low"]:
        confidence = llm_output.get("confidence_level")

    escalate = (confidence == "low")
    confidence_narrative, confidence_narrative_loc = build_confidence_narrative(confidence)
    
    if llm_output and llm_output.get("confidence_narrative"):
        confidence_narrative = llm_output.get("confidence_narrative")
        confidence_narrative_loc = {"en": confidence_narrative, "hi": confidence_narrative, "pa": confidence_narrative}

    escalation_guidance, escalation_guidance_loc = build_escalation_guidance(escalate)

    # 1. Parse LLM Output if present
    if llm_output and isinstance(llm_output.get("possible_causes"), list) and len(llm_output["possible_causes"]) > 0:
        logger.info("Synthesizing result from LLM multimodal reasoning output.")
        possible_causes = parse_llm_causes(llm_output["possible_causes"], crop_loc)
        
        if isinstance(llm_output.get("action_plan"), list) and len(llm_output["action_plan"]) > 0:
            action_plan = parse_llm_actions(llm_output["action_plan"])
        else:
            action_plan = match_kb_actions_from_causes(possible_causes)

        summary_text = llm_output.get("summary") or (
            f"Based on multimodal analysis for {effective_crop.capitalize()}, primary findings point towards "
            f"{possible_causes[0].name}. {len(sources)} RAG evidence references were utilized."
        )
    else:
        # 2. Dynamic RAG Synthesis when LLM is unavailable or unconfigured
        logger.info("Synthesizing result via dynamic RAG knowledge base evidence matcher.")
        query_text = f"{req.textDescription or ''} {req.transcription or ''}".strip()
        possible_causes = match_kb_diagnoses_from_sources(query_text, effective_crop, sources)
        action_plan = match_kb_actions_from_causes(possible_causes)

        primary_cause_name = possible_causes[0].name
        top_source_title = sources[0].title if sources else "Agricultural Research Database"

        summary_text = (
            f"Based on real-time RAG vector search for {effective_crop.capitalize()}, the most probable condition is "
            f"{primary_cause_name}, matching evidence from '{top_source_title}'. "
            f"Cross-referenced across {len(sources)} active agricultural reference documents."
        )

    summary_loc = {
        "en": summary_text,
        "hi": f"सबमिट किए गए इनपुट के आधार पर, {crop_loc['hi']} के लिए सबसे संभावित कारण {possible_causes[0].nameLocalized.get('hi', possible_causes[0].name)} है। {len(sources)} संदर्भ साक्ष्य दस्तावेजों द्वारा समर्थित।",
        "pa": f"ਸਪੁਰਦ ਕੀਤੇ ਇਨਪੁਟ ਦੇ ਆਧਾਰ ਤੇ, {crop_loc['pa']} ਲਈ ਸਭ ਤੋਂ ਸੰਭਾਵਿਤ ਕਾਰਨ {possible_causes[0].nameLocalized.get('pa', possible_causes[0].name)} ਹੈ। {len(sources)} ਸਰੋਤ ਸਬੂਤ ਦਸਤਾਵੇਜ਼ਾਂ ਦੁਆਰਾ ਸਮਰਥਨ ਕੀਤਾ ਗਿਆ।"
    }

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

