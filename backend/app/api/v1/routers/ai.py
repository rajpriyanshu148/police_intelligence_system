from typing import List, Optional, Dict, Any
from uuid import UUID
import json
from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field

from app.api.dependencies.auth import require_roles
from app.api.dependencies.services import get_ai_integration_service
from app.api.dependencies.repositories import get_unit_of_work
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.models.officer import Officer
from app.services.ai_integration_service import AIIntegrationService
from app.api.v1.schemas.common import ok

router = APIRouter(prefix="", tags=["AI Integration"])

_ALL_ROLES = ("ADMIN", "SUPERVISOR", "INVESTIGATOR")

# ── Router Request Schemas ───────────────────────────────────────────────────

class AIReviewRequest(BaseModel):
    target_type: str = Field(pattern="^(ANALYSIS|FIR|LEGAL)$")
    suggestion_id: UUID
    action: str = Field(pattern="^(ACCEPT|EDIT|REJECT)$")
    edited_text: Optional[str] = None
    approved_sections: Optional[List[str]] = Field(default_factory=list)


# ── AI API Endpoints ─────────────────────────────────────────────────────────

@router.post("/cases/{case_id}/ai/analyze", summary="Run AI complaint analysis")
async def analyze_complaint(
    case_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: AIIntegrationService = Depends(get_ai_integration_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        analysis = await service.analyze_case_complaint(
            case_id=case_id,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            request_id=req_id,
            correlation_id=corr_id
        )
    
    # Format response
    duplicates = json.loads(analysis.potential_duplicates) if analysis.potential_duplicates else []
    missing_info = json.loads(analysis.missing_information) if analysis.missing_information else []
    
    data = {
        "id": analysis.id,
        "case_id": analysis.case_id,
        "summary_draft": analysis.summary_draft,
        "suggested_category": analysis.suggested_category,
        "suggested_severity": analysis.suggested_severity,
        "suggested_priority": analysis.suggested_priority,
        "suggested_department": analysis.suggested_department,
        "missing_information": missing_info,
        "potential_duplicates": duplicates,
        "review_status": analysis.review_status,
        "model_name": analysis.model_name
    }
    return ok(data, "AI complaint analysis draft generated.", req_id, corr_id)


@router.post("/cases/{case_id}/ai/entities", summary="Run AI entity extraction")
async def extract_entities(
    case_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: AIIntegrationService = Depends(get_ai_integration_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    result = await service.extract_case_entities(
        case_id=case_id,
        actor_id=current_officer.id,
        actor_role=current_officer.role,
        request_id=req_id,
        correlation_id=corr_id
    )
    return ok(result, "Named entities extracted successfully.", req_id, corr_id)


@router.post("/cases/{case_id}/ai/fir", summary="Run AI FIR narrative draft")
async def assist_fir(
    case_id: UUID,
    request: Request,
    officer_notes: Optional[str] = None,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: AIIntegrationService = Depends(get_ai_integration_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        suggestion = await service.generate_fir_draft(
            case_id=case_id,
            officer_notes=officer_notes,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            request_id=req_id,
            correlation_id=corr_id
        )
        
    data = {
        "id": suggestion.id,
        "case_id": suggestion.case_id,
        "original_narrative_draft": suggestion.original_narrative_draft,
        "review_status": suggestion.review_status,
        "model_name": suggestion.model_name
    }
    return ok(data, "AI FIR narrative draft generated.", req_id, corr_id)


@router.post("/cases/{case_id}/ai/legal", summary="Run AI legal recommendations")
async def recommend_legal(
    case_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: AIIntegrationService = Depends(get_ai_integration_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        rec = await service.recommend_legal_sections(
            case_id=case_id,
            actor_id=current_officer.id,
            actor_role=current_officer.role,
            request_id=req_id,
            correlation_id=corr_id
        )
        
    sections = json.loads(rec.suggested_sections) if rec.suggested_sections else []
    data = {
        "id": rec.id,
        "case_id": rec.case_id,
        "suggested_sections": sections,
        "review_status": rec.review_status,
        "model_name": rec.model_name
    }
    return ok(data, "AI legal recommendations generated.", req_id, corr_id)


@router.post("/cases/{case_id}/ai/review", summary="Submit human officer review decisions")
async def review_ai_output(
    case_id: UUID,
    body: AIReviewRequest,
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: AIIntegrationService = Depends(get_ai_integration_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    async with uow:
        if body.target_type == "ANALYSIS":
            res = await service.review_case_analysis(
                analysis_id=body.suggestion_id,
                action=body.action,
                edited_summary=body.edited_text,
                actor_id=current_officer.id,
                actor_role=current_officer.role,
                request_id=req_id,
                correlation_id=corr_id
            )
            review_outcome = res.review_status
            
        elif body.target_type == "FIR":
            res = await service.review_fir_draft(
                suggestion_id=body.suggestion_id,
                action=body.action,
                edited_narrative=body.edited_text,
                actor_id=current_officer.id,
                actor_role=current_officer.role,
                request_id=req_id,
                correlation_id=corr_id
            )
            review_outcome = res.review_status
            
        elif body.target_type == "LEGAL":
            # For legal review, action == REJECT if approved_sections is empty
            res = await service.review_legal_recommendations(
                recommendation_id=body.suggestion_id,
                approved_sections=body.approved_sections or [],
                actor_id=current_officer.id,
                actor_role=current_officer.role,
                request_id=req_id,
                correlation_id=corr_id
            )
            review_outcome = res.review_status

    return ok({"suggestion_id": body.suggestion_id, "review_outcome": review_outcome}, "AI suggestion review completed.", req_id, corr_id)


@router.get("/ai/health", summary="Query AI client health status")
async def ai_health(
    request: Request,
    current_officer: Officer = Depends(require_roles(*_ALL_ROLES)),
    service: AIIntegrationService = Depends(get_ai_integration_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    health = await service._ai.get_health_status()
    return ok(health, "AI Service health status queried.", req_id, corr_id)
