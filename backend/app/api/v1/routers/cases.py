from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query

from app.api.dependencies.auth import get_current_officer, require_roles
from app.api.dependencies.services import get_case_service
from app.api.dependencies.repositories import get_unit_of_work
from app.api.v1.schemas.case import (
    CreateCaseRequest, UpdateCaseRequest, AssignCaseRequest,
    TransitionCaseRequest, AddTimelineEventRequest, CaseOut, TimelineEventOut,
)
from app.api.v1.schemas.common import ok, make_pagination
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.models.officer import Officer
from app.services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["Case Management"])


@router.post("", status_code=201, summary="Create Case from Complaint (Supervisor only)")
async def create_case(
    body: CreateCaseRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: CaseService = Depends(get_case_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        case = await service.create_case(
            complaint_id=body.complaint_id, title=body.title,
            category=body.category, severity=body.severity, priority=body.priority,
            actor_id=current_officer.id, request_id=req_id, correlation_id=corr_id,
        )
    return ok(CaseOut.model_validate(case).model_dump(), "Case created.", req_id, corr_id)


@router.get("", summary="List Cases")
async def list_cases(
    request: Request,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    service: CaseService = Depends(get_case_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    assigned_filter: Optional[UUID] = None
    if current_officer.role == "INVESTIGATOR":
        assigned_filter = current_officer.id
    cases, total = await service.list_cases(
        status=status, assigned_officer_id=assigned_filter, page=page, page_size=page_size
    )
    data = [CaseOut.model_validate(c).model_dump() for c in cases]
    return ok(data, "Cases retrieved.", req_id, corr_id, pagination=make_pagination(total, page, page_size))


@router.get("/{case_id}", summary="View Case")
async def get_case(
    case_id: UUID,
    request: Request,
    _: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    service: CaseService = Depends(get_case_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    case = await service.get_case(case_id)
    return ok(CaseOut.model_validate(case).model_dump(), "Case retrieved.", req_id, corr_id)


@router.patch("/{case_id}", summary="Update Case Details")
async def update_case(
    case_id: UUID,
    body: UpdateCaseRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    service: CaseService = Depends(get_case_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        case = await service.update_case(
            case_id=case_id, actor_id=current_officer.id, actor_role=current_officer.role,
            title=body.title, category=body.category, severity=body.severity, priority=body.priority,
            request_id=req_id, correlation_id=corr_id,
        )
    return ok(CaseOut.model_validate(case).model_dump(), "Case updated.", req_id, corr_id)


@router.post("/{case_id}/assign", summary="Assign Case to Investigator (Supervisor only)")
async def assign_case(
    case_id: UUID,
    body: AssignCaseRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: CaseService = Depends(get_case_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        case = await service.assign_case(
            case_id=case_id, officer_id=body.officer_id,
            actor_id=current_officer.id, request_id=req_id, correlation_id=corr_id,
        )
    return ok(CaseOut.model_validate(case).model_dump(), "Case assigned.", req_id, corr_id)


@router.post("/{case_id}/status", summary="Transition Case Status")
async def transition_status(
    case_id: UUID,
    body: TransitionCaseRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    service: CaseService = Depends(get_case_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        case = await service.transition_status(
            case_id=case_id, new_status=body.status,
            actor_id=current_officer.id, actor_role=current_officer.role,
            request_id=req_id, correlation_id=corr_id,
        )
    return ok(CaseOut.model_validate(case).model_dump(), f"Case status updated to {body.status}.", req_id, corr_id)


@router.post("/{case_id}/timeline", status_code=201, summary="Add Timeline Event")
async def add_timeline_event(
    case_id: UUID,
    body: AddTimelineEventRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    service: CaseService = Depends(get_case_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        event = await service.add_timeline_event(
            case_id=case_id, event_time=body.event_time, title=body.title,
            description=body.description, actor_id=current_officer.id,
            actor_role=current_officer.role, request_id=req_id, correlation_id=corr_id,
        )
    return ok(TimelineEventOut.model_validate(event).model_dump(), "Timeline event added.", req_id, corr_id)


@router.get("/{case_id}/timeline", summary="Get Case Timeline / History")
async def get_timeline(
    case_id: UUID,
    request: Request,
    _: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    service: CaseService = Depends(get_case_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    events = await service.get_timeline(case_id)
    data = [TimelineEventOut.model_validate(e).model_dump() for e in events]
    return ok(data, "Timeline retrieved.", req_id, corr_id)


@router.delete("/{case_id}", summary="Soft Delete Case (Admin only)")
async def delete_case(
    case_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    service: CaseService = Depends(get_case_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        await service.soft_delete_case(
            case_id=case_id, actor_id=current_officer.id,
            request_id=req_id, correlation_id=corr_id,
        )
    return ok(None, "Case deleted.", req_id, corr_id)
