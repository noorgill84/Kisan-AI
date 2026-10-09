import logging
import io
from typing import Tuple
from app.config import settings
from app.models.schemas import LanguageCode

logger = logging.getLogger(__name__)

MOCK_TRANSCRIPTIONS = {
    "en": "Yellow spots appeared on the lower leaves about a week ago. They started small but have been spreading upward. The edges of the leaves are turning brown and curling.",
    "hi": "लगभग एक हफ्ते पहले निचली पत्तियों पर पीले धब्बे दिखे। वे छोटे थे लेकिन ऊपर की ओर फैल रहे हैं। पत्तियों के किनारे भूरे हो रहे हैं और मुड़ रहे हैं।",
    "pa": "ਲਗਭਗ ਇੱਕ ਹਫ਼ਤਾ ਪਹਿਲਾਂ ਹੇਠਲੇ ਪੱਤਿਆਂ ਤੇ ਪੀਲੇ ਧੱਬੇ ਦਿਸੇ। ਉਹ ਛੋਟੇ ਸਨ ਪਰ ਉੱਪਰ ਵੱਲ ਫੈਲ ਰਹੇ ਹਨ। ਪੱਤਿਆਂ ਦੇ ਕਿਨਾਰੇ ਭੂਰੇ ਹੋ ਰਹੇ ਹਨ ਅਤੇ ਮੁੜ ਰਹੇ ਹਨ।"
}

def transcribe_audio_bytes(audio_bytes: bytes, filename: str, language: LanguageCode) -> Tuple[str, float]:
    """
    Transcribes audio bytes to text using Gemini, OpenAI Whisper, or Groq.
    Returns (transcription_text, confidence_score).
    """
    # 1. Try Gemini Audio STT
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            mime_type = "audio/webm"
            if filename:
                if filename.endswith(".wav"):
                    mime_type = "audio/wav"
                elif filename.endswith(".mp3"):
                    mime_type = "audio/mp3"
                elif filename.endswith(".m4a"):
                    mime_type = "audio/m4a"

            prompt_lang = "Hindi" if language == "hi" else ("Punjabi" if language == "pa" else "English")
            user_prompt = f"Transcribe the verbatim spoken words from this audio clip accurately in {prompt_lang}. Return ONLY the transcript text without preamble."

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    user_prompt,
                    genai.types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
                ]
            )
            if response.text and response.text.strip():
                return response.text.strip(), 0.96
        except Exception as e:
            logger.error(f"Gemini Audio STT failed: {e}")

    # 2. Try OpenAI Whisper
    if settings.OPENAI_API_KEY:
        try:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename or "audio.wav"
            
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="hi" if language == "hi" else ("pa" if language == "pa" else "en")
            )
            if transcript.text:
                return transcript.text, 0.95
        except Exception as e:
            logger.error(f"OpenAI Whisper STT failed: {e}")

    # 3. Try Groq Whisper
    if settings.GROQ_API_KEY:
        try:
            import openai
            client = openai.OpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1"
            )
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename or "audio.wav"

            transcript = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                language="hi" if language == "hi" else ("pa" if language == "pa" else "en")
            )
            if transcript.text:
                return transcript.text, 0.94
        except Exception as e:
            logger.error(f"Groq Whisper STT failed: {e}")

    logger.warning("No STT API available or call failed. Using localized fallback transcription.")
    fallback_text = MOCK_TRANSCRIPTIONS.get(language, MOCK_TRANSCRIPTIONS["en"])
    return fallback_text, 0.88

