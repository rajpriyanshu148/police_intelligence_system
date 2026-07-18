from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.ai_integration import AICaseAnalysis, AIFIRSuggestion, AILegalRecommendation

class AICaseAnalysisRepository(BaseRepository[AICaseAnalysis]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, AICaseAnalysis)

    async def get_by_case_id(self, case_id: UUID) -> Optional[AICaseAnalysis]:
        stmt = select(AICaseAnalysis).where(
            AICaseAnalysis.case_id == case_id,
            AICaseAnalysis.review_status == "Draft"
        ).order_by(AICaseAnalysis.created_at.desc())
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_active_by_id(self, pk: UUID) -> Optional[AICaseAnalysis]:
        stmt = select(AICaseAnalysis).where(AICaseAnalysis.id == pk)
        res = await self.db.execute(stmt)
        return res.scalars().first()


class AIFIRSuggestionRepository(BaseRepository[AIFIRSuggestion]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, AIFIRSuggestion)

    async def get_by_case_id(self, case_id: UUID) -> Optional[AIFIRSuggestion]:
        stmt = select(AIFIRSuggestion).where(
            AIFIRSuggestion.case_id == case_id,
            AIFIRSuggestion.review_status == "Draft"
        ).order_by(AIFIRSuggestion.created_at.desc())
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_active_by_id(self, pk: UUID) -> Optional[AIFIRSuggestion]:
        stmt = select(AIFIRSuggestion).where(AIFIRSuggestion.id == pk)
        res = await self.db.execute(stmt)
        return res.scalars().first()


class AILegalRecommendationRepository(BaseRepository[AILegalRecommendation]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, AILegalRecommendation)

    async def get_by_case_id(self, case_id: UUID) -> Optional[AILegalRecommendation]:
        stmt = select(AILegalRecommendation).where(
            AILegalRecommendation.case_id == case_id,
            AILegalRecommendation.review_status == "Draft"
        ).order_by(AILegalRecommendation.created_at.desc())
        res = await self.db.execute(stmt)
        return res.scalars().first()

    async def get_active_by_id(self, pk: UUID) -> Optional[AILegalRecommendation]:
        stmt = select(AILegalRecommendation).where(AILegalRecommendation.id == pk)
        res = await self.db.execute(stmt)
        return res.scalars().first()
