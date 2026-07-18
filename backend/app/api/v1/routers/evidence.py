from typing import List, Optional
from uuid import UUID
import datetime
from fastapi import APIRouter, Depends, Request, Query, status

from app.api.dependencies.auth import get_current_officer, require_roles
from app.api.dependencies.services import get_evidence_service
from app.api.dependencies.repositories import get_unit_of_work
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.models.officer import Officer
from app.services.evidence_service import EvidenceService
from app.api.v1.schemas.common import ok
from app.api.v1.schemas.evidence import (
    CreateEvidenceUploadRequest, ConfirmEvidenceUploadRequest,
    EvidenceOut, EvidenceVersionOut, PresignedUploadResponse, PresignedDownloadResponse
)

router = APIRouter(prefix="/cases", tags=["Evidence Management"])

_ALL_ROLES = ("ADMIN", "SUPERVISOR", "INVESTIGATOR")


@router.post("/{case_id}/evidence/upload-url", summary="Request upload presigned URL")
async def get_upload_url(
    case_id: UUID,
    body: CreateEvidenceUploadRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: EvidenceService = Depends(get_evidence_service),
    evidence_id: Optional[UUID] = Query(None, description="Provide to upload a new version for existing evidence")
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    upload_data = await service.get_upload_url(
        case_id=case_id,
        file_name=body.file_name,
        file_size=body.file_size,
        mime_type=body.mime_type,
        category=body.category,
        title=body.title,
        description=body.description,
        actor_id=current_officer.id,
        actor_role=current_officer.role,
        evidence_id=evidence_id,
        captured_at=body.captured_at,
        gps_location=body.gps_location,
        device_model=body.device_model,
        exif_present=body.exif_present
    )
    return ok(upload_data.model_dump(), "Upload URL generated.", req_id, corr_id)


@router.post("/{case_id}/evidence/confirm", status_code=201, summary="Confirm upload and finalize metadata")
async def confirm_upload(
    case_id: UUID,
    body: ConfirmEvidenceUploadRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: EvidenceService = Depends(get_evidence_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
    
    # Reserve metadata fields if sent as query parameters during S3 direct response hooks
    title: str = Query("Evidence File"),
    description: str = Query(""),
    category: str = Query("Other"),
    file_name: str = Query("file.dat"),
    file_size: int = Query(0),
    mime_type: str = Query("application/octet-stream"),
    
    captured_at: Optional[str] = Query(None),
    gps_location: Optional[str] = Query(None),
    device_model: Optional[str] = Query(None),
    exif_present: Optional[bool] = Query(None)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    dt_captured = None
    if captured_at:
        try:
            dt_captured = datetime.datetime.fromisoformat(captured_at)
        except Exception:
            pass

    async with uow:
        evidence = await service.confirm_upload(
            case_id=case_id,
            evidence_id=body.evidence_id,
            version_number=body.version_number,
            storage_path=body.storage_path,
            sha256_hash=body.sha256_hash,
            title=title,
            description=description,
            category=category,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            captured_at=dt_captured,
            gps_location=gps_location,
            device_model=device_model,
            exif_present=exif_present,
            request_id=req_id,
            correlation_id=corr_id
        )
    return ok(EvidenceOut.model_validate(evidence).model_dump(), "Evidence upload confirmed and verified.", req_id, corr_id)


@router.get("/{case_id}/evidence", summary="List Case Evidence")
async def list_evidence(
    case_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: EvidenceService = Depends(get_evidence_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    # Investigators can only view evidence for their assigned cases
    # Enforced by the service layer during queries or checks
    items = await service.list_evidence(case_id)
    # Filter list manually if investigator is not assigned, but service list_evidence checks case existence.
    # To double check: does service check assignment? The service method:
    # "Investigators can only view or download evidence if assigned"
    # Let's verify that the service layer does this, or we can check here.
    # Actually, let's keep all checks inside service layer as per clean architecture rules!
    # Let's see: inside list_evidence in service layer, let's add assignment check if needed.
    # Wait, in service.py:
    # `case = await self._cases.get_active_by_id(case_id)`
    # Let's enforce the investigator assignment check inside list_evidence service method to be secure.
    # Wait, the list_evidence in service.py takes only case_id. Let's add actor check there or check it here.
    # To be extremely clean, we can pass actor_id and role to list_evidence service method. Let's check:
    # We can check it here or modify the service. Let's modify the service method if needed, or check here.
    # Let's modify service list_evidence method later, or let's pass current_officer.id and role to service.
    
    # Wait, let's check investigator case assignment right here for safety:
    case = await service._cases.get_active_by_id(case_id)
    if not case:
        from app.domain.exceptions.case import CaseNotFoundException
        raise CaseNotFoundException()
    if current_officer.role == "INVESTIGATOR" and case.assigned_officer_id != current_officer.id:
        from app.domain.exceptions.case import CaseAssignmentException
        raise CaseAssignmentException("Only the assigned investigator can access this case's evidence.")
        
    data = [EvidenceOut.model_validate(item).model_dump() for item in items]
    return ok(data, "Evidence listing retrieved.", req_id, corr_id)


@router.get("/{case_id}/evidence/{evidence_id}/download", summary="Get presigned download URL")
async def get_download_url(
    case_id: UUID,
    evidence_id: UUID,
    request: Request,
    version: Optional[int] = Query(None, description="Specific version number to download"),
    reason: str = Query("Investigation review", description="Reason for evidence download"),
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: EvidenceService = Depends(get_evidence_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    download_data = await service.get_download_url(
        case_id=case_id,
        evidence_id=evidence_id,
        actor_id=current_officer.id,
        actor_role=current_officer.role,
        version_number=version,
        download_ip=ip,
        download_reason=reason,
        download_device=user_agent,
        request_id=req_id,
        correlation_id=corr_id
    )
    return ok(download_data.model_dump(), "Download URL generated.", req_id, corr_id)


@router.get("/{case_id}/evidence/{evidence_id}/versions", summary="Get evidence version history")
async def get_evidence_versions(
    case_id: UUID,
    evidence_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: EvidenceService = Depends(get_evidence_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    # Case assignment authorization check
    case = await service._cases.get_active_by_id(case_id)
    if not case:
        from app.domain.exceptions.case import CaseNotFoundException
        raise CaseNotFoundException()
    if current_officer.role == "INVESTIGATOR" and case.assigned_officer_id != current_officer.id:
        from app.domain.exceptions.case import CaseAssignmentException
        raise CaseAssignmentException("Only the assigned investigator can access this case's evidence.")
        
    versions = await service.get_versions(case_id, evidence_id)
    data = [EvidenceVersionOut.model_validate(v).model_dump() for v in versions]
    return ok(data, "Evidence version history retrieved.", req_id, corr_id)


@router.delete("/{case_id}/evidence/{evidence_id}", summary="Soft delete evidence")
async def delete_evidence(
    case_id: UUID,
    evidence_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: EvidenceService = Depends(get_evidence_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        await service.soft_delete_evidence(
            case_id=case_id,
            evidence_id=evidence_id,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            request_id=req_id,
            correlation_id=corr_id
        )
    return ok(None, "Evidence soft deleted successfully.", req_id, corr_id)
