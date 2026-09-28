import os
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KisanAI Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # CORS settings: accepts list, JSON string, or comma-separated string
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://kisan-ai.vercel.app",
        "*"
    ]

    # LLM & AI Keys
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Vector store path
    VECTOR_STORE_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "vector_store"
    )

    # Supabase (Postgres) persistence
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v_stripped = v.strip()
            if not v_stripped:
                return ["*"]
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    parsed = json.loads(v_stripped)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if item]
                except Exception:
                    pass
            # Fallback for comma-separated strings: "http://localhost:5173,https://kisan-ai.vercel.app"
            return [item.strip() for item in v_stripped.split(",") if item.strip()]
        return ["*"]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
