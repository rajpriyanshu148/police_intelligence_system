from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.fir import FIR, FIRVersion


class FIRRepository(BaseRepository[FIR]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, FIR)

    async def get_active_by_id(self, fir_id: UUID) -> Optional[FIR]:
        result = await self.db.execute(
            select(FIR).where(FIR.id == fir_id, FIR.is_deleted == False)
        )
        return result.scalars().first()

    async def get_by_case_id(self, case_id: UUID) -> Optional[FIR]:
        result = await self.db.execute(
            select(FIR).where(FIR.case_id == case_id, FIR.is_deleted == False)
        )
        return result.scalars().first()

    async def get_by_fir_number(self, fir_number: str) -> Optional[FIR]:
        result = await self.db.execute(
            select(FIR).where(func.lower(FIR.fir_number) == fir_number.lower(), FIR.is_deleted == False)
        )
        return result.scalars().first()

    # ── Amendments Sub-repository methods ─────────────────────────────────────

    async def get_amendments(self, fir_id: UUID) -> List[FIRVersion]:
        result = await self.db.execute(
            select(FIRVersion)
            .where(FIRVersion.fir_id == fir_id)
            .order_by(FIRVersion.version_number.asc())
        )
        return list(result.scalars().all())

    async def add_amendment(self, amendment: FIRVersion) -> FIRVersion:
        self.db.add(amendment)
        return amendment

    async def get_next_sequence_number(self, station_code: str, year: int) -> int:
        """Calculate the next sequence number by counting approved FIRs for the station in the current year."""
        # Find matches using SQL like: 'FIR/{station_code}/{year}/%'
        pattern = f"FIR/{station_code}/{year}/%"
        result = await self.db.execute(
            select(func.count()).select_from(FIR).where(FIR.fir_number.like(pattern))
        )
        return result.scalar_one() + 1
