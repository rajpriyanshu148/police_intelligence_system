from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.evidence import Evidence, EvidenceVersion


class EvidenceRepository(BaseRepository[Evidence]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Evidence)

    async def get_active_by_id(self, evidence_id: UUID) -> Optional[Evidence]:
        result = await self.db.execute(
            select(Evidence).where(Evidence.id == evidence_id, Evidence.is_deleted == False)
        )
        return result.scalars().first()

    async def list_by_case(self, case_id: UUID, skip: int = 0, limit: int = 50) -> List[Evidence]:
        result = await self.db.execute(
            select(Evidence)
            .where(Evidence.case_id == case_id, Evidence.is_deleted == False)
            .order_by(Evidence.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_case(self, case_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Evidence).where(Evidence.case_id == case_id, Evidence.is_deleted == False)
        )
        return result.scalar_one()

    # ── Versions Sub-repository methods ───────────────────────────────────────

    async def get_versions(self, evidence_id: UUID) -> List[EvidenceVersion]:
        result = await self.db.execute(
            select(EvidenceVersion)
            .where(EvidenceVersion.evidence_id == evidence_id)
            .order_by(EvidenceVersion.version_number.asc())
        )
        return list(result.scalars().all())

    async def get_version_by_number(self, evidence_id: UUID, version_number: int) -> Optional[EvidenceVersion]:
        result = await self.db.execute(
            select(EvidenceVersion)
            .where(EvidenceVersion.evidence_id == evidence_id, EvidenceVersion.version_number == version_number)
        )
        return result.scalars().first()

    async def add_version(self, version: EvidenceVersion) -> EvidenceVersion:
        self.db.add(version)
        return version
