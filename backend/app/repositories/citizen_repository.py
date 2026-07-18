from typing import List, Optional
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.citizen import Citizen


class CitizenRepository(BaseRepository[Citizen]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Citizen)

    async def get_by_phone(self, phone_number: str) -> Optional[Citizen]:
        result = await self.db.execute(
            select(Citizen).where(Citizen.phone_number == phone_number, Citizen.is_deleted == False)
        )
        return result.scalars().first()

    async def get_by_national_id(self, national_id: str) -> Optional[Citizen]:
        result = await self.db.execute(
            select(Citizen).where(Citizen.national_id == national_id, Citizen.is_deleted == False)
        )
        return result.scalars().first()

    async def get_active_by_id(self, citizen_id) -> Optional[Citizen]:
        result = await self.db.execute(
            select(Citizen).where(Citizen.id == citizen_id, Citizen.is_deleted == False)
        )
        return result.scalars().first()

    async def search(self, query: str, skip: int = 0, limit: int = 20) -> List[Citizen]:
        like = f"%{query}%"
        result = await self.db.execute(
            select(Citizen)
            .where(
                Citizen.is_deleted == False,
                or_(
                    Citizen.name.ilike(like),
                    Citizen.phone_number.ilike(like),
                    Citizen.national_id.ilike(like),
                )
            )
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count_search(self, query: str) -> int:
        like = f"%{query}%"
        result = await self.db.execute(
            select(func.count()).select_from(Citizen).where(
                Citizen.is_deleted == False,
                or_(
                    Citizen.name.ilike(like),
                    Citizen.phone_number.ilike(like),
                    Citizen.national_id.ilike(like),
                )
            )
        )
        return result.scalar_one()

    async def list_citizens(self, skip: int = 0, limit: int = 20) -> List[Citizen]:
        result = await self.db.execute(
            select(Citizen).where(Citizen.is_deleted == False)
            .order_by(Citizen.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count_all(self) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Citizen).where(Citizen.is_deleted == False)
        )
        return result.scalar_one()
