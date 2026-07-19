from typing import List, Optional, Dict, Any
from uuid import UUID
from src.repositories.unit_of_work import UnitOfWork
from src.database.models import Complaint, Case

class CaseService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def list_complaints(self) -> List[Complaint]:
        with self.uow as uow:
            return uow.complaints.list_all()

    def create_complaint(self, citizen_name: str, citizen_contact: str, complaint_text: str) -> Complaint:
        with self.uow as uow:
            complaint = uow.complaints.create(citizen_name, citizen_contact, complaint_text)
            uow.commit()
            uow.db.refresh(complaint)
            return complaint

    def list_cases(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        with self.uow as uow:
            total_count = uow.cases.count()
            offset = (page - 1) * page_size
            cases = uow.cases.list_paginated(limit=page_size, offset=offset)
            formatted_cases = []
            for c in cases:
                formatted_cases.append({
                    "id": c.id,
                    "case_number": c.case_number,
                    "title": c.title,
                    "category": c.category,
                    "severity": c.severity,
                    "priority": c.priority,
                    "status": c.status,
                    "created_at": c.created_at,
                    "assigned_officer": c.assigned_officer.username if c.assigned_officer else "Unassigned"
                })
            total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
            return {
                "items": formatted_cases,
                "pagination": {
                    "total_count": total_count,
                    "page": page,
                    "page_size": page_size,
                    "total_pages": total_pages
                }
            }

    def get_case_details(self, case_id: UUID) -> Optional[Dict[str, Any]]:
        with self.uow as uow:
            case = uow.cases.get_by_id(case_id)
            if not case:
                return None
            
            fir = uow.firs.get_by_case_id(case.id)
            entities = uow.entities.get_by_case_id(case.id)
            timeline = uow.timelines.get_by_case_id(case.id)
            
            return {
                "id": case.id,
                "case_number": case.case_number,
                "title": case.title,
                "category": case.category,
                "severity": case.severity,
                "priority": case.priority,
                "status": case.status,
                "created_at": case.created_at,
                "assigned_officer": case.assigned_officer.username if case.assigned_officer else "Unassigned",
                "complaint": {
                    "citizen_name": case.complaint.citizen_name,
                    "citizen_contact": case.complaint.citizen_contact,
                    "complaint_text": case.complaint.complaint_text,
                    "created_at": case.complaint.created_at
                },
                "fir": {
                    "fir_number": fir.fir_number if fir else "N/A",
                    "draft_text": fir.draft_text if fir else "",
                    "legal_sections": fir.legal_sections if fir else "",
                    "status": fir.status if fir else "N/A"
                } if fir else None,
                "entities": [{"type": e.entity_type, "value": e.entity_value, "confidence": e.confidence} for e in entities],
                "timeline": [{"id": t.id, "event_time": t.event_time, "title": t.title, "description": t.description} for t in timeline]
            }

    def get_analytics(self) -> Dict[str, Any]:
        with self.uow as uow:
            total_cases = uow.cases.count()
            total_complaints = uow.complaints.list_all()
            total_complaints_count = len(total_complaints)
            pending_count = sum(1 for c in total_complaints if c.status == "Pending")
            
            severity_breakdown = uow.cases.get_severity_breakdown()
            status_breakdown = uow.cases.get_status_breakdown()
            category_breakdown = uow.cases.get_category_breakdown()
            
            sorted_complaints = sorted(total_complaints, key=lambda x: x.created_at, reverse=True)[:5]
            
            return {
                "counters": {
                    "total_cases": total_cases,
                    "total_complaints": total_complaints_count,
                    "pending_complaints": pending_count
                },
                "severity_breakdown": severity_breakdown,
                "status_breakdown": status_breakdown,
                "category_breakdown": category_breakdown,
                "recent_complaints": [
                    {
                        "id": comp.id,
                        "citizen_name": comp.citizen_name,
                        "created_at": comp.created_at,
                        "status": comp.status,
                        "text_snippet": comp.complaint_text[:60] + "..." if len(comp.complaint_text) > 60 else comp.complaint_text
                    }
                    for comp in sorted_complaints
                ]
            }
