from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.administration import (
    SystemSetting, PoliceStation, Department, LegalDictionary, TelemetryMetric, ReportMetadata, DashboardPreference
)

class SystemSettingRepository(BaseRepository[SystemSetting]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, SystemSetting)

    async def get_by_key(self, key: str) -> Optional[SystemSetting]:
        stmt = select(SystemSetting).where(SystemSetting.key == key)
        res = await self.db.execute(stmt)
        return res.scalars().first()


class PoliceStationRepository(BaseRepository[PoliceStation]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, PoliceStation)

    async def get_by_code(self, code: str) -> Optional[PoliceStation]:
        stmt = select(PoliceStation).where(PoliceStation.code == code)
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_active_stations(self) -> List[PoliceStation]:
        stmt = select(PoliceStation).where(PoliceStation.is_active == True)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


class DepartmentRepository(BaseRepository[Department]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Department)

    async def get_by_station_id(self, station_id: UUID) -> List[Department]:
        stmt = select(Department).where(Department.station_id == station_id)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


class LegalDictionaryRepository(BaseRepository[LegalDictionary]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, LegalDictionary)

    async def get_section(self, act_name: str, section_code: str) -> Optional[LegalDictionary]:
        stmt = select(LegalDictionary).where(
            LegalDictionary.act_name == act_name,
            LegalDictionary.section_code == section_code
        )
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_active_sections(self) -> List[LegalDictionary]:
        stmt = select(LegalDictionary).where(LegalDictionary.is_active == True)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


class TelemetryMetricRepository(BaseRepository[TelemetryMetric]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, TelemetryMetric)

    async def get_metrics_after(self, start_time) -> List[TelemetryMetric]:
        stmt = select(TelemetryMetric).where(TelemetryMetric.timestamp >= start_time).order_by(TelemetryMetric.timestamp.desc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


class ReportMetadataRepository(BaseRepository[ReportMetadata]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, ReportMetadata)

    async def get_by_officer_id(self, officer_id: UUID) -> List[ReportMetadata]:
        stmt = select(ReportMetadata).where(ReportMetadata.created_by_id == officer_id).order_by(ReportMetadata.created_at.desc())
        res = await self.db.execute(stmt)
        return list(res.scalars().all())


class DashboardPreferenceRepository(BaseRepository[DashboardPreference]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, DashboardPreference)

    async def get_by_officer_id(self, officer_id: UUID) -> Optional[DashboardPreference]:
        stmt = select(DashboardPreference).where(DashboardPreference.officer_id == officer_id)
        res = await self.db.execute(stmt)
        return res.scalars().first()
