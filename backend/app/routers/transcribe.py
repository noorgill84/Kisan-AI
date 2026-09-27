import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.models.schemas import TranscribeResponse, LanguageCode
from app.services.stt import transcribe_audio_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Speech-to-Text"])

MAX_AUDIO_SIZE_MB = 15

@router.post(
    "/transcribe",
    response_model=TranscribeResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe spoken audio input in English, Hindi, or Punjabi"
)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: LanguageCode = Form("en")
) -> TranscribeResponse:
    """
    POST /api/transcribe
    Receives an uploaded audio file (wav, mp3, m4a, webm) and target language.
    Runs Speech-To-Text API (Whisper/Groq/Fallback) and returns transcribed text with confidence score.
    """
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded audio file is empty."
            )

        if len(audio_bytes) > MAX_AUDIO_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file size exceeds maximum allowed limit of {MAX_AUDIO_SIZE_MB}MB."
            )

        text, confidence = transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=file.filename or "audio.webm",
            language=language
        )

        return TranscribeResponse(
            text=text,
            language=language,
            confidence=confidence
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing audio transcription: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to transcribe audio. Please try again or type your query."
        )
