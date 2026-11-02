from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Flatly API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./flatly.db"
    
    # Auth
    JWT_SECRET: str = "flatly-super-secret-key-change-in-production-12345"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # AI / LLM Config
    LLM_PROVIDER: str = "ollama"  # ollama or openai
    LLM_BASE_URL: str = "http://127.0.0.1:11434"
    LLM_API_KEY: str = "ollama"
    LLM_MODEL: str = "qwen2.5:1.5b"
    AI_RATE_LIMIT_PER_MINUTE: int = 20

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

