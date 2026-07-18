from app.core.settings.base import Settings

class DevSettings(Settings):
    APP_ENV: str = "development"
    DEBUG: bool = True
