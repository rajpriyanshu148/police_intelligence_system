from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query, status

from app.api.dependencies.auth import get_current_officer, require_roles
from app.api.dependencies.services import get_fir_service
from app.api.dependencies.repositories import get_unit_of_work
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.models.officer import Officer
from app.services.fir_service import FIRService
from app.api.v1.schemas.common import ok
from app.api.v1.schemas.fir import (
    CreateFIRRequest, UpdateFIRRequest, ApproveFIRRequest, FIROut, FIRVersionOut
)

router = APIRouter(prefix="/cases", tags=["FIR Management"])

_ALL_ROLES = ("ADMIN", "SUPERVISOR", "INVESTIGATOR")


@router.post("/{case_id}/fir", status_code=201, summary="Create Draft FIR")
async def create_fir_draft(
    case_id: UUID,
    body: CreateFIRRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: FIRService = Depends(get_fir_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        fir = await service.create_fir_draft(
            case_id=case_id,
            complainant_name=body.complainant_name,
            complainant_contact=body.complainant_contact,
            incident_date=body.incident_date,
            incident_place=body.incident_place,
            acts_sections=body.acts_sections,
            details=body.details,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            request_id=req_id,
            correlation_id=corr_id
        )
    return ok(FIROut.model_validate(fir).model_dump(), "FIR draft created successfully.", req_id, corr_id)


@router.patch("/{case_id}/fir", summary="Edit Draft or Returned FIR")
async def update_fir_draft(
    case_id: UUID,
    body: UpdateFIRRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: FIRService = Depends(get_fir_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        fir = await service.update_fir_draft(
            case_id=case_id,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            acts_sections=body.acts_sections,
            details=body.details,
            request_id=req_id,
            correlation_id=corr_id
        )
    return ok(FIROut.model_validate(fir).model_dump(), "FIR draft updated.", req_id, corr_id)


@router.post("/{case_id}/fir/submit", summary="Submit FIR draft for approval")
async def submit_fir(
    case_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: FIRService = Depends(get_fir_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        fir = await service.submit_fir_for_review(
            case_id=case_id,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            request_id=req_id,
            correlation_id=corr_id
        )
    return ok(FIROut.model_validate(fir).model_dump(), "FIR submitted for supervisor review.", req_id, corr_id)


@router.post("/{case_id}/fir/approve", summary="Approve, Return, or Reject FIR")
async def review_fir(
    case_id: UUID,
    body: ApproveFIRRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: FIRService = Depends(get_fir_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        fir = await service.review_fir(
            case_id=case_id,
            approved=body.approved,
            feedback=body.feedback,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            action=body.action,
            request_id=req_id,
            correlation_id=corr_id
        )
    return ok(FIROut.model_validate(fir).model_dump(), f"FIR status updated to {fir.status}.", req_id, corr_id)


@router.get("/{case_id}/fir", summary="Retrieve active case FIR")
async def get_fir(
    case_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: FIRService = Depends(get_fir_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    # Investigator assignment check
    case = await service._cases.get_active_by_id(case_id)
    if not case:
        from app.domain.exceptions.case import CaseNotFoundException
        raise CaseNotFoundException()
    if current_officer.role == "INVESTIGATOR" and case.assigned_officer_id != current_officer.id:
        from app.domain.exceptions.case import CaseAssignmentException
        raise CaseAssignmentException("Only the assigned investigator can view this case's FIR.")
        
    fir = await service.get_fir_by_case(case_id)
    return ok(FIROut.model_validate(fir).model_dump(), "FIR retrieved.", req_id, corr_id)


@router.get("/{case_id}/fir/history", summary="Retrieve FIR amendments version history")
async def get_fir_history(
    case_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: FIRService = Depends(get_fir_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    # Investigator assignment check
    case = await service._cases.get_active_by_id(case_id)
    if not case:
        from app.domain.exceptions.case import CaseNotFoundException
        raise CaseNotFoundException()
    if current_officer.role == "INVESTIGATOR" and case.assigned_officer_id != current_officer.id:
        from app.domain.exceptions.case import CaseAssignmentException
        raise CaseAssignmentException("Only the assigned investigator can view this case's FIR.")
        
    versions = await service.get_fir_history(case_id)
    data = [FIRVersionOut.model_validate(v).model_dump() for v in versions]
    return ok(data, "FIR version history retrieved.", req_id, corr_id)
