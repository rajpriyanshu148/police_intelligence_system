from app.core.settings.base import Settings

class TestSettings(Settings):
    APP_ENV: str = "testing"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///:memory:"
