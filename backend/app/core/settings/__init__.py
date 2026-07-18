import os
from app.core.settings.development import DevSettings
from app.core.settings.production import ProdSettings
from app.core.settings.testing import TestSettings

env = os.getenv("APP_ENV", "development").lower()

if env == "production":
    settings = ProdSettings()
elif env == "testing":
    settings = TestSettings()
else:
    settings = DevSettings()
