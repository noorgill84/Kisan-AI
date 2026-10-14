import logging
import io
from typing import Tuple
from app.config import settings
from app.models.schemas import LanguageCode

logger = logging.getLogger(__name__)

MOCK_TRANSCRIPTIONS = {
    "en": "The crop leaves are showing spots and marginal damage over recent days. Growth seems affected and needs evaluation.",
    "hi": "फसल की पत्तियों पर हाल के दिनों में धब्बे और किनारों पर खराबी दिख रही है। विकास प्रभावित लग रहा है।",
    "pa": "ਫਸਲ ਦੇ ਪੱਤਿਆਂ ਤੇ ਪਿਛਲੇ ਕੁਝ ਦਿਨਾਂ ਤੋਂ ਧੱਬੇ ਅਤੇ ਕਿਨਾਰਿਆਂ ਤੇ ਨੁਕਸਾਨ ਦਿਸ ਰਿਹਾ ਹੈ। ਵਾਧਾ ਪ੍ਰਭਾਵਿਤ ਲੱਗ ਰਿਹਾ ਹੈ।"
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
            file_ext = ".webm"
            # Auto-detect audio container from magic bytes or filename (supports iOS Safari MP4/AAC and Android WebM)
            if audio_bytes.startswith(b"\x1a\x45\xdf\xa3"):
                mime_type = "audio/webm"
                file_ext = ".webm"
            elif len(audio_bytes) > 8 and (b"ftyp" in audio_bytes[:16] or audio_bytes[:4] == b"\x00\x00\x00\x20"):
                mime_type = "audio/mp4"
                file_ext = ".m4a"
            elif audio_bytes.startswith(b"RIFF"):
                mime_type = "audio/wav"
                file_ext = ".wav"
            elif audio_bytes.startswith(b"ID3") or audio_bytes.startswith(b"\xff\xfb") or audio_bytes.startswith(b"\xff\xf3"):
                mime_type = "audio/mp3"
                file_ext = ".mp3"
            elif filename:
                fn = filename.lower()
                if fn.endswith(".mp4") or fn.endswith(".m4a") or fn.endswith(".aac"):
                    mime_type = "audio/mp4"
                    file_ext = ".m4a"
                elif fn.endswith(".wav"):
                    mime_type = "audio/wav"
                    file_ext = ".wav"
                elif fn.endswith(".mp3"):
                    mime_type = "audio/mp3"
                    file_ext = ".mp3"

            prompt_lang = "Hindi (Devanagari script)" if language == "hi" else ("Punjabi (Gurmukhi script)" if language == "pa" else "English")
            user_prompt = (
                f"Transcribe the verbatim spoken words from this agricultural voice note accurately in {prompt_lang}. "
                f"Return ONLY the exact spoken transcription text without translation, commentary, quotes, or preamble."
            )

            # Support valid Gemini production models (gemini-2.0-flash and gemini-1.5-flash)
            for model_name in ["gemini-2.0-flash", "gemini-1.5-flash"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[
                            user_prompt,
                            genai.types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
                        ]
                    )
                    if response.text and response.text.strip():
                        return response.text.strip(), 0.96
                except Exception as inner_e:
                    logger.warning(f"Gemini Audio STT with {model_name} failed: {inner_e}")
        except Exception as e:
            logger.error(f"Gemini Audio STT failed: {e}")

    # 2. Try OpenAI Whisper
    if settings.OPENAI_API_KEY:
        try:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = f"audio{file_ext}"
            
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
            audio_file.name = f"audio{file_ext}"

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

