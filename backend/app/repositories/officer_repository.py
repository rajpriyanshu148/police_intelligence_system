from typing import List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.officer import Officer


class OfficerRepository(BaseRepository[Officer]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Officer)

    async def get_by_username(self, username: str) -> Optional[Officer]:
        result = await self.db.execute(
            select(Officer).where(Officer.username == username, Officer.is_deleted == False)
        )
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[Officer]:
        result = await self.db.execute(
            select(Officer).where(Officer.email == email, Officer.is_deleted == False)
        )
        return result.scalars().first()

    async def get_by_badge(self, badge_number: str) -> Optional[Officer]:
        result = await self.db.execute(
            select(Officer).where(Officer.badge_number == badge_number, Officer.is_deleted == False)
        )
        return result.scalars().first()

    async def get_active_by_id(self, officer_id: UUID) -> Optional[Officer]:
        result = await self.db.execute(
            select(Officer).where(Officer.id == officer_id, Officer.is_deleted == False)
        )
        return result.scalars().first()

    async def list_officers(
        self,
        role: Optional[str] = None,
        department: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Officer]:
        query = select(Officer).where(Officer.is_deleted == False)
        if role:
            query = query.where(Officer.role == role)
        if department:
            query = query.where(Officer.department == department)
        query = query.order_by(Officer.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_officers(
        self,
        role: Optional[str] = None,
        department: Optional[str] = None,
    ) -> int:
        from sqlalchemy import func
        query = select(func.count()).select_from(Officer).where(Officer.is_deleted == False)
        if role:
            query = query.where(Officer.role == role)
        if department:
            query = query.where(Officer.department == department)
        result = await self.db.execute(query)
        return result.scalar_one()
