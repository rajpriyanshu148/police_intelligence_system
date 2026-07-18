"""
CaseService — create (from complaint), update, assign, timeline, and case lifecycle.
"""
import datetime
import json
from typing import List, Optional
from uuid import UUID

from app.domain.exceptions.case import (
    CaseNotFoundException,
    CaseAlreadyExistsException,
    CaseClosedException,
    CaseAssignmentException,
)
from app.domain.exceptions.complaint import ComplaintNotFoundException
from app.domain.exceptions.officer import OfficerNotFoundException
from app.domain.exceptions.base import DomainException
from app.models.case import Case, CaseTimelineEvent
from app.models.audit import AuditLog
from app.repositories.case_repository import CaseRepository, CaseTimelineRepository
from app.repositories.complaint_repository import ComplaintRepository
from app.repositories.officer_repository import OfficerRepository
from app.repositories.audit_repository import AuditLogRepository
from app.repositories.fir_repository import FIRRepository

_VALID_CASE_TRANSITIONS: dict[str, list[str]] = {
    "Under Investigation": ["Resolved", "Closed"],
    "Resolved":            ["Closed", "Under Investigation"],
    "Closed":              ["Under Investigation"],  # Transition allowed only if Admin
}


class CaseService:
    def __init__(
        self,
        case_repo: CaseRepository,
        timeline_repo: CaseTimelineRepository,
        complaint_repo: ComplaintRepository,
        officer_repo: OfficerRepository,
        audit_repo: AuditLogRepository,
        fir_repo: Optional[FIRRepository] = None,
    ):
        self._cases = case_repo
        self._timelines = timeline_repo
        self._complaints = complaint_repo
        self._officers = officer_repo
        self._audit = audit_repo
        self._firs = fir_repo

    async def create_case(
        self,
        complaint_id: UUID,
        title: str,
        category: str,
        severity: str,
        priority: str,
        actor_id: UUID,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Case:
        # Validate complaint exists
        complaint = await self._complaints.get_active_by_id(complaint_id)
        if complaint is None:
            raise ComplaintNotFoundException()

        # One complaint → one case rule
        existing = await self._cases.get_by_complaint_id(complaint_id)
        if existing is not None:
            raise CaseAlreadyExistsException()

        # Generate case number: CASE/YYYY/NNNN
        year = datetime.datetime.now(datetime.timezone.utc).year
        seq = await self._cases.get_next_case_sequence()
        case_number = f"CASE/{year}/{seq:04d}"

        case = Case(
            complaint_id=complaint_id,
            case_number=case_number,
            title=title,
            category=category,
            severity=severity,
            priority=priority,
            status="Under Investigation",
            opened_at=datetime.datetime.now(datetime.timezone.utc),
        )
        await self._cases.add(case)
        await self._cases.db.flush()

        # Promote complaint status
        complaint.status = "Approved"

        # Log audit
        await self._log_audit(
            actor_id=actor_id, action="CASE_CREATE",
            entity_id=case.id,
            new_state={"case_number": case_number, "complaint_id": str(complaint_id)},
            request_id=request_id, correlation_id=correlation_id,
        )

        # Timeline event for case creation
        timeline = CaseTimelineEvent(
            case_id=case.id,
            title="Case Registered",
            description=f"Case officially registered and designated as Under Investigation.",
            event_type="GENERAL",
            actor_id=actor_id
        )
        await self._timelines.add(timeline)
        
        return case

    async def update_case(
        self,
        case_id: UUID,
        actor_id: UUID,
        actor_role: str,
        title: Optional[str] = None,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        priority: Optional[str] = None,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Case:
        case = await self._cases.get_active_by_id(case_id)
        if case is None:
            raise CaseNotFoundException()

        self._assert_modifiable(case, actor_id, actor_role)

        old = {"title": case.title, "category": case.category, "severity": case.severity, "priority": case.priority}

        if title is not None:
            case.title = title
        if category is not None:
            case.category = category
        if severity is not None:
            case.severity = severity
        if priority is not None:
            case.priority = priority

        new = {"title": case.title, "category": case.category, "severity": case.severity, "priority": case.priority}
        await self._log_audit(
            actor_id=actor_id, action="CASE_UPDATE",
            entity_id=case_id, old_state=old, new_state=new,
            request_id=request_id, correlation_id=correlation_id,
        )
        return case

    async def assign_case(
        self,
        case_id: UUID,
        officer_id: UUID,
        actor_id: UUID,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Case:
        case = await self._cases.get_active_by_id(case_id)
        if case is None:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException()

        officer = await self._officers.get_active_by_id(officer_id)
        if officer is None:
            raise OfficerNotFoundException("Assigned officer does not exist.")

        old_officer = case.assigned_officer_id
        case.assigned_officer_id = officer_id

        await self._log_audit(
            actor_id=actor_id, action="CASE_ASSIGN",
            entity_id=case_id,
            old_state={"assigned_officer_id": str(old_officer) if old_officer else None},
            new_state={"assigned_officer_id": str(officer_id)},
            request_id=request_id, correlation_id=correlation_id,
        )

        # Timeline event for assignment
        timeline = CaseTimelineEvent(
            case_id=case_id,
            title="Investigator Assigned",
            description=f"Officer '{officer.username}' has been assigned as the lead investigator.",
            event_type="ASSIGNMENT",
            actor_id=actor_id
        )
        await self._timelines.add(timeline)

        return case

    async def transition_status(
        self,
        case_id: UUID,
        new_status: str,
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Case:
        case = await self._cases.get_active_by_id(case_id)
        if case is None:
            raise CaseNotFoundException()

        # Enforce Closed Case Reopening rule: only Administrators can reopen
        if case.status == "Closed":
            if actor_role != "ADMIN":
                raise DomainException(
                    "Only Administrators can reopen a closed case.",
                    code="CASE_006"
                )
        else:
            self._assert_modifiable(case, actor_id, actor_role)

        allowed = _VALID_CASE_TRANSITIONS.get(case.status, [])
        if new_status not in allowed:
            raise DomainException(
                f"Cannot transition case from '{case.status}' to '{new_status}'.",
                code="CASE_005",
            )

        # Enforce Approved FIR rule before Case Closure
        if new_status == "Closed":
            if not self._firs:
                raise DomainException("An approved FIR is required before closing a case.", "FIR_005")
            fir = await self._firs.get_by_case_id(case_id)
            if not fir or fir.status != "Approved":
                raise DomainException("An approved FIR is required before closing a case.", "FIR_005")

        old_status = case.status
        case.status = new_status
        if new_status == "Closed":
            case.closed_at = datetime.datetime.now(datetime.timezone.utc)
        elif old_status == "Closed" and new_status == "Under Investigation":
            case.closed_at = None  # Clear closure time

        await self._log_audit(
            actor_id=actor_id, action="CASE_STATUS_CHANGE",
            entity_id=case_id,
            old_state={"status": old_status},
            new_state={"status": new_status},
            request_id=request_id, correlation_id=correlation_id,
        )

        # Timeline event for transition
        timeline = CaseTimelineEvent(
            case_id=case_id,
            title=f"Case status changed to {new_status}",
            description=f"Case transitioned from '{old_status}' to '{new_status}'.",
            event_type="STATUS_CHANGE",
            actor_id=actor_id
        )
        await self._timelines.add(timeline)

        return case

    async def add_timeline_event(
        self,
        case_id: UUID,
        event_time: datetime.datetime,
        title: str,
        description: str,
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = "",
    ) -> CaseTimelineEvent:
        case = await self._cases.get_active_by_id(case_id)
        if case is None:
            raise CaseNotFoundException()

        self._assert_modifiable(case, actor_id, actor_role)

        event = CaseTimelineEvent(
            case_id=case_id,
            event_time=event_time,
            title=title,
            description=description,
            event_type="NOTE",  # Adding officer notes defaults to event type NOTE
            actor_id=actor_id
        )
        await self._timelines.add(event)
        return event

    async def get_case(self, case_id: UUID) -> Case:
        case = await self._cases.get_active_by_id(case_id)
        if case is None:
            raise CaseNotFoundException()
        return case

    async def get_timeline(self, case_id: UUID) -> List[CaseTimelineEvent]:
        case = await self._cases.get_active_by_id(case_id)
        if case is None:
            raise CaseNotFoundException()
        return await self._timelines.get_events_for_case(case_id)

    async def list_cases(
        self,
        status: Optional[str] = None,
        assigned_officer_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Case], int]:
        skip = (page - 1) * page_size
        items = await self._cases.list_cases(
            status=status, assigned_officer_id=assigned_officer_id,
            skip=skip, limit=page_size,
        )
        total = await self._cases.count_cases(
            status=status, assigned_officer_id=assigned_officer_id,
        )
        return items, total

    async def soft_delete_case(
        self,
        case_id: UUID,
        actor_id: UUID,
        request_id: str = "",
        correlation_id: str = "",
    ) -> None:
        case = await self._cases.get_active_by_id(case_id)
        if case is None:
            raise CaseNotFoundException()
        case.is_deleted = True
        await self._log_audit(
            actor_id=actor_id, action="CASE_DELETE",
            entity_id=case_id,
            old_state={"is_deleted": False}, new_state={"is_deleted": True},
            request_id=request_id, correlation_id=correlation_id,
        )

    # ------------------------------------------------------------------

    def _assert_modifiable(self, case: Case, actor_id: UUID, actor_role: str) -> None:
        """Closed cases block all writes except for ADMIN overrides."""
        if case.status == "Closed" and actor_role != "ADMIN":
            raise CaseClosedException()
        # Investigators can only modify their own assigned cases
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException()

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
            entity_type="Case",
            entity_id=entity_id,
            old_state=json.dumps(old_state, default=str) if old_state is not None else None,
            new_state=json.dumps(new_state, default=str) if new_state is not None else None,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        await self._audit.add(log)
