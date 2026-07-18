"""
ComplaintService — create, update, assign, status lifecycle, and search.
"""
import json
from typing import List, Optional
from uuid import UUID

from app.domain.exceptions.complaint import (
    ComplaintNotFoundException,
    InvalidComplaintStateException,
)
from app.domain.exceptions.officer import OfficerNotFoundException
from app.models.complaint import Complaint
from app.models.audit import AuditLog
from app.repositories.complaint_repository import ComplaintRepository
from app.repositories.officer_repository import OfficerRepository
from app.repositories.audit_repository import AuditLogRepository

# Valid status lifecycle transitions
_VALID_TRANSITIONS: dict[str, list[str]] = {
    "Pending":      ["Assigned", "Rejected", "Closed"],
    "Assigned":     ["Under Review", "Rejected", "Closed"],
    "Under Review": ["Escalated", "Approved", "Rejected"],
    "Escalated":    ["Under Review", "Approved", "Rejected"],
    "Approved":     ["Closed"],
    "Rejected":     ["Closed"],
    "Closed":       [],
}


class ComplaintService:
    def __init__(
        self,
        complaint_repo: ComplaintRepository,
        officer_repo: OfficerRepository,
        audit_repo: AuditLogRepository,
    ):
        self._complaints = complaint_repo
        self._officers = officer_repo
        self._audit = audit_repo

    async def create_complaint(
        self,
        citizen_name: str,
        citizen_contact: str,
        complaint_text: str,
        actor_id: UUID,
        source: str = "OFFICER_DESK",
        citizen_id: Optional[UUID] = None,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Complaint:
        complaint = Complaint(
            citizen_id=citizen_id,
            citizen_name=citizen_name,
            citizen_contact=citizen_contact,
            complaint_text=complaint_text,
            status="Pending",
            source=source,
        )
        await self._complaints.add(complaint)
        await self._complaints.db.flush()
        await self._log_audit(
            actor_id=actor_id, action="COMPLAINT_CREATE",
            entity_id=complaint.id,
            new_state={"status": "Pending", "source": source},
            request_id=request_id, correlation_id=correlation_id,
        )
        return complaint

    async def update_complaint(
        self,
        complaint_id: UUID,
        actor_id: UUID,
        complaint_text: Optional[str] = None,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Complaint:
        complaint = await self._complaints.get_active_by_id(complaint_id)
        if complaint is None:
            raise ComplaintNotFoundException()
        if complaint.status in ("Closed", "Approved"):
            raise InvalidComplaintStateException("Closed or approved complaints cannot be edited.")

        old = complaint.complaint_text
        if complaint_text is not None:
            complaint.complaint_text = complaint_text

        await self._log_audit(
            actor_id=actor_id, action="COMPLAINT_UPDATE",
            entity_id=complaint_id,
            old_state={"complaint_text": old},
            new_state={"complaint_text": complaint.complaint_text},
            request_id=request_id, correlation_id=correlation_id,
        )
        return complaint

    async def assign_complaint(
        self,
        complaint_id: UUID,
        officer_id: UUID,
        actor_id: UUID,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Complaint:
        complaint = await self._complaints.get_active_by_id(complaint_id)
        if complaint is None:
            raise ComplaintNotFoundException()

        officer = await self._officers.get_active_by_id(officer_id)
        if officer is None:
            raise OfficerNotFoundException("Assigned officer does not exist.")

        old_status = complaint.status
        complaint.assigned_officer_id = officer_id
        complaint.status = "Assigned"

        await self._log_audit(
            actor_id=actor_id, action="COMPLAINT_ASSIGN",
            entity_id=complaint_id,
            old_state={"status": old_status, "assigned_officer_id": None},
            new_state={"status": "Assigned", "assigned_officer_id": str(officer_id)},
            request_id=request_id, correlation_id=correlation_id,
        )
        return complaint

    async def transition_status(
        self,
        complaint_id: UUID,
        new_status: str,
        actor_id: UUID,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Complaint:
        complaint = await self._complaints.get_active_by_id(complaint_id)
        if complaint is None:
            raise ComplaintNotFoundException()

        allowed = _VALID_TRANSITIONS.get(complaint.status, [])
        if new_status not in allowed:
            raise InvalidComplaintStateException(
                f"Cannot transition from '{complaint.status}' to '{new_status}'."
            )

        old_status = complaint.status
        complaint.status = new_status
        await self._log_audit(
            actor_id=actor_id, action="COMPLAINT_STATUS_CHANGE",
            entity_id=complaint_id,
            old_state={"status": old_status},
            new_state={"status": new_status},
            request_id=request_id, correlation_id=correlation_id,
        )
        return complaint

    async def soft_delete_complaint(
        self,
        complaint_id: UUID,
        actor_id: UUID,
        request_id: str = "",
        correlation_id: str = "",
    ) -> None:
        complaint = await self._complaints.get_active_by_id(complaint_id)
        if complaint is None:
            raise ComplaintNotFoundException()
        complaint.is_deleted = True
        await self._log_audit(
            actor_id=actor_id, action="COMPLAINT_DELETE",
            entity_id=complaint_id,
            old_state={"is_deleted": False},
            new_state={"is_deleted": True},
            request_id=request_id, correlation_id=correlation_id,
        )

    async def get_complaint(self, complaint_id: UUID) -> Complaint:
        complaint = await self._complaints.get_active_by_id(complaint_id)
        if complaint is None:
            raise ComplaintNotFoundException()
        return complaint

    async def list_complaints(
        self,
        status: Optional[str] = None,
        assigned_officer_id: Optional[UUID] = None,
        citizen_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Complaint], int]:
        skip = (page - 1) * page_size
        items = await self._complaints.list_complaints(
            status=status, assigned_officer_id=assigned_officer_id,
            citizen_id=citizen_id, skip=skip, limit=page_size,
        )
        total = await self._complaints.count_complaints(
            status=status, assigned_officer_id=assigned_officer_id, citizen_id=citizen_id,
        )
        return items, total

    async def search_complaints(
        self, query: str, page: int = 1, page_size: int = 20
    ) -> tuple[List[Complaint], int]:
        skip = (page - 1) * page_size
        items = await self._complaints.search_complaints(query, skip=skip, limit=page_size)
        return items, len(items)

    # ------------------------------------------------------------------
    async def _log_audit(
        self,
        actor_id: UUID,
        action: str,
        entity_id,
        old_state=None,
        new_state=None,
        request_id: str = "",
        correlation_id: str = "",
    ) -> None:
        log = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type="Complaint",
            entity_id=entity_id,
            old_state=json.dumps(old_state, default=str) if old_state is not None else None,
            new_state=json.dumps(new_state, default=str) if new_state is not None else None,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        await self._audit.add(log)
