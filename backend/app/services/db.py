import logging
from typing import List, Dict, Optional
from app.config import settings
from app.models.schemas import AnalysisResult, HistoryItem

logger = logging.getLogger(__name__)

# In-memory storage for local development / fallback
# Structured as: { userId: [AnalysisResult, ...] }
_memory_db: Dict[str, List[AnalysisResult]] = {}

def get_supabase_client():
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        try:
            from supabase import create_client
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
    return None

def save_analysis_result(result: AnalysisResult) -> bool:
    """
    Saves analysis result tagged by userId.
    """
    user_id = result.userId or "anonymous"
    
    # 1. Try Supabase
    client = get_supabase_client()
    if client:
        try:
            data = result.model_dump()
            client.table("diagnoses").insert(data).execute()
            logger.info(f"Saved analysis {result.id} for user {user_id} to Supabase.")
            return True
        except Exception as e:
            logger.error(f"Error saving to Supabase: {e}")

    # 2. Fallback to memory
    if user_id not in _memory_db:
        _memory_db[user_id] = []
    _memory_db[user_id].insert(0, result)
    logger.info(f"Saved analysis {result.id} for user {user_id} to memory store.")
    return True

def get_user_history(user_id: Optional[str]) -> List[HistoryItem]:
    """
    Fetches diagnosis history for a given userId, converting AnalysisResult to HistoryItem.
    """
    effective_id = user_id or "anonymous"
    results: List[AnalysisResult] = []

    # 1. Try Supabase
    client = get_supabase_client()
    if client:
        try:
            res = client.table("diagnoses").select("*").eq("userId", effective_id).order("createdAt", desc=True).execute()
            if res.data:
                results = [AnalysisResult(**row) for row in res.data]
        except Exception as e:
            logger.error(f"Error reading history from Supabase: {e}")

    # 2. Fallback memory
    if not results:
        results = _memory_db.get(effective_id, [])

    history_items: List[HistoryItem] = []
    for r in results:
        history_items.append(
            HistoryItem(
                id=r.id,
                userId=r.userId,
                cropType=r.cropType,
                cropTypeLocalized=r.cropTypeLocalized,
                confidence_level=r.confidence_level,
                summary=r.summary,
                summaryLocalized=r.summaryLocalized,
                createdAt=r.createdAt,
                possible_causes_count=len(r.possible_causes),
                escalation_flag=r.escalation_flag,
                thumbnailUrl=r.imageDataUrl
            )
        )

    return history_items
