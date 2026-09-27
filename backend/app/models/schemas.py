from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field

ConfidenceLevel = Literal["high", "medium", "low"]
LanguageCode = Literal["en", "hi", "pa"]
CropType = Literal[
    "wheat",
    "rice",
    "maize",
    "cotton",
    "sugarcane",
    "tomato",
    "potato",
    "unknown"
]

CategoryType = Literal["disease", "pest", "nutrient", "environmental", "physiological"]
PriorityType = Literal["immediate", "short-term", "preventive"]


class PossibleCause(BaseModel):
    id: str
    name: str
    nameLocalized: Optional[Dict[LanguageCode, str]] = None
    category: CategoryType
    description: str
    descriptionLocalized: Optional[Dict[LanguageCode, str]] = None
    likelihood: ConfidenceLevel
    symptoms: List[str]
    symptomsLocalized: Optional[Dict[LanguageCode, List[str]]] = None


class EvidenceSource(BaseModel):
    id: str
    title: str
    source: str
    url: Optional[str] = None
    snippet: str
    relevance: ConfidenceLevel


class ActionStep(BaseModel):
    id: str
    step: int
    title: str
    titleLocalized: Optional[Dict[LanguageCode, str]] = None
    description: str
    descriptionLocalized: Optional[Dict[LanguageCode, str]] = None
    priority: PriorityType
    timeframe: str
    timeframeLocalized: Optional[Dict[LanguageCode, str]] = None


class AnalysisResult(BaseModel):
    id: str
    userId: Optional[str] = None
    cropType: CropType
    cropTypeLocalized: Optional[Dict[LanguageCode, str]] = None
    possible_causes: List[PossibleCause]
    confidence_level: ConfidenceLevel
    confidenceNarrative: str
    confidenceNarrativeLocalized: Optional[Dict[LanguageCode, str]] = None
    sources: List[EvidenceSource]
    action_plan: List[ActionStep]
    escalation_flag: bool
    escalationGuidance: Optional[str] = None
    escalationGuidanceLocalized: Optional[Dict[LanguageCode, str]] = None
    summary: str
    summaryLocalized: Optional[Dict[LanguageCode, str]] = None
    createdAt: str
    imageDataUrl: Optional[str] = None
    userDescription: Optional[str] = None
    transcription: Optional[str] = None


class HistoryItem(BaseModel):
    id: str
    userId: Optional[str] = None
    cropType: CropType
    cropTypeLocalized: Optional[Dict[LanguageCode, str]] = None
    confidence_level: ConfidenceLevel
    summary: str
    summaryLocalized: Optional[Dict[LanguageCode, str]] = None
    createdAt: str
    possible_causes_count: int
    escalation_flag: bool
    thumbnailUrl: Optional[str] = None


class WeatherInfo(BaseModel):
    temperature: float
    humidity: float
    condition: str
    windSpeed: float
    rainfall: float
    location: str


class AnalyzeRequest(BaseModel):
    userId: Optional[str] = None
    imageDataUrl: Optional[str] = None
    transcription: Optional[str] = None
    textDescription: Optional[str] = None
    language: LanguageCode = "en"
    cropType: Optional[CropType] = "unknown"


class TranscribeResponse(BaseModel):
    text: str
    language: LanguageCode
    confidence: float
