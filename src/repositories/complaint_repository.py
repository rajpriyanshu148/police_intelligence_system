from typing import List, Optional
from uuid import UUID
from src.database.models import Complaint
from src.domain.interfaces.repositories import IComplaintRepository
from src.repositories.base import BaseRepository

class ComplaintRepository(BaseRepository, IComplaintRepository):
    def get_by_id(self, complaint_id: UUID) -> Optional[Complaint]:
        return self.db.query(Complaint).filter(Complaint.id == complaint_id).first()
        
    def list_all(self) -> List[Complaint]:
        return self.db.query(Complaint).order_by(Complaint.created_at.desc()).all()
        
    def create(self, citizen_name: str, citizen_contact: str, complaint_text: str) -> Complaint:
        complaint = Complaint(
            citizen_name=citizen_name,
            citizen_contact=citizen_contact,
            complaint_text=complaint_text,
            status="Pending"
        )
        self.db.add(complaint)
        return complaint
