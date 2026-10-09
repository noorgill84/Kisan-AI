import logging
import base64
import json
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

def parse_json_from_llm_text(text: str) -> Optional[Dict[str, Any]]:
    """Helper to cleanly extract JSON dictionary from LLM response text."""
    if not text:
        return None
    cleaned = text.strip()
    # Strip markdown code fencing if present
    if "```" in cleaned:
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try finding first { and last }
        start_idx = cleaned.find("{")
        end_idx = cleaned.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            try:
                return json.loads(cleaned[start_idx:end_idx + 1])
            except Exception:
                pass
    return None

def analyze_multimodal_crop_input(
    image_data_url: Optional[str],
    text_description: Optional[str],
    transcription: Optional[str],
    crop_type: str,
    evidence_text: str
) -> Optional[Dict[str, Any]]:
    """
    Analyzes crop symptoms using Gemini, OpenAI, or Groq API.
    Returns structured JSON analysis dictionary or None on failure.
    """
    user_prompt = f"""
    Crop Type: {crop_type}
    User Text Description: {text_description or 'None provided'}
    User Voice Transcription: {transcription or 'None provided'}

    Retrieved RAG Evidence Documents:
    {evidence_text}

    Analyze the crop condition carefully based on visual patterns and text description.
    Outputs MUST be decision support (possible causes), NEVER a definitive diagnostic claim.

    Return JSON with this exact structure:
    {{
      "summary": "Clear multi-sentence explanation framing findings as possible causes",
      "confidence_level": "high" | "medium" | "low",
      "confidence_narrative": "Explanation of confidence level",
      "possible_causes": [
        {{
          "id": "cause-1",
          "name": "Name of disease/pest/deficiency",
          "category": "disease" | "pest" | "nutrient" | "environmental" | "physiological",
          "description": "Detailed explanation of cause",
          "likelihood": "high" | "medium" | "low",
          "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3"]
        }}
      ],
      "action_plan": [
        {{
          "id": "action-1",
          "step": 1,
          "title": "Action title",
          "description": "Detailed action description",
          "priority": "immediate" | "short-term" | "preventive",
          "timeframe": "Within 24-48 hours"
        }}
      ]
    }}
    """

    # 1. Try Gemini API
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            contents = [user_prompt]
            if image_data_url and "," in image_data_url:
                header, base64_data = image_data_url.split(",", 1)
                mime_type = "image/jpeg"
                if "png" in header:
                    mime_type = "image/png"
                elif "webp" in header:
                    mime_type = "image/webp"
                
                image_bytes = base64.b64decode(base64_data)
                contents.append(
                    genai.types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type
                    )
                )

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            if response.text:
                parsed = parse_json_from_llm_text(response.text)
                if parsed:
                    return parsed
        except Exception as e:
            logger.error(f"Gemini API analysis failed: {e}")

    # 2. Try OpenAI API
    if settings.OPENAI_API_KEY:
        try:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            
            messages_content = [{"type": "text", "text": user_prompt}]
            if image_data_url:
                messages_content.append({
                    "type": "image_url",
                    "image_url": {"url": image_data_url}
                })

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an expert agronomic decision support AI."},
                    {"role": "user", "content": messages_content}
                ]
            )
            content = response.choices[0].message.content
            if content:
                parsed = parse_json_from_llm_text(content)
                if parsed:
                    return parsed
        except Exception as e:
            logger.error(f"OpenAI API analysis failed: {e}")

    # 3. Try Groq API
    if settings.GROQ_API_KEY:
        try:
            import openai
            client = openai.OpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
            
            messages_content = [{"type": "text", "text": user_prompt}]
            model_name = "llama-3.3-70b-versatile"
            if image_data_url:
                messages_content.append({
                    "type": "image_url",
                    "image_url": {"url": image_data_url}
                })
                model_name = "llama-3.2-11b-vision-preview"

            response = client.chat.completions.create(
                model=model_name,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an expert agronomic decision support AI."},
                    {"role": "user", "content": messages_content}
                ]
            )
            content = response.choices[0].message.content
            if content:
                parsed = parse_json_from_llm_text(content)
                if parsed:
                    return parsed
        except Exception as e:
            logger.error(f"Groq API analysis failed: {e}")

    logger.warning("No LLM API keys configured or all failed. Falling back to RAG-driven reasoning engine.")
    return None

