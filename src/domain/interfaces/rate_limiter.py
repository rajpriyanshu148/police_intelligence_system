from abc import ABC, abstractmethod

class IRateLimiter(ABC):
    @abstractmethod
    def is_allowed(self, client_id: str) -> bool:
        """Determines if the client request is permitted under rate limit boundaries."""
        pass
