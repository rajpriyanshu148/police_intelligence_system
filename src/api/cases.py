import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from src.domain.dto.api_response import ResponseEnvelope, ResponseMeta, PaginationMeta
from src.repositories.unit_of_work import UnitOfWork
from src.services.case_service import CaseService

router = APIRouter(prefix="/api/v1/cases", tags=["cases"])

def get_uow() -> UnitOfWork:
    return UnitOfWork()

def get_case_service(uow: UnitOfWork = Depends(get_uow)) -> CaseService:
    return CaseService(uow)

def make_meta(request: Request) -> ResponseMeta:
    return ResponseMeta(
        request_id=getattr(request.state, "request_id", "N/A"),
        correlation_id=getattr(request.state, "correlation_id", "N/A"),
        api_version="v1"
    )

@router.get("", response_model=ResponseEnvelope, summary="List all criminal cases", description="Retrieve a paginated list of all criminal cases, sorted by creation date.")
def list_cases(
    request: Request,
    page: int = Query(default=1, ge=1, description="Page number of the list results."),
    page_size: int = Query(default=10, ge=1, le=100, description="Number of results per page."),
    case_service: CaseService = Depends(get_case_service)
):
    res = case_service.list_cases(page=page, page_size=page_size)
    return ResponseEnvelope(
        success=True,
        message="Cases retrieved successfully",
        data=res["items"],
        pagination=PaginationMeta(**res["pagination"]),
        meta=make_meta(request)
    )

@router.get("/{case_id}", response_model=ResponseEnvelope, summary="Get details of a case", description="Retrieve detailed information for a specific case by its unique UUID ID, including the original complaint details, generated FIR draft, timeline logs, and extracted entities.")
def get_case_details(
    request: Request,
    case_id: uuid.UUID,
    case_service: CaseService = Depends(get_case_service)
):
    case_details = case_service.get_case_details(case_id)
    if not case_details:
        raise HTTPException(status_code=404, detail="CASE_001: Case not found")
    return ResponseEnvelope(
        success=True,
        message="Case details retrieved successfully",
        data=case_details,
        meta=make_meta(request)
    )

@router.get("/dashboard/analytics", response_model=ResponseEnvelope, summary="Get case dashboard analytics", description="Retrieve aggregated metrics and statistical counters including monthly trend analytics, status distribution, and case categories.")
def get_analytics(
    request: Request,
    case_service: CaseService = Depends(get_case_service)
):
    data = case_service.get_analytics()
    return ResponseEnvelope(
        success=True,
        message="Dashboard analytics retrieved successfully",
        data=data,
        meta=make_meta(request)
    )
