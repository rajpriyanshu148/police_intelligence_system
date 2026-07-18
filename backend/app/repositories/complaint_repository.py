from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.complaint import Complaint


class ComplaintRepository(BaseRepository[Complaint]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Complaint)

    async def get_active_by_id(self, complaint_id: UUID) -> Optional[Complaint]:
        result = await self.db.execute(
            select(Complaint).where(Complaint.id == complaint_id, Complaint.is_deleted == False)
        )
        return result.scalars().first()

    async def list_complaints(
        self,
        status: Optional[str] = None,
        assigned_officer_id: Optional[UUID] = None,
        citizen_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Complaint]:
        query = select(Complaint).where(Complaint.is_deleted == False)
        if status:
            query = query.where(Complaint.status == status)
        if assigned_officer_id:
            query = query.where(Complaint.assigned_officer_id == assigned_officer_id)
        if citizen_id:
            query = query.where(Complaint.citizen_id == citizen_id)
        query = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_complaints(
        self,
        status: Optional[str] = None,
        assigned_officer_id: Optional[UUID] = None,
        citizen_id: Optional[UUID] = None,
    ) -> int:
        query = select(func.count()).select_from(Complaint).where(Complaint.is_deleted == False)
        if status:
            query = query.where(Complaint.status == status)
        if assigned_officer_id:
            query = query.where(Complaint.assigned_officer_id == assigned_officer_id)
        if citizen_id:
            query = query.where(Complaint.citizen_id == citizen_id)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def search_complaints(self, query: str, skip: int = 0, limit: int = 20) -> List[Complaint]:
        like = f"%{query}%"
        result = await self.db.execute(
            select(Complaint)
            .where(
                Complaint.is_deleted == False,
                or_(
                    Complaint.complaint_text.ilike(like),
                    Complaint.citizen_name.ilike(like),
                    Complaint.citizen_contact.ilike(like),
                )
            )
            .order_by(Complaint.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def get_complaints_by_citizen(self, citizen_id: UUID) -> List[Complaint]:
        result = await self.db.execute(
            select(Complaint).where(
                Complaint.citizen_id == citizen_id,
                Complaint.is_deleted == False,
            ).order_by(Complaint.created_at.desc())
        )
        return list(result.scalars().all())
