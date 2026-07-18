from typing import Optional
from app.domain.interfaces.cache import ICache

class MemoryCache(ICache):
    def __init__(self):
        self._store = {}

    async def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    async def set(self, key: str, value: str, expire_seconds: int = 60) -> None:
        self._store[key] = value

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)
