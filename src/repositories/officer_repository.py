from typing import Optional
from uuid import UUID
from src.database.models import Officer
from src.domain.interfaces.repositories import IOfficerRepository
from src.repositories.base import BaseRepository

class OfficerRepository(BaseRepository, IOfficerRepository):
    def get_by_id(self, officer_id: UUID) -> Optional[Officer]:
        return self.db.query(Officer).filter(Officer.id == officer_id).first()
        
    def get_by_username(self, username: str) -> Optional[Officer]:
        return self.db.query(Officer).filter(Officer.username == username).first()
        
    def get_first_officer(self) -> Optional[Officer]:
        return self.db.query(Officer).first()
