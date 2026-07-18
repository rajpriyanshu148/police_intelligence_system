from typing import Any, Callable
from fastapi import BackgroundTasks
from app.domain.interfaces.queue import IBackgroundQueue
import uuid

class FastApiBackgroundQueue(IBackgroundQueue):
    def __init__(self, background_tasks: BackgroundTasks):
        self.background_tasks = background_tasks

    async def enqueue(self, task_func: Callable[..., Any], *args: Any, **kwargs: Any) -> str:
        task_id = str(uuid.uuid4())
        self.background_tasks.add_task(task_func, *args, **kwargs)
        return task_id
