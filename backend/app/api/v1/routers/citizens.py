from uuid import UUID
from fastapi import APIRouter, Depends, Request, Query

from app.api.dependencies.auth import get_current_officer, require_roles
from app.api.dependencies.services import get_citizen_service
from app.api.dependencies.repositories import get_unit_of_work
from app.api.v1.schemas.citizen_complaint import RegisterCitizenRequest, CitizenOut, ComplaintOut
from app.api.v1.schemas.common import ok, make_pagination
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.models.officer import Officer
from app.services.citizen_service import CitizenService

router = APIRouter(prefix="/citizens", tags=["Citizen Management"])

_ALL_ROLES = ("ADMIN", "SUPERVISOR", "INVESTIGATOR")


@router.post("", status_code=201, summary="Register Citizen")
async def register_citizen(
    body: RegisterCitizenRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: CitizenService = Depends(get_citizen_service),
    uow: IUnitOfWork = Depends(get_unit_of_work),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        citizen = await service.register_citizen(
            name=body.name, phone_number=body.phone_number, national_id=body.national_id,
            address=body.address, email=body.email, actor_id=current_officer.id,
            request_id=req_id, correlation_id=corr_id,
        )
    return ok(CitizenOut.model_validate(citizen).model_dump(), "Citizen registered.", req_id, corr_id)


@router.get("", summary="List / Search Citizens")
async def list_citizens(
    request: Request,
    q: str = Query(None, description="Search by name, phone, or national ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: CitizenService = Depends(get_citizen_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    if q:
        citizens, total = await service.search_citizens(q, page=page, page_size=page_size)
    else:
        citizens, total = await service.list_citizens(page=page, page_size=page_size)
    data = [CitizenOut.model_validate(c).model_dump() for c in citizens]
    return ok(data, "Citizens retrieved.", req_id, corr_id, pagination=make_pagination(total, page, page_size))


@router.get("/{citizen_id}", summary="Get Citizen Profile")
async def get_citizen(
    citizen_id: UUID,
    request: Request,
    _: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: CitizenService = Depends(get_citizen_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    citizen = await service.get_citizen(citizen_id)
    return ok(CitizenOut.model_validate(citizen).model_dump(), "Citizen retrieved.", req_id, corr_id)


@router.get("/{citizen_id}/complaints", summary="Citizen Complaint History")
async def citizen_complaints(
    citizen_id: UUID,
    request: Request,
    _: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: CitizenService = Depends(get_citizen_service),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    complaints = await service.get_complaint_history(citizen_id)
    data = [ComplaintOut.model_validate(c).model_dump() for c in complaints]
    return ok(data, "Complaint history retrieved.", req_id, corr_id)
