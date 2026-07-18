from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import require_roles
from app.api.dependencies.database import get_db
from app.models.officer import Officer
from app.models.case import Case, CaseTimelineEvent
from app.models.complaint import Complaint
from app.models.fir import FIR
from app.models.evidence import Evidence
from app.models.citizen import Citizen
from app.models.ai_integration import AICaseAnalysis
from app.api.v1.schemas.common import ok

router = APIRouter(prefix="/search", tags=["Global Search & Filters"])

# ── Search Request DTOs ──────────────────────────────────────────────────────

class SearchRequestPayload(BaseModel):
    query: str = Field(..., min_length=1)
    entity_type: Optional[str] = Field(None, pattern="^(cases|complaints|firs|evidences|citizens|officers|ai_suggestions|timeline)$")
    page: int = Field(1, ge=1)
    page_size: int = Field(10, ge=1, le=100)
    sort_by: str = "created_at"
    sort_order: str = Field("desc", pattern="^(asc|desc)$")


# ── Search API Endpoints ─────────────────────────────────────────────────────

@router.post("", summary="Perform global search across system entities")
async def global_search(
    body: SearchRequestPayload,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    db: AsyncSession = Depends(get_db)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")

    query_str = f"%{body.query}%"
    offset = (body.page - 1) * body.page_size
    results = {}

    # 1. Search Cases
    if not body.entity_type or body.entity_type == "cases":
        stmt = (
            select(Case)
            .where(
                and_(
                    or_(
                        Case.title.like(query_str),
                        Case.case_number.like(query_str),
                        Case.category.like(query_str)
                    ),
                    Case.is_deleted == False
                )
            )
            .limit(body.page_size)
            .offset(offset)
        )
        res = await db.execute(stmt)
        results["cases"] = [{
            "id": c.id, "case_number": c.case_number, "title": c.title,
            "category": c.category, "status": c.status, "opened_at": c.opened_at.isoformat()
        } for c in res.scalars().all()]

    # 2. Search Complaints
    if not body.entity_type or body.entity_type == "complaints":
        stmt = (
            select(Complaint)
            .where(
                and_(
                    or_(
                        Complaint.complaint_text.like(query_str),
                        Complaint.citizen_name.like(query_str)
                    ),
                    Complaint.is_deleted == False
                )
            )
            .limit(body.page_size)
            .offset(offset)
        )
        res = await db.execute(stmt)
        results["complaints"] = [{
            "id": c.id, "citizen_name": c.citizen_name,
            "complaint_text": c.complaint_text, "status": c.status
        } for c in res.scalars().all()]

    # 3. Search FIRs
    if not body.entity_type or body.entity_type == "firs":
        stmt = (
            select(FIR)
            .where(
                and_(
                    or_(
                        FIR.fir_number.like(query_str),
                        FIR.details.like(query_str)
                    ),
                    FIR.is_deleted == False
                )
            )
            .limit(body.page_size)
            .offset(offset)
        )
        res = await db.execute(stmt)
        results["firs"] = [{
            "id": f.id, "fir_number": f.fir_number,
            "details": f.details, "status": f.status
        } for f in res.scalars().all()]

    # 4. Search Evidence
    if not body.entity_type or body.entity_type == "evidences":
        stmt = (
            select(Evidence)
            .where(
                and_(
                    or_(
                        Evidence.title.like(query_str),
                        Evidence.description.like(query_str)
                    ),
                    Evidence.is_deleted == False
                )
            )
            .limit(body.page_size)
            .offset(offset)
        )
        res = await db.execute(stmt)
        results["evidences"] = [{
            "id": e.id, "title": e.title,
            "description": e.description, "status": e.status
        } for e in res.scalars().all()]

    # 5. Search Citizens
    if not body.entity_type or body.entity_type == "citizens":
        stmt = (
            select(Citizen)
            .where(
                and_(
                    or_(
                        Citizen.name.like(query_str),
                        Citizen.phone_number.like(query_str),
                        Citizen.email.like(query_str)
                    ),
                    Citizen.is_deleted == False
                )
            )
            .limit(body.page_size)
            .offset(offset)
        )
        res = await db.execute(stmt)
        results["citizens"] = [{
            "id": c.id, "name": c.name, "phone_number": c.phone_number, "email": c.email
        } for c in res.scalars().all()]

    # 6. Search Officers
    if not body.entity_type or body.entity_type == "officers":
        stmt = (
            select(Officer)
            .where(
                and_(
                    or_(
                        Officer.username.like(query_str),
                        Officer.badge_number.like(query_str)
                    ),
                    Officer.status == "Active"
                )
            )
            .limit(body.page_size)
            .offset(offset)
        )
        res = await db.execute(stmt)
        results["officers"] = [{
            "id": o.id, "username": o.username, "badge_number": o.badge_number, "role": o.role
        } for o in res.scalars().all()]

    # 7. Search AI Suggestions
    if not body.entity_type or body.entity_type == "ai_suggestions":
        stmt = (
            select(AICaseAnalysis)
            .where(
                or_(
                    AICaseAnalysis.summary_draft.like(query_str),
                    AICaseAnalysis.suggested_category.like(query_str)
                )
            )
            .limit(body.page_size)
            .offset(offset)
        )
        res = await db.execute(stmt)
        results["ai_suggestions"] = [{
            "id": a.id, "summary_draft": a.summary_draft,
            "suggested_category": a.suggested_category, "review_status": a.review_status
        } for a in res.scalars().all()]

    # 8. Search Timeline events
    if not body.entity_type or body.entity_type == "timeline":
        stmt = (
            select(CaseTimelineEvent)
            .where(
                or_(
                    CaseTimelineEvent.title.like(query_str),
                    CaseTimelineEvent.description.like(query_str)
                )
            )
            .limit(body.page_size)
            .offset(offset)
        )
        res = await db.execute(stmt)
        results["timeline"] = [{
            "id": t.id, "title": t.title,
            "description": t.description, "event_time": t.event_time.isoformat()
        } for t in res.scalars().all()]

    payload_res = {
        "page": body.page,
        "page_size": body.page_size,
        "results": results
    }

    return ok(payload_res, "Search query completed successfully.", req_id, corr_id)
