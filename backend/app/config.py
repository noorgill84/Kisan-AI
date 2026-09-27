import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "KisanAI Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # CORS settings
    ALLOWED_ORIGINS: list[str] = [
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

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
