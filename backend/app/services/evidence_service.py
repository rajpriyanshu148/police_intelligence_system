import datetime
import json
import uuid
import os
from typing import List, Optional
from uuid import UUID

from app.domain.exceptions.case import CaseNotFoundException, CaseClosedException, CaseAssignmentException
from app.domain.exceptions.base import DomainException
from app.domain.interfaces.storage import IStorageService
from app.models.evidence import Evidence, EvidenceVersion
from app.models.case import CaseTimelineEvent
from app.models.audit import AuditLog
from app.repositories.evidence_repository import EvidenceRepository
from app.repositories.case_repository import CaseRepository, CaseTimelineRepository
from app.repositories.audit_repository import AuditLogRepository
from app.api.v1.schemas.evidence import PresignedUploadResponse, PresignedDownloadResponse


class EvidenceService:
    def __init__(
        self,
        evidence_repo: EvidenceRepository,
        case_repo: CaseRepository,
        timeline_repo: CaseTimelineRepository,
        audit_repo: AuditLogRepository,
        storage_service: IStorageService,
    ):
        self._evidence = evidence_repo
        self._cases = case_repo
        self._timeline = timeline_repo
        self._audit = audit_repo
        self._storage = storage_service

    async def get_upload_url(
        self,
        case_id: UUID,
        file_name: str,
        file_size: int,
        mime_type: str,
        category: str,
        title: str,
        description: str,
        actor_id: UUID,
        actor_role: str,
        evidence_id: Optional[UUID] = None,
        captured_at: Optional[datetime.datetime] = None,
        gps_location: Optional[str] = None,
        device_model: Optional[str] = None,
        exif_present: Optional[bool] = None,
    ) -> PresignedUploadResponse:
        # Validate case
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()

        # Enforce Case Status rule (evidence cannot be uploaded after case closure)
        if case.status == "Closed":
            raise CaseClosedException("Cannot upload evidence to a closed case.")

        # Enforce investigator assignment check
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can upload evidence.")

        # Resolve version number
        if evidence_id:
            existing = await self._evidence.get_active_by_id(evidence_id)
            if not existing:
                raise DomainException("Evidence record not found.", "EVIDENCE_001")
            version_number = existing.current_version + 1
        else:
            evidence_id = uuid.uuid4()
            version_number = 1

        # Generate secure path
        ext = os.path.splitext(file_name)[1] if hasattr(os, "path") else ".dat"
        if not ext:
            ext = ".dat"
        random_uuid = uuid.uuid4()
        storage_path = f"cases/{case_id}/evidence/{evidence_id}/{version_number}/{random_uuid}{ext}"

        # Generate presigned upload URL
        upload_url = await self._storage.generate_presigned_upload_url(storage_path, mime_type, file_size)

        # Temporary metadata cache or return parameters for confirmation
        return PresignedUploadResponse(
            upload_url=upload_url,
            storage_path=storage_path,
            evidence_id=evidence_id,
            version_number=version_number
        )

    async def confirm_upload(
        self,
        case_id: UUID,
        evidence_id: UUID,
        version_number: int,
        storage_path: str,
        sha256_hash: str,
        title: str,
        description: str,
        category: str,
        file_name: str,
        file_size: int,
        mime_type: str,
        actor_id: UUID,
        actor_role: str,
        captured_at: Optional[datetime.datetime] = None,
        gps_location: Optional[str] = None,
        device_model: Optional[str] = None,
        exif_present: Optional[bool] = None,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Evidence:
        # Validate case
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot modify evidence on a closed case.")
            
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can modify evidence.")

        # Find or create logical evidence
        evidence = await self._evidence.get_active_by_id(evidence_id)
        is_new = False
        if not evidence:
            if version_number != 1:
                raise DomainException("Invalid version sequence for new evidence.", "EVIDENCE_003")
            evidence = Evidence(
                id=evidence_id,
                case_id=case_id,
                title=title,
                category=category,
                description=description,
                status="VERIFIED",  # Transitioning to VERIFIED status once confirmed
                current_version=1
            )
            is_new = True
            await self._evidence.add(evidence)
        else:
            if version_number != evidence.current_version + 1:
                raise DomainException("Out of order version confirmation.", "EVIDENCE_004")
            evidence.current_version = version_number
            evidence.status = "VERIFIED"

        # Create version record (immutable metadata)
        version = EvidenceVersion(
            evidence_id=evidence_id,
            version_number=version_number,
            storage_path=storage_path,
            file_name=file_name,
            mime_type=mime_type,
            file_size=file_size,
            sha256_hash=sha256_hash,
            hash_algorithm="SHA-256",
            uploaded_by=actor_id,
            scan_status="CLEAN",  # Initialized clean status
            original_filename=file_name,
            captured_at=captured_at,
            gps_location=gps_location,
            device_model=device_model,
            exif_present=exif_present
        )
        await self._evidence.add_version(version)
        
        # Flush session to fetch DB defaults
        await self._evidence.db.flush()

        # Audit upload confirmation
        action = "EVIDENCE_CREATE" if is_new else "EVIDENCE_UPDATE"
        audit = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type="Evidence",
            entity_id=evidence_id,
            old_state=None if is_new else json.dumps({"current_version": version_number - 1}),
            new_state=json.dumps({"current_version": version_number, "storage_path": storage_path}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        # Append Case Timeline event
        timeline_type = "EVIDENCE_ADD" if is_new else "EVIDENCE_UPDATE"
        timeline_title = f"Evidence Uploaded: {title}" if is_new else f"Evidence Version {version_number} Created: {title}"
        timeline = CaseTimelineEvent(
            case_id=case_id,
            title=timeline_title,
            description=f"Evidence category '{category}' version {version_number} registered by Officer.",
            event_type=timeline_type,
            actor_id=actor_id,
            evidence_id=evidence_id
        )
        await self._timeline.add(timeline)
        return evidence

    async def get_download_url(
        self,
        case_id: UUID,
        evidence_id: UUID,
        actor_id: UUID,
        actor_role: str,
        version_number: Optional[int] = None,
        download_ip: str = "unknown",
        download_reason: str = "Investigation review",
        download_device: str = "unknown",
        request_id: str = "",
        correlation_id: str = "",
    ) -> PresignedDownloadResponse:
        # Authorization check: case must exist
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()

        # Investigators can only download evidence for their assigned cases
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can download evidence.")

        # Retrieve evidence
        evidence = await self._evidence.get_active_by_id(evidence_id)
        if not evidence:
            raise DomainException("Evidence record not found.", "EVIDENCE_001")

        # Resolve version
        ver_num = version_number or evidence.current_version
        version = await self._evidence.get_version_by_number(evidence_id, ver_num)
        if not version:
            raise DomainException(f"Evidence version {ver_num} not found.", "EVIDENCE_005")

        # Generate download URL from storage service
        download_url = await self._storage.generate_presigned_download_url(version.storage_path)

        # Audit download event carrying metadata
        audit = AuditLog(
            actor_id=actor_id,
            action="EVIDENCE_DOWNLOAD",
            entity_type="EvidenceVersion",
            entity_id=version.id,
            old_state=None,
            new_state=json.dumps({
                "evidence_id": str(evidence_id),
                "version_number": ver_num,
                "download_ip": download_ip,
                "download_reason": download_reason,
                "download_device": download_device
            }),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        return PresignedDownloadResponse(
            download_url=download_url,
            sha256_hash=version.sha256_hash,
            hash_algorithm=version.hash_algorithm
        )

    async def soft_delete_evidence(
        self,
        case_id: UUID,
        evidence_id: UUID,
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = "",
    ) -> None:
        # Only ADMIN or SUPERVISOR can soft delete evidence
        if actor_role not in ("ADMIN", "SUPERVISOR"):
            raise CaseAssignmentException("Only administrators or supervisors can delete evidence.")

        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot modify evidence on a closed case.")

        evidence = await self._evidence.get_active_by_id(evidence_id)
        if not evidence:
            raise DomainException("Evidence record not found.", "EVIDENCE_001")

        evidence.is_deleted = True
        evidence.status = "SOFT_DELETED"

        # Audit deletion
        audit = AuditLog(
            actor_id=actor_id,
            action="EVIDENCE_DELETE",
            entity_type="Evidence",
            entity_id=evidence_id,
            old_state=json.dumps({"is_deleted": False}),
            new_state=json.dumps({"is_deleted": True}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        # Timeline event
        timeline = CaseTimelineEvent(
            case_id=case_id,
            title="Evidence Deleted",
            description=f"Evidence '{evidence.title}' soft-deleted by Officer.",
            event_type="STATUS_CHANGE",
            actor_id=actor_id,
            evidence_id=evidence_id
        )
        await self._timeline.add(timeline)

    async def list_evidence(self, case_id: UUID) -> List[Evidence]:
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        return await self._evidence.list_by_case(case_id)

    async def get_versions(self, case_id: UUID, evidence_id: UUID) -> List[EvidenceVersion]:
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        evidence = await self._evidence.get_active_by_id(evidence_id)
        if not evidence:
            raise DomainException("Evidence record not found.", "EVIDENCE_001")
        return await self._evidence.get_versions(evidence_id)
