from app.core.settings.base import Settings
from pydantic import field_validator

class ProdSettings(Settings):
    APP_ENV: str = "production"
    DEBUG: bool = False
    
    @field_validator("DATABASE_URL")
    @classmethod
    def validate_prod_database_url(cls, v: str) -> str:
        if "localhost" in v or "127.0.0.1" in v:
            raise ValueError("Production database URL must target a secure external host, not localhost.")
        return v
