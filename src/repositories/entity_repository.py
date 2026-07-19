from typing import List
from uuid import UUID
from src.database.models import Entity
from src.domain.interfaces.repositories import IEntityRepository
from src.repositories.base import BaseRepository

class EntityRepository(BaseRepository, IEntityRepository):
    def get_by_case_id(self, case_id: UUID) -> List[Entity]:
        return self.db.query(Entity).filter(Entity.case_id == case_id).all()
        
    def create(self, case_id: UUID, entity_type: str, entity_value: str, confidence: float) -> Entity:
        entity = Entity(
            case_id=case_id,
            entity_type=entity_type,
            entity_value=entity_value,
            confidence=confidence
        )
        self.db.add(entity)
        return entity
