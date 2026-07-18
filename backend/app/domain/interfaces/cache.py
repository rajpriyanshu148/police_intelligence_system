from abc import ABC, abstractmethod
from typing import Optional

class ICache(ABC):
    @abstractmethod
    async def get(self, key: str) -> Optional[str]:
        pass

    @abstractmethod
    async def set(self, key: str, value: str, expire_seconds: int = 60) -> None:
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        pass
