from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query

from app.api.dependencies.auth import get_current_officer, require_roles
from app.api.dependencies.services import get_complaint_service
from app.api.dependencies.repositories import get_unit_of_work
from app.api.v1.schemas.citizen_complaint import (
    CreateComplaintRequest, UpdateComplaintRequest,
    AssignComplaintRequest, TransitionComplaintRequest, ComplaintOut,
)
from app.api.v1.schemas.common import ok, make_pagination
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.models.officer import Officer
from app.services.complaint_service import ComplaintService

router = APIRouter(prefix="/complaints", tags=["Complaint Management"])

_ALL_ROLES = ("ADMIN", "SUPERVISOR", "INVESTIGATOR")


@router.post("", status_code=201, summary="Log a Complaint")
async def create_complaint(
    body: CreateComplaintRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: ComplaintService = Depends(get_complaint_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        complaint = await service.create_complaint(
            citizen_name=body.citizen_name, citizen_contact=body.citizen_contact,
            complaint_text=body.complaint_text, source=body.source,
            citizen_id=body.citizen_id, actor_id=current_officer.id,
            request_id=req_id, correlation_id=corr_id,
        )
    return ok(ComplaintOut.model_validate(complaint).model_dump(), "Complaint logged.", req_id, corr_id)


@router.get("", summary="List / Search Complaints")
async def list_complaints(
    request: Request,
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Full-text search on complaint text / citizen info"),
    citizen_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: ComplaintService = Depends(get_complaint_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    # Investigators can only see their own assigned complaints
    assigned_filter: Optional[UUID] = None
    if current_officer.role == "INVESTIGATOR":
        assigned_filter = current_officer.id

    if q:
        items, total = await service.search_complaints(q, page=page, page_size=page_size)
    else:
        items, total = await service.list_complaints(
            status=status, assigned_officer_id=assigned_filter,
            citizen_id=citizen_id, page=page, page_size=page_size,
        )
    data = [ComplaintOut.model_validate(c).model_dump() for c in items]
    return ok(data, "Complaints retrieved.", req_id, corr_id, pagination=make_pagination(total, page, page_size))


@router.get("/{complaint_id}", summary="View Complaint")
async def get_complaint(
    complaint_id: UUID,
    request: Request,
    _: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: ComplaintService = Depends(get_complaint_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    complaint = await service.get_complaint(complaint_id)
    return ok(ComplaintOut.model_validate(complaint).model_dump(), "Complaint retrieved.", req_id, corr_id)


@router.patch("/{complaint_id}", summary="Update Complaint Text")
async def update_complaint(
    complaint_id: UUID,
    body: UpdateComplaintRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: ComplaintService = Depends(get_complaint_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        complaint = await service.update_complaint(
            complaint_id=complaint_id, actor_id=current_officer.id,
            complaint_text=body.complaint_text, request_id=req_id, correlation_id=corr_id,
        )
    return ok(ComplaintOut.model_validate(complaint).model_dump(), "Complaint updated.", req_id, corr_id)


@router.post("/{complaint_id}/assign", summary="Assign Complaint (Supervisor only)")
async def assign_complaint(
    complaint_id: UUID,
    body: AssignComplaintRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: ComplaintService = Depends(get_complaint_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        complaint = await service.assign_complaint(
            complaint_id=complaint_id, officer_id=body.officer_id,
            actor_id=current_officer.id, request_id=req_id, correlation_id=corr_id,
        )
    return ok(ComplaintOut.model_validate(complaint).model_dump(), "Complaint assigned.", req_id, corr_id)


@router.post("/{complaint_id}/status", summary="Transition Complaint Status")
async def transition_status(
    complaint_id: UUID,
    body: TransitionComplaintRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: ComplaintService = Depends(get_complaint_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        complaint = await service.transition_status(
            complaint_id=complaint_id, new_status=body.status,
            actor_id=current_officer.id, request_id=req_id, correlation_id=corr_id,
        )
    return ok(ComplaintOut.model_validate(complaint).model_dump(), f"Complaint status updated to {body.status}.", req_id, corr_id)


@router.delete("/{complaint_id}", summary="Soft Delete Complaint (Supervisor / Admin)")
async def delete_complaint(
    complaint_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: ComplaintService = Depends(get_complaint_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        await service.soft_delete_complaint(
            complaint_id=complaint_id, actor_id=current_officer.id,
            request_id=req_id, correlation_id=corr_id,
        )
    return ok(None, "Complaint deleted.", req_id, corr_id)
