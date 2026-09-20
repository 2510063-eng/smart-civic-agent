import os
from pydantic import BaseModel


class Settings(BaseModel):
    APP_NAME: str = "Smart Civic Issue Resolution Agent - Backend"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./civic_issues.db")
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "*",
    ]


settings = Settings()
