from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "AIPAS Backend"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Security Config
    JWT_SECRET_KEY: str = "AIPAS_BACKEND_SECRET_KEY_JWT_123!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60          # 1 hour for access tokens
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7             # 7 days for refresh tokens

    # Account Lockout Policy
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_MINUTES: int = 15

    # Database Connection
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/aipas"

    # CORS configuration
    CORS_ORIGINS: list[str] = ["*"]

    # Storage Layer Configuration
    STORAGE_BACKEND: str = "local"                 # "local" or "s3"
    LOCAL_STORAGE_ROOT: str = "storage_root"
    S3_BUCKET_NAME: str = "aipas-evidence-bucket"
    S3_REGION: str = "us-east-1"

    # AI Service Config
    AI_SERVICE_URL: str = ""
    AI_SERVICE_API_KEY: str = "mock_api_key_123!"
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.82

