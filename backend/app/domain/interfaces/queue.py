from abc import ABC, abstractmethod
from typing import Any, Callable

class IBackgroundQueue(ABC):
    @abstractmethod
    async def enqueue(self, task_func: Callable[..., Any], *args: Any, **kwargs: Any) -> str:
        """Enqueue task execution in a background worker context, returning task identifier."""
        pass
