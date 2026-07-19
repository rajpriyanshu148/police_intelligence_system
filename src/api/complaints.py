from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from src.domain.dto.api_response import ResponseEnvelope, ResponseMeta
from src.repositories.unit_of_work import UnitOfWork
from src.services.case_service import CaseService

router = APIRouter(prefix="/api/v1/complaints", tags=["complaints"])

class ComplaintCreate(BaseModel):
    citizen_name: str
    citizen_contact: str
    complaint_text: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "citizen_name": "R. K. Gupta",
                "citizen_contact": "+91 9999988888",
                "complaint_text": "Yesterday night someone snatched my gold chain."
            }
        }
    }

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

@router.get("", response_model=ResponseEnvelope, summary="List all citizen complaints", description="Retrieve all citizen complaints stored in general diary, ordered chronologically.")
def list_complaints(request: Request, case_service: CaseService = Depends(get_case_service)):
    complaints = case_service.list_complaints()
    data = [
        {
            "id": c.id,
            "citizen_name": c.citizen_name,
            "citizen_contact": c.citizen_contact,
            "complaint_text": c.complaint_text,
            "status": c.status,
            "created_at": c.created_at
        }
        for c in complaints
    ]
    return ResponseEnvelope(
        success=True,
        message="Complaints retrieved successfully",
        data=data,
        meta=make_meta(request)
    )

@router.post("", response_model=ResponseEnvelope, summary="Register a new complaint", description="Register a new citizen complaint in the general diary.")
def create_complaint(request: Request, req: ComplaintCreate, case_service: CaseService = Depends(get_case_service)):
    c = case_service.create_complaint(req.citizen_name, req.citizen_contact, req.complaint_text)
    data = {
        "id": c.id,
        "citizen_name": c.citizen_name,
        "citizen_contact": c.citizen_contact,
        "complaint_text": c.complaint_text,
        "status": c.status,
        "created_at": c.created_at
    }
    return ResponseEnvelope(
        success=True,
        message="Complaint created successfully",
        data=data,
        meta=make_meta(request)
    )
