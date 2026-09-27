import logging
from typing import List, Optional
from fastapi import APIRouter, Query, status
from app.models.schemas import HistoryItem
from app.services.db import get_user_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["History"])

@router.get(
    "/history",
    response_model=List[HistoryItem],
    status_code=status.HTTP_200_OK,
    summary="Get user diagnosis history strictly isolated by anonymous userId"
)
async def fetch_history(
    userId: Optional[str] = Query(None, description="Anonymous user identity string")
) -> List[HistoryItem]:
    """
    GET /api/history?userId=anon-12345
    Returns diagnosis history list isolated to the provided userId.
    """
    try:
        items = get_user_history(userId)
        return items
    except Exception as e:
        logger.error(f"Error fetching history for userId {userId}: {e}")
        return []
