from typing import Optional
from uuid import UUID
from src.database.models import FIR
from src.domain.interfaces.repositories import IFIRRepository
from src.repositories.base import BaseRepository

class FIRRepository(BaseRepository, IFIRRepository):
    def get_by_case_id(self, case_id: UUID) -> Optional[FIR]:
        return self.db.query(FIR).filter(FIR.case_id == case_id).first()
        
    def create(self, case_id: UUID, fir_number: str, draft_text: str, legal_sections: str) -> FIR:
        fir = FIR(
            case_id=case_id,
            fir_number=fir_number,
            draft_text=draft_text,
            legal_sections=legal_sections,
            status="Approved"
        )
        self.db.add(fir)
        return fir
