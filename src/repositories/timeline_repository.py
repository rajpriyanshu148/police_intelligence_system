import datetime
from typing import List, Any
from uuid import UUID
from src.database.models import TimelineEvent
from src.domain.interfaces.repositories import ITimelineRepository
from src.repositories.base import BaseRepository

class TimelineRepository(BaseRepository, ITimelineRepository):
    def get_by_case_id(self, case_id: UUID) -> List[TimelineEvent]:
        return self.db.query(TimelineEvent).filter(TimelineEvent.case_id == case_id).order_by(TimelineEvent.event_time.asc()).all()
        
    def create(self, case_id: UUID, event_time: Any, title: str, description: str) -> TimelineEvent:
        event = TimelineEvent(
            case_id=case_id,
            event_time=event_time,
            title=title,
            description=description
        )
        self.db.add(event)
        return event
