import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from src.domain.dto.api_response import ResponseEnvelope, ResponseMeta
from src.repositories.unit_of_work import UnitOfWork
from src.services.workflow_service import WorkflowService
from src.services.approval_service import ApprovalService

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])

class ProcessComplaintRequest(BaseModel):
    complaint_id: Optional[uuid.UUID] = Field(default=None, description="Optional UUID of a registered citizen complaint in general diary.")
    complaint_text: Optional[str] = Field(default=None, description="Raw complaint text to process (if not pre-registered in DB).")
    citizen_name: Optional[str] = Field(default="Anonymous", description="Citizen name.")
    citizen_contact: Optional[str] = Field(default="N/A", description="Citizen contact details.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "complaint_text": "Yesterday night someone snatched my gold chain in Sector 15.",
                "citizen_name": "R. K. Gupta",
                "citizen_contact": "+91 9999988888"
            }
        }
    }

class ApproveCaseRequest(BaseModel):
    complaint_text: str
    citizen_name: str
    citizen_contact: str
    category: str
    summary: str
    severity: str
    priority: str
    entities: Dict[str, str]
    legal_sections: List[Dict[str, Any]]
    fir_draft: str
    timeline: List[Dict[str, str]]
    status: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "complaint_text": "Yesterday night someone snatched my gold chain in Sector 15.",
                "citizen_name": "R. K. Gupta",
                "citizen_contact": "+91 9999988888",
                "category": "Theft",
                "summary": "Investigation into chain snatching",
                "severity": "Medium",
                "priority": "P3",
                "entities": {"Suspect": "Unknown", "Location": "Sector 15", "Stolen_Item": "gold chain"},
                "legal_sections": [
                    {"act": "BNS", "section": "Section 304", "title": "Snatching", "description": "Forcible snatching of property", "punishment": "Up to 3 years"}
                ],
                "fir_draft": "Draft of FIR for chain snatching...",
                "timeline": [{"event_time": "2026-07-17T05:00:00", "title": "Chain snatching", "description": "Snatched by unknown person"}],
                "status": "Under Investigation"
            }
        }
    }

class TranslateRequest(BaseModel):
    text: str = Field(description="Raw vernacular text to translate to English.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "कल रात मेरी सोने की चेन चोरी हो गई।"
            }
        }
    }

class QARequest(BaseModel):
    question: str = Field(description="Operational query about laws or general procedures.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "question": "What is the punishment for theft under BNS Section 303?"
            }
        }
    }

class ReportRequest(BaseModel):
    complaint_text: str = Field(description="Original citizen complaint text.")
    legal_context: str = Field(description="Legal sections or SOP documents matched for context.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "complaint_text": "Snatched gold chain by bike rider in Sector 15.",
                "legal_context": "BNS Section 304: Snatching is punishable by imprisonment for up to 3 years."
            }
        }
    }

# Dependencies
def get_uow() -> UnitOfWork:
    return UnitOfWork()

def get_workflow_service() -> WorkflowService:
    return WorkflowService()

def get_approval_service(uow: UnitOfWork = Depends(get_uow)) -> ApprovalService:
    return ApprovalService(uow)

def make_meta(request: Request) -> ResponseMeta:
    return ResponseMeta(
        request_id=getattr(request.state, "request_id", "N/A"),
        correlation_id=getattr(request.state, "correlation_id", "N/A"),
        api_version="v1"
    )

@router.post("/process", response_model=ResponseEnvelope, summary="Process complaint via LangGraph workflow", description="Trigger the multi-step analysis workflow on a raw or pre-registered complaint to categorise, extract entities, identify relevant legal sections, and prepare an FIR draft.")
def process_complaint_workflow(
    request: Request,
    req: ProcessComplaintRequest,
    uow: UnitOfWork = Depends(get_uow),
    workflow_service: WorkflowService = Depends(get_workflow_service)
):
    c_text = ""
    c_name = req.citizen_name
    c_contact = req.citizen_contact
    
    if req.complaint_id:
        with uow:
            complaint = uow.complaints.get_by_id(req.complaint_id)
            if not complaint:
                raise HTTPException(status_code=404, detail="CASE_002: Complaint not found")
            c_text = complaint.complaint_text
            c_name = complaint.citizen_name
            c_contact = complaint.citizen_contact
            
            # Mark complaint status as Processing
            complaint.status = "Processing"
            uow.commit()
    elif req.complaint_text:
        c_text = req.complaint_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="VALIDATION_001: Either complaint_id or complaint_text must be provided."
        )

    # Setup initial workflow state
    initial_state = {
        "complaint_text": c_text,
        "citizen_name": c_name,
        "citizen_contact": c_contact,
        "category": "",
        "summary": "",
        "entities": {},
        "severity": "",
        "priority": "",
        "legal_sections": [],
        "sops": [],
        "similar_cases": [],
        "fir_draft": "",
        "timeline": [],
        "status": "Pending",
        "approved": False,
        "case_number": "",
        "fir_number": "",
        "error": ""
    }

    try:
        print(f"[AgentAPI] Initiating LangGraph workflow for: {c_name}")
        result = workflow_service.execute_workflow(initial_state)
        return ResponseEnvelope(
            success=True,
            message="Complaint processed successfully by reasoning workflow",
            data=result.model_dump(),
            meta=make_meta(request)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        err_msg = str(e)
        if "SECURITY_" in err_msg:
            idx = err_msg.find("SECURITY_")
            raise HTTPException(status_code=400, detail=err_msg[idx:])
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI_001: Workflow execution failed: {e}"
        )

@router.post("/approve", response_model=ResponseEnvelope, summary="Approve and register case/FIR in database", description="Verify, finalize, and commit the generated case profile and FIR record to persistence storage. Runs a logical case finalizer step in the graph before committing.")
def approve_and_finalize_workflow(
    request: Request,
    req: ApproveCaseRequest,
    workflow_service: WorkflowService = Depends(get_workflow_service),
    approval_service: ApprovalService = Depends(get_approval_service)
):
    # Construct state for execution with approved=True
    state_input = {
        "complaint_text": req.complaint_text,
        "citizen_name": req.citizen_name,
        "citizen_contact": req.citizen_contact,
        "category": req.category,
        "summary": req.summary,
        "severity": req.severity,
        "priority": req.priority,
        "entities": req.entities,
        "legal_sections": req.legal_sections,
        "sops": [],
        "similar_cases": [],
        "fir_draft": req.fir_draft,
        "timeline": req.timeline,
        "status": req.status,
        "approved": True,  # Triggers logical transition to finalize_case node
        "case_number": "",
        "fir_number": "",
        "error": ""
    }

    try:
        print(f"[AgentAPI] Finalizing and Registering Case: {req.category}")
        # Run workflow purely to get logical state outputs
        result = workflow_service.execute_workflow(state_input)
        
        # Persist case records in a single database transaction boundary
        finalized_response = approval_service.approve_and_finalize_case(result)
        return ResponseEnvelope(
            success=True,
            message="Case and FIR approved and registered successfully",
            data=finalized_response,
            meta=make_meta(request)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SYS_001: Finalization failed: {e}"
        )

@router.post("/translate", response_model=ResponseEnvelope, summary="Translate vernacular text", description="Translate vernacular complaint text (e.g. Hindi, Punjabi) to English for downstream processing.")
def translate_text(request: Request, req: TranslateRequest):
    from src.models.llm_engine import llm_engine
    try:
        translated = llm_engine.generate_response("translation", req.text)
        return ResponseEnvelope(
            success=True,
            message="Translation completed successfully",
            data={"translated_text": translated},
            meta=make_meta(request)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI_001: Translation failed: {e}")

@router.post("/qa", response_model=ResponseEnvelope, summary="Operational QA assistant", description="Query assistant on law sections, SOP procedures, or other local guidelines.")
def ask_chat_assistant(request: Request, req: QARequest):
    from src.models.llm_engine import llm_engine
    try:
        answer = llm_engine.generate_response("question_answering", req.question)
        return ResponseEnvelope(
            success=True,
            message="Operational question answered successfully",
            data={"answer": answer},
            meta=make_meta(request)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI_001: QA failed: {e}")

@router.post("/report", response_model=ResponseEnvelope, summary="Generate structured investigation report", description="Generate a detailed, formatted investigation report base matching complaint narrative and legal context details.")
def generate_report(request: Request, req: ReportRequest):
    from src.models.llm_engine import llm_engine
    try:
        report = llm_engine.generate_response("investigation_report_generation", req.complaint_text, context=req.legal_context)
        return ResponseEnvelope(
            success=True,
            message="Investigation report generated successfully",
            data={"report": report},
            meta=make_meta(request)
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI_001: Report generation failed: {e}")
