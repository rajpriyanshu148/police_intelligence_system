from typing import List, Optional
from uuid import UUID
from sqlalchemy import func
from src.database.models import Case
from src.domain.interfaces.repositories import ICaseRepository
from src.repositories.base import BaseRepository

class CaseRepository(BaseRepository, ICaseRepository):
    def get_by_id(self, case_id: UUID) -> Optional[Case]:
        return self.db.query(Case).filter(Case.id == case_id).first()
        
    def list_all(self) -> List[Case]:
        return self.db.query(Case).order_by(Case.created_at.desc()).all()
        
    def list_paginated(self, limit: int, offset: int) -> List[Case]:
        return self.db.query(Case).order_by(Case.created_at.desc()).limit(limit).offset(offset).all()
        
    def count(self) -> int:
        return self.db.query(Case).count()
        
    def get_severity_breakdown(self) -> dict:
        query = self.db.query(Case.severity, func.count(Case.id)).group_by(Case.severity).all()
        return {s: count for s, count in query}
        
    def get_status_breakdown(self) -> dict:
        query = self.db.query(Case.status, func.count(Case.id)).group_by(Case.status).all()
        return {s: count for s, count in query}
        
    def get_category_breakdown(self) -> dict:
        query = self.db.query(Case.category, func.count(Case.id)).group_by(Case.category).all()
        return {c: count for c, count in query}
        
    def create(self, complaint_id: UUID, title: str, category: str, severity: str, priority: str, status: str, assigned_officer_id: Optional[UUID], case_number: str) -> Case:
        case = Case(
            complaint_id=complaint_id,
            case_number=case_number,
            title=title,
            category=category,
            severity=severity,
            priority=priority,
            status=status,
            assigned_officer_id=assigned_officer_id
        )
        self.db.add(case)
        return case
