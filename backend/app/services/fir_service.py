import datetime
import json
from typing import List, Optional
from uuid import UUID

from app.domain.exceptions.case import CaseNotFoundException, CaseClosedException, CaseAssignmentException
from app.domain.exceptions.base import DomainException
from app.models.fir import FIR, FIRVersion
from app.models.case import CaseTimelineEvent
from app.models.audit import AuditLog
from app.repositories.fir_repository import FIRRepository
from app.repositories.case_repository import CaseRepository, CaseTimelineRepository
from app.repositories.audit_repository import AuditLogRepository
from app.repositories.officer_repository import OfficerRepository


class FIRService:
    def __init__(
        self,
        fir_repo: FIRRepository,
        case_repo: CaseRepository,
        timeline_repo: CaseTimelineRepository,
        audit_repo: AuditLogRepository,
        officer_repo: OfficerRepository,
    ):
        self._fir = fir_repo
        self._cases = case_repo
        self._timeline = timeline_repo
        self._audit = audit_repo
        self._officers = officer_repo

    async def create_fir_draft(
        self,
        case_id: UUID,
        complainant_name: str,
        complainant_contact: str,
        incident_date: datetime.datetime,
        incident_place: str,
        acts_sections: str,
        details: str,
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = "",
    ) -> FIR:
        # Validate Case exists
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot file an FIR for a closed case.")

        # Investigator authorization check
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can file an FIR draft.")

        # Enforce maximum of one FIR per Case
        existing = await self._fir.get_by_case_id(case_id)
        if existing:
            raise DomainException("An FIR already exists for this case.", "FIR_002")

        # Create Draft FIR
        fir = FIR(
            case_id=case_id,
            fir_number=f"FIR/DRAFT/{case_id}",
            status="Draft",
            complainant_name=complainant_name,
            complainant_contact=complainant_contact,
            incident_date=incident_date,
            incident_place=incident_place,
            acts_sections=acts_sections,
            details=details,
            created_by_id=actor_id,
            version_number=1
        )
        await self._fir.add(fir)
        await self._fir.db.flush()

        # Audit event
        audit = AuditLog(
            actor_id=actor_id,
            action="FIR_DRAFT_CREATE",
            entity_type="FIR",
            entity_id=fir.id,
            old_state=None,
            new_state=json.dumps({"status": "Draft", "case_id": str(case_id)}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        # Timeline event
        timeline = CaseTimelineEvent(
            case_id=case_id,
            title="FIR Draft Created",
            description=f"FIR draft authored by Officer.",
            event_type="GENERAL",
            actor_id=actor_id,
            fir_id=fir.id
        )
        await self._timeline.add(timeline)
        return fir

    async def update_fir_draft(
        self,
        case_id: UUID,
        actor_id: UUID,
        actor_role: str,
        acts_sections: Optional[str] = None,
        details: Optional[str] = None,
        request_id: str = "",
        correlation_id: str = "",
    ) -> FIR:
        # Validate Case exists
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot modify FIR on a closed case.")

        # Retrieve FIR
        fir = await self._fir.get_by_case_id(case_id)
        if not fir:
            raise DomainException("FIR record not found.", "FIR_001")

        # Allow edits only while Draft or Returned
        if fir.status not in ("Draft", "Returned"):
            raise DomainException(f"Cannot edit FIR in status '{fir.status}'. Only Draft or Returned FIRs can be edited.", "FIR_003")

        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can edit this FIR.")

        # Save amendment version history before modifying (immutable version tracking)
        amendment = FIRVersion(
            fir_id=fir.id,
            version_number=fir.version_number,
            acts_sections=fir.acts_sections,
            details=fir.details,
            modified_by_id=actor_id
        )
        await self._fir.add_amendment(amendment)

        # Apply changes
        old_sections = fir.acts_sections
        old_details = fir.details
        if acts_sections is not None:
            fir.acts_sections = acts_sections
        if details is not None:
            fir.details = details
        fir.version_number += 1

        await self._fir.db.flush()

        # Audit amendment
        audit = AuditLog(
            actor_id=actor_id,
            action="FIR_AMENDMENT",
            entity_type="FIR",
            entity_id=fir.id,
            old_state=json.dumps({"acts_sections": old_sections, "details": old_details, "version_number": fir.version_number - 1}),
            new_state=json.dumps({"acts_sections": fir.acts_sections, "details": fir.details, "version_number": fir.version_number}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)
        return fir

    async def submit_fir_for_review(
        self,
        case_id: UUID,
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = "",
    ) -> FIR:
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot submit FIR on a closed case.")

        fir = await self._fir.get_by_case_id(case_id)
        if not fir:
            raise DomainException("FIR record not found.", "FIR_001")

        if fir.status not in ("Draft", "Returned"):
            raise DomainException(f"Cannot submit FIR in status '{fir.status}'.", "FIR_003")

        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can submit this FIR.")

        old_status = fir.status
        fir.status = "Submitted"

        # Audit
        audit = AuditLog(
            actor_id=actor_id,
            action="FIR_SUBMIT",
            entity_type="FIR",
            entity_id=fir.id,
            old_state=json.dumps({"status": old_status}),
            new_state=json.dumps({"status": "Submitted"}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        # Timeline event
        timeline = CaseTimelineEvent(
            case_id=case_id,
            title="FIR Submitted for Review",
            description=f"FIR draft version {fir.version_number} submitted to Supervisor.",
            event_type="FIR_SUBMIT",
            actor_id=actor_id,
            fir_id=fir.id
        )
        await self._timeline.add(timeline)
        return fir

    async def review_fir(
        self,
        case_id: UUID,
        approved: bool,
        feedback: str,
        actor_id: UUID,
        actor_role: str,
        action: str = "APPROVE",
        request_id: str = "",
        correlation_id: str = "",
    ) -> FIR:
        # Only ADMIN or SUPERVISOR can review FIRs
        if actor_role not in ("ADMIN", "SUPERVISOR"):
            raise CaseAssignmentException("Only supervisors or administrators can review FIRs.")

        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot review FIR on a closed case.")

        fir = await self._fir.get_by_case_id(case_id)
        if not fir:
            raise DomainException("FIR record not found.", "FIR_001")

        if fir.status != "Submitted":
            raise DomainException(f"Cannot review FIR in status '{fir.status}'. Awaiting submission first.", "FIR_004")

        old_status = fir.status
        if approved and action == "APPROVE":
            fir.status = "Approved"
            
            # Generate official FIR Number
            # We derive station code from investigator's department or default to HQ
            creator = await self._officers.get_active_by_id(fir.created_by_id)
            station_code = creator.department if creator else "HQ"
            # Sanitize station code (e.g. replace spaces and convert upper)
            station_code = "".join(filter(str.isalnum, station_code)).upper()
            year = datetime.datetime.now(datetime.timezone.utc).year
            seq = await self._fir.get_next_sequence_number(station_code, year)
            fir.fir_number = f"FIR/{station_code}/{year}/{seq:04d}"
            
            fir.approved_by_id = actor_id
            fir.approved_at = datetime.datetime.now(datetime.timezone.utc)
            
            timeline_title = "FIR Approved"
            timeline_type = "FIR_APPROVE"
            timeline_desc = f"FIR approved by Supervisor and registered officially under {fir.fir_number}. Feedback: {feedback}"
        else:
            # Action: RETURN (request correction) or REJECT
            if action == "RETURN":
                fir.status = "Returned"
                timeline_title = "FIR Returned for Correction"
                timeline_type = "GENERAL"
                timeline_desc = f"FIR draft returned by Supervisor for correction. Feedback: {feedback}"
            else:
                fir.status = "Rejected"
                timeline_title = "FIR Rejected"
                timeline_type = "FIR_REJECT" if hasattr(CaseTimelineEvent, "FIR_REJECT") else "GENERAL"
                # Wait, timeline event types whitelisted in standard: note event upload etc.
                # Let's map it safely.
                timeline_type = "GENERAL"
                timeline_desc = f"FIR draft rejected by Supervisor. Feedback: {feedback}"

        await self._fir.db.flush()

        # Audit review
        audit = AuditLog(
            actor_id=actor_id,
            action="FIR_REVIEW",
            entity_type="FIR",
            entity_id=fir.id,
            old_state=json.dumps({"status": old_status}),
            new_state=json.dumps({"status": fir.status, "fir_number": fir.fir_number}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        # Timeline event
        timeline = CaseTimelineEvent(
            case_id=case_id,
            title=timeline_title,
            description=timeline_desc,
            event_type=timeline_type,
            actor_id=actor_id,
            fir_id=fir.id
        )
        await self._timeline.add(timeline)
        return fir

    async def get_fir_by_case(self, case_id: UUID) -> FIR:
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        fir = await self._fir.get_by_case_id(case_id)
        if not fir:
            raise DomainException("FIR record not found for this case.", "FIR_001")
        return fir

    async def get_fir_history(self, case_id: UUID) -> List[FIRVersion]:
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        fir = await self._fir.get_by_case_id(case_id)
        if not fir:
            raise DomainException("FIR record not found.", "FIR_001")
        return await self._fir.get_amendments(fir.id)
