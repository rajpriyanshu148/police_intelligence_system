import datetime
import json
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4

from sqlalchemy import select
from app.domain.interfaces.ai_client import IAIClient
from app.domain.exceptions.case import CaseNotFoundException, CaseClosedException, CaseAssignmentException
from app.domain.exceptions.base import DomainException
from app.models.ai_integration import AICaseAnalysis, AIFIRSuggestion, AILegalRecommendation
from app.models.case import Case, CaseTimelineEvent
from app.models.complaint import Complaint
from app.models.fir import FIR, FIRVersion
from app.models.audit import AuditLog
from app.repositories.ai_repository import (
    AICaseAnalysisRepository, AIFIRSuggestionRepository, AILegalRecommendationRepository
)
from app.repositories.case_repository import CaseRepository, CaseTimelineRepository
from app.repositories.fir_repository import FIRRepository
from app.repositories.audit_repository import AuditLogRepository
from app.repositories.officer_repository import OfficerRepository

from app.api.v1.schemas.ai_client import (
    ComplaintAnalysisRequest, EntityExtractionRequest, FIRDraftRequest, LegalRecommendationRequest
)


class AIIntegrationService:
    def __init__(
        self,
        ai_client: IAIClient,
        analysis_repo: AICaseAnalysisRepository,
        fir_sugg_repo: AIFIRSuggestionRepository,
        legal_rec_repo: AILegalRecommendationRepository,
        case_repo: CaseRepository,
        timeline_repo: CaseTimelineRepository,
        fir_repo: FIRRepository,
        audit_repo: AuditLogRepository,
        officer_repo: OfficerRepository
    ):
        self._ai = ai_client
        self._analyses = analysis_repo
        self._fir_suggestions = fir_sugg_repo
        self._legal_recs = legal_rec_repo
        self._cases = case_repo
        self._timeline = timeline_repo
        self._firs = fir_repo
        self._audit = audit_repo
        self._officers = officer_repo

    # ── 1. Complaint Analysis ──────────────────────────────────────────────────

    async def analyze_case_complaint(
        self,
        case_id: UUID,
        actor_id: UUID,
        actor_role: str,
        similarity_threshold: float = 0.82,
        request_id: str = "",
        correlation_id: str = ""
    ) -> AICaseAnalysis:
        # Validate Case exists
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot analyze a closed case.", "CASE_003")

        # Authorization: assigned investigator, supervisor, or admin
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can analyze this case.", "CASE_002")

        # Retrieve complaint text
        stmt = select(Complaint).where(Complaint.id == case.complaint_id)
        res = await self._cases.db.execute(stmt)
        complaint = res.scalars().first()
        if not complaint or not complaint.complaint_text:
            raise DomainException("Associated complaint text is missing.", "AI_400")

        # Invoke AI Client
        payload = ComplaintAnalysisRequest(
            complaint_id=complaint.id,
            complaint_text=complaint.complaint_text,
            enable_duplicate_check=True,
            similarity_threshold=similarity_threshold
        )
        response = await self._ai.analyze_complaint(payload, request_id, correlation_id)

        # Deactivate any existing Draft analyses for this case to avoid clutter
        existing = await self._analyses.get_by_case_id(case_id)
        if existing:
            existing.review_status = "Superseded"

        # Create Draft AICaseAnalysis record
        analysis = AICaseAnalysis(
            id=uuid4(),
            case_id=case_id,
            summary_draft=response.summary,
            summary_approved=None,
            suggested_category=response.category,
            suggested_severity=response.severity,
            suggested_priority=response.suggested_priority,
            suggested_department=response.suggested_department,
            missing_information=json.dumps([m.model_dump() for m in response.missing_information]),
            potential_duplicates=json.dumps([d.model_dump() for d in response.potential_duplicates]),
            review_status="Draft",
            model_provider=response.model_meta.provider,
            model_name=response.model_meta.model_name,
            model_version=response.model_meta.model_version,
            prompt_template_version=response.model_meta.prompt_template_version,
            temperature=response.model_meta.temperature,
            max_tokens=response.model_meta.max_tokens,
            processing_time_ms=response.model_meta.processing_time_ms,
            prompt_hash=response.model_meta.prompt_hash,
            response_hash=response.model_meta.response_hash,
            model_confidence=None
        )
        await self._analyses.add(analysis)
        await self._analyses.db.flush()

        # Audit
        audit = AuditLog(
            actor_id=actor_id,
            action="AI_COMPLAINT_ANALYSIS",
            entity_type="AICaseAnalysis",
            entity_id=analysis.id,
            old_state=None,
            new_state=json.dumps({"review_status": "Draft", "model_name": response.model_meta.model_name}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)
        return analysis

    async def review_case_analysis(
        self,
        analysis_id: UUID,
        action: str,  # ACCEPT, EDIT, REJECT
        edited_summary: Optional[str],
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = ""
    ) -> AICaseAnalysis:
        analysis = await self._analyses.get_active_by_id(analysis_id)
        if not analysis:
            raise DomainException("AI Case Analysis record not found.", "AI_404")
        if analysis.review_status != "Draft":
            raise DomainException("AI Case Analysis has already been reviewed.", "AI_400")

        case = await self._cases.get_active_by_id(analysis.case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot review analysis on a closed case.", "CASE_003")

        # Authorization check
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can review this analysis.", "CASE_002")

        old_status = analysis.review_status
        analysis.reviewed_by_id = actor_id
        analysis.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

        if action == "REJECT":
            analysis.review_status = "Rejected"
            timeline_title = "AI Complaint Analysis Rejected"
            timeline_desc = "Officer rejected the AI-generated complaint analysis."
        else:
            # ACCEPT or EDIT
            if action == "EDIT" and edited_summary:
                analysis.review_status = "Edited"
                analysis.summary_approved = edited_summary
                timeline_title = "AI Complaint Analysis Approved with Edits"
                timeline_desc = "Officer edited and approved the AI-generated case summary."
            else:
                analysis.review_status = "Approved"
                analysis.summary_approved = analysis.summary_draft
                timeline_title = "AI Complaint Analysis Approved"
                timeline_desc = "Officer approved the AI-generated case summary."

            # Update core Case categories/priorities based on human approval
            case.category = analysis.suggested_category
            case.severity = analysis.suggested_severity
            case.priority = analysis.suggested_priority

        await self._analyses.db.flush()

        # Audit
        audit = AuditLog(
            actor_id=actor_id,
            action="AI_ANALYSIS_REVIEW",
            entity_type="AICaseAnalysis",
            entity_id=analysis.id,
            old_state=json.dumps({"review_status": old_status}),
            new_state=json.dumps({"review_status": analysis.review_status}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        # Timeline Event
        timeline = CaseTimelineEvent(
            case_id=case.id,
            title=timeline_title,
            description=timeline_desc,
            event_type="STATUS_CHANGE",
            actor_id=actor_id
        )
        await self._timeline.add(timeline)
        return analysis

    # ── 2. Entity Extraction ────────────────────────────────────────────────────

    async def extract_case_entities(
        self,
        case_id: UUID,
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = ""
    ) -> Dict[str, Any]:
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot extract entities for a closed case.", "CASE_003")

        # Authorization check
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can view entities.", "CASE_002")

        stmt = select(Complaint).where(Complaint.id == case.complaint_id)
        res = await self._cases.db.execute(stmt)
        complaint = res.scalars().first()
        if not complaint or not complaint.complaint_text:
            raise DomainException("Associated complaint text is missing.", "AI_400")

        payload = EntityExtractionRequest(text=complaint.complaint_text)
        response = await self._ai.extract_entities(payload, request_id, correlation_id)

        # Map confidence scores to High, Medium, Low strings
        entities_data = []
        for e in response.entities:
            conf = e.confidence
            if conf >= 0.90:
                conf_level = "High"
            elif conf >= 0.70:
                conf_level = "Medium"
            else:
                conf_level = "Low"

            entities_data.append({
                "text": e.text,
                "type": e.type,
                "confidence": conf,
                "confidence_level": conf_level,
                "start_offset": e.start_offset,
                "end_offset": e.end_offset
            })

        return {
            "entities": entities_data,
            "model_meta": response.model_meta.model_dump()
        }

    # ── 3. FIR Draft Assistance ──────────────────────────────────────────────────

    async def generate_fir_draft(
        self,
        case_id: UUID,
        actor_id: UUID,
        actor_role: str,
        officer_notes: Optional[str] = None,
        request_id: str = "",
        correlation_id: str = ""
    ) -> AIFIRSuggestion:
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot generate drafts on a closed case.", "CASE_003")

        # Enforce investigator check
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can generate FIR drafts.", "CASE_002")

        fir = await self._firs.get_by_case_id(case_id)
        if not fir:
            raise DomainException("FIR record does not exist for this case.", "FIR_001")
        if fir.status not in ("Draft", "Returned"):
            raise DomainException(f"FIR is already {fir.status}. Cannot generate draft for finalized FIR.", "FIR_003")

        # Extract entities temporarily for the payload
        extraction = await self.extract_case_entities(case_id, actor_id, actor_role, request_id, correlation_id)
        entities_list = [{"text": e["text"], "type": e["type"]} for e in extraction["entities"]]

        payload = FIRDraftRequest(
            complaint_summary=case.title,
            extracted_entities=entities_list,
            officer_notes=officer_notes,
            formatting_template="STANDARD"
        )
        response = await self._ai.assist_fir_draft(payload, request_id, correlation_id)

        # Deactivate previous drafts
        existing = await self._fir_suggestions.get_by_case_id(case_id)
        if existing:
            existing.review_status = "Superseded"

        suggestion = AIFIRSuggestion(
            id=uuid4(),
            case_id=case_id,
            fir_id=fir.id,
            original_narrative_draft=response.draft_narrative,
            approved_narrative=None,
            review_status="Draft",
            model_provider=response.model_meta.provider,
            model_name=response.model_meta.model_name,
            model_version=response.model_meta.model_version,
            prompt_template_version=response.model_meta.prompt_template_version,
            temperature=response.model_meta.temperature,
            max_tokens=response.model_meta.max_tokens,
            processing_time_ms=response.model_meta.processing_time_ms,
            prompt_hash=response.model_meta.prompt_hash,
            response_hash=response.model_meta.response_hash
        )
        await self._fir_suggestions.add(suggestion)
        await self._fir_suggestions.db.flush()

        # Audit
        audit = AuditLog(
            actor_id=actor_id,
            action="AI_FIR_DRAFT",
            entity_type="AIFIRSuggestion",
            entity_id=suggestion.id,
            old_state=None,
            new_state=json.dumps({"review_status": "Draft"}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)
        return suggestion

    async def review_fir_draft(
        self,
        suggestion_id: UUID,
        action: str,  # ACCEPT, EDIT, REJECT
        edited_narrative: Optional[str],
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = ""
    ) -> AIFIRSuggestion:
        suggestion = await self._fir_suggestions.get_active_by_id(suggestion_id)
        if not suggestion:
            raise DomainException("AI FIR suggestion not found.", "AI_404")
        if suggestion.review_status != "Draft":
            raise DomainException("AI FIR suggestion has already been reviewed.", "AI_400")

        case = await self._cases.get_active_by_id(suggestion.case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot review suggestions on a closed case.", "CASE_003")

        # Authorization: assigned investigator
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can review this suggestion.", "CASE_002")

        fir = await self._firs.get_active_by_id(suggestion.fir_id)
        if not fir:
            raise DomainException("FIR record not found.", "FIR_001")
        if fir.status not in ("Draft", "Returned"):
            raise DomainException("FIR has already been finalized.", "FIR_003")

        old_status = suggestion.review_status
        suggestion.reviewed_by_id = actor_id
        suggestion.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

        if action == "REJECT":
            suggestion.review_status = "Rejected"
            timeline_title = "AI FIR Draft Rejected"
            timeline_desc = "Officer rejected the AI-assisted FIR draft narrative."
        else:
            # ACCEPT or EDIT
            if action == "EDIT" and edited_narrative:
                suggestion.review_status = "Edited"
                suggestion.approved_narrative = edited_narrative
                timeline_title = "AI FIR Draft Approved with Edits"
                timeline_desc = "Officer edited and approved the AI-assisted FIR draft."
            else:
                suggestion.review_status = "Approved"
                suggestion.approved_narrative = suggestion.original_narrative_draft
                timeline_title = "AI FIR Draft Approved"
                timeline_desc = "Officer approved the AI-assisted FIR draft."

            # Save previous version of FIR details to amendment history
            amendment = FIRVersion(
                fir_id=fir.id,
                version_number=fir.version_number,
                acts_sections=fir.acts_sections,
                details=fir.details,
                modified_by_id=actor_id
            )
            await self._firs.add_amendment(amendment)

            # Update core FIR details
            fir.details = suggestion.approved_narrative
            fir.version_number += 1

        await self._fir_suggestions.db.flush()

        # Audit
        audit = AuditLog(
            actor_id=actor_id,
            action="AI_FIR_REVIEW",
            entity_type="AIFIRSuggestion",
            entity_id=suggestion.id,
            old_state=json.dumps({"review_status": old_status}),
            new_state=json.dumps({"review_status": suggestion.review_status}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        # Timeline Event
        timeline = CaseTimelineEvent(
            case_id=case.id,
            title=timeline_title,
            description=timeline_desc,
            event_type="NOTE",
            actor_id=actor_id
        )
        await self._timeline.add(timeline)
        return suggestion

    # ── 4. Legal Recommendations ───────────────────────────────────────────────

    async def recommend_legal_sections(
        self,
        case_id: UUID,
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = ""
    ) -> AILegalRecommendation:
        case = await self._cases.get_active_by_id(case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot get legal recommendations on a closed case.", "CASE_003")

        # Authorization: assigned investigator
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can fetch suggestions.", "CASE_002")

        stmt = select(Complaint).where(Complaint.id == case.complaint_id)
        res = await self._cases.db.execute(stmt)
        complaint = res.scalars().first()
        if not complaint or not complaint.complaint_text:
            raise DomainException("Associated complaint text is missing.", "AI_400")

        payload = LegalRecommendationRequest(crime_description=complaint.complaint_text)
        response = await self._ai.recommend_legal_sections(payload, request_id, correlation_id)

        # Deactivate old legal recommendations
        existing = await self._legal_recs.get_by_case_id(case_id)
        if existing:
            existing.review_status = "Superseded"

        rec = AILegalRecommendation(
            id=uuid4(),
            case_id=case_id,
            suggested_sections=json.dumps([r.model_dump() for r in response.recommendations]),
            officer_approved_sections=None,
            review_status="Draft",
            model_provider=response.model_meta.provider,
            model_name=response.model_meta.model_name,
            model_version=response.model_meta.model_version,
            prompt_template_version=response.model_meta.prompt_template_version,
            temperature=response.model_meta.temperature,
            max_tokens=response.model_meta.max_tokens,
            processing_time_ms=response.model_meta.processing_time_ms,
            prompt_hash=response.model_meta.prompt_hash,
            response_hash=response.model_meta.response_hash
        )
        await self._legal_recs.add(rec)
        await self._legal_recs.db.flush()

        # Audit
        audit = AuditLog(
            actor_id=actor_id,
            action="AI_LEGAL_SUGGESTION",
            entity_type="AILegalRecommendation",
            entity_id=rec.id,
            old_state=None,
            new_state=json.dumps({"review_status": "Draft"}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)
        return rec

    async def review_legal_recommendations(
        self,
        recommendation_id: UUID,
        approved_sections: List[str],  # List of approved BNS codes
        actor_id: UUID,
        actor_role: str,
        request_id: str = "",
        correlation_id: str = ""
    ) -> AILegalRecommendation:
        rec = await self._legal_recs.get_active_by_id(recommendation_id)
        if not rec:
            raise DomainException("AI legal recommendation record not found.", "AI_404")
        if rec.review_status != "Draft":
            raise DomainException("AI recommendations have already been reviewed.", "AI_400")

        case = await self._cases.get_active_by_id(rec.case_id)
        if not case:
            raise CaseNotFoundException()
        if case.status == "Closed":
            raise CaseClosedException("Cannot review legal recommendations on a closed case.", "CASE_003")

        # Authorization: assigned investigator
        if actor_role == "INVESTIGATOR" and case.assigned_officer_id != actor_id:
            raise CaseAssignmentException("Only the assigned investigator can review suggestions.", "CASE_002")

        fir = await self._firs.get_by_case_id(rec.case_id)
        if not fir:
            raise DomainException("FIR record not found.", "FIR_001")
        if fir.status not in ("Draft", "Returned"):
            raise DomainException("FIR has already been finalized.", "FIR_003")

        old_status = rec.review_status
        rec.reviewed_by_id = actor_id
        rec.reviewed_at = datetime.datetime.now(datetime.timezone.utc)

        if not approved_sections:
            rec.review_status = "Rejected"
            rec.officer_approved_sections = json.dumps([])
            timeline_title = "AI Legal Recommendations Rejected"
            timeline_desc = "Officer rejected the AI-suggested BNS sections."
        else:
            rec.review_status = "Approved"
            rec.officer_approved_sections = json.dumps(approved_sections)
            timeline_title = "AI Legal Recommendations Approved"
            timeline_desc = f"Officer approved BNS sections: {', '.join(approved_sections)}."

            # Save previous version of FIR to history
            amendment = FIRVersion(
                fir_id=fir.id,
                version_number=fir.version_number,
                acts_sections=fir.acts_sections,
                details=fir.details,
                modified_by_id=actor_id
            )
            await self._firs.add_amendment(amendment)

            # Update core FIR acts/sections field
            fir.acts_sections = ", ".join(approved_sections)
            fir.version_number += 1

        await self._legal_recs.db.flush()

        # Audit
        audit = AuditLog(
            actor_id=actor_id,
            action="AI_LEGAL_REVIEW",
            entity_type="AILegalRecommendation",
            entity_id=rec.id,
            old_state=json.dumps({"review_status": old_status}),
            new_state=json.dumps({"review_status": rec.review_status, "approved_sections": approved_sections}),
            request_id=request_id,
            correlation_id=correlation_id
        )
        await self._audit.add(audit)

        # Timeline Event
        timeline = CaseTimelineEvent(
            case_id=case.id,
            title=timeline_title,
            description=timeline_desc,
            event_type="NOTE",
            actor_id=actor_id
        )
        await self._timeline.add(timeline)
        return rec
