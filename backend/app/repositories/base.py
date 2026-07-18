from typing import TypeVar, Generic, List, Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.interfaces.repositories import IRepository
from app.database.base_class import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(IRepository[ModelType], Generic[ModelType]):
    def __init__(self, db: AsyncSession, model_class: type[ModelType]):
        self.db = db
        self.model_class = model_class

    async def get_by_id(self, entity_id: UUID) -> Optional[ModelType]:
        result = await self.db.execute(
            select(self.model_class).filter(self.model_class.id == entity_id)
        )
        return result.scalars().first()

    async def list_all(self) -> List[ModelType]:
        result = await self.db.execute(
            select(self.model_class).order_by(self.model_class.created_at.desc())
        )
        return list(result.scalars().all())

    async def add(self, entity: ModelType) -> ModelType:
        self.db.add(entity)
        return entity

    async def remove(self, entity: ModelType) -> None:
        await self.db.delete(entity)
