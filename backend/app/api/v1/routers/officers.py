from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query

from app.api.dependencies.auth import get_current_officer, require_roles
from app.api.dependencies.services import get_officer_service
from app.api.v1.schemas.auth import CreateOfficerRequest, UpdateOfficerRequest, OfficerOut
from app.api.v1.schemas.common import ok, make_pagination
from app.models.officer import Officer
from app.services.officer_service import OfficerService
from app.repositories.unit_of_work import SqlAlchemyUnitOfWork
from app.api.dependencies.repositories import get_unit_of_work
from app.domain.interfaces.unit_of_work import IUnitOfWork

router = APIRouter(prefix="/officers", tags=["Officer Management"])


@router.post("", status_code=201, summary="Create Officer (Admin only)")
async def create_officer(
    body: CreateOfficerRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    service: OfficerService = Depends(get_officer_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        officer = await service.create_officer(
            username=body.username, email=body.email, password=body.password,
            badge_number=body.badge_number, department=body.department, role=body.role,
            actor_id=current_officer.id, request_id=req_id, correlation_id=corr_id,
        )
    return ok(OfficerOut.model_validate(officer).model_dump(), "Officer created.", req_id, corr_id)


@router.get("", summary="List Officers (Admin, Supervisor)")
async def list_officers(
    request: Request,
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: OfficerService = Depends(get_officer_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    officers, total = await service.list_officers(role=role, department=department, page=page, page_size=page_size)
    data = [OfficerOut.model_validate(o).model_dump() for o in officers]
    return ok(data, "Officers retrieved.", req_id, corr_id, pagination=make_pagination(total, page, page_size))


@router.get("/{officer_id}", summary="Get Officer Profile")
async def get_officer(
    officer_id: UUID,
    request: Request,
    _: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    service: OfficerService = Depends(get_officer_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    officer = await service.get_officer(officer_id)
    return ok(OfficerOut.model_validate(officer).model_dump(), "Officer retrieved.", req_id, corr_id)


@router.patch("/{officer_id}", summary="Update Officer (Admin only)")
async def update_officer(
    officer_id: UUID,
    body: UpdateOfficerRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    service: OfficerService = Depends(get_officer_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        officer = await service.update_officer(
            officer_id=officer_id, actor_id=current_officer.id,
            email=body.email, department=body.department,
            status=body.status, role=body.role,
            request_id=req_id, correlation_id=corr_id,
        )
    return ok(OfficerOut.model_validate(officer).model_dump(), "Officer updated.", req_id, corr_id)


@router.delete("/{officer_id}", summary="Soft Delete Officer (Admin only)")
async def delete_officer(
    officer_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    service: OfficerService = Depends(get_officer_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        await service.soft_delete_officer(
            officer_id=officer_id, actor_id=current_officer.id,
            request_id=req_id, correlation_id=corr_id,
        )
    return ok(None, "Officer deleted.", req_id, corr_id)
