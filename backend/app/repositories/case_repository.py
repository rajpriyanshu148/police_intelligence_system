from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.case import Case, CaseTimelineEvent


class CaseRepository(BaseRepository[Case]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Case)

    async def get_active_by_id(self, case_id: UUID) -> Optional[Case]:
        result = await self.db.execute(
            select(Case).where(Case.id == case_id, Case.is_deleted == False)
        )
        return result.scalars().first()

    async def get_by_complaint_id(self, complaint_id: UUID) -> Optional[Case]:
        result = await self.db.execute(
            select(Case).where(Case.complaint_id == complaint_id, Case.is_deleted == False)
        )
        return result.scalars().first()

    async def get_by_case_number(self, case_number: str) -> Optional[Case]:
        result = await self.db.execute(
            select(Case).where(Case.case_number == case_number, Case.is_deleted == False)
        )
        return result.scalars().first()

    async def list_cases(
        self,
        status: Optional[str] = None,
        assigned_officer_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Case]:
        query = select(Case).where(Case.is_deleted == False)
        if status:
            query = query.where(Case.status == status)
        if assigned_officer_id:
            query = query.where(Case.assigned_officer_id == assigned_officer_id)
        query = query.order_by(Case.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_cases(
        self,
        status: Optional[str] = None,
        assigned_officer_id: Optional[UUID] = None,
    ) -> int:
        query = select(func.count()).select_from(Case).where(Case.is_deleted == False)
        if status:
            query = query.where(Case.status == status)
        if assigned_officer_id:
            query = query.where(Case.assigned_officer_id == assigned_officer_id)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_next_case_sequence(self) -> int:
        """Get next sequence number for case_number generation."""
        result = await self.db.execute(select(func.count()).select_from(Case))
        return result.scalar_one() + 1


class CaseTimelineRepository(BaseRepository[CaseTimelineEvent]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, CaseTimelineEvent)

    async def get_events_for_case(self, case_id: UUID) -> List[CaseTimelineEvent]:
        result = await self.db.execute(
            select(CaseTimelineEvent)
            .where(CaseTimelineEvent.case_id == case_id)
            .order_by(CaseTimelineEvent.event_time.asc())
        )
        return list(result.scalars().all())
