import pytest
import datetime
from uuid import uuid4
from app.models.case import Case
from app.models.complaint import Complaint
from app.models.fir import FIR
from app.models.ai_integration import AICaseAnalysis, AIFIRSuggestion, AILegalRecommendation
from app.repositories.ai_repository import (
    AICaseAnalysisRepository, AIFIRSuggestionRepository, AILegalRecommendationRepository
)

@pytest.mark.asyncio
async def test_ai_repositories_crud(db_session):
    # Setup Case and Complaint
    complaint = Complaint(
        citizen_name="Test Citizen AI", citizen_contact="+919999888877",
        complaint_text="My house was broken into.", status="Approved", source="WEB"
    )
    db_session.add(complaint)
    await db_session.flush()

    case = Case(
        complaint_id=complaint.id, case_number="CASE/2026/0999",
        title="House Breaking Investigation", category="Trespass", severity="Major", priority="P2",
        status="Under Investigation"
    )
    db_session.add(case)
    await db_session.flush()

    fir = FIR(
        case_id=case.id, fir_number="FIR/DRAFT/0999", status="Draft",
        complainant_name="Test Citizen AI", complainant_contact="+919999888877",
        incident_date=datetime.datetime.now(datetime.timezone.utc),
        incident_place="CP", acts_sections="BNS 331", details="Details draft",
        created_by_id=uuid4()
    )
    db_session.add(fir)
    await db_session.flush()

    # Instantiate Repositories
    analysis_repo = AICaseAnalysisRepository(db_session)
    fir_repo = AIFIRSuggestionRepository(db_session)
    legal_repo = AILegalRecommendationRepository(db_session)

    # 1. AICaseAnalysis
    analysis = AICaseAnalysis(
        id=uuid4(), case_id=case.id, summary_draft="Mock summary",
        suggested_category="Trespass", suggested_severity="Major", suggested_priority="P2",
        suggested_department="HQ", model_provider="self", model_name="llama", review_status="Draft"
    )
    await analysis_repo.add(analysis)
    await db_session.flush()

    fetched_analysis = await analysis_repo.get_by_case_id(case.id)
    assert fetched_analysis is not None
    assert fetched_analysis.summary_draft == "Mock summary"

    # 2. AIFIRSuggestion
    fir_sugg = AIFIRSuggestion(
        id=uuid4(), case_id=case.id, fir_id=fir.id, original_narrative_draft="Narrative draft",
        review_status="Draft", model_provider="self", model_name="llama"
    )
    await fir_repo.add(fir_sugg)
    await db_session.flush()

    fetched_fir = await fir_repo.get_by_case_id(case.id)
    assert fetched_fir is not None
    assert fetched_fir.original_narrative_draft == "Narrative draft"

    # 3. AILegalRecommendation
    legal_sugg = AILegalRecommendation(
        id=uuid4(), case_id=case.id, suggested_sections="[]", review_status="Draft",
        model_provider="self", model_name="llama"
    )
    await legal_repo.add(legal_sugg)
    await db_session.flush()

    fetched_legal = await legal_repo.get_by_case_id(case.id)
    assert fetched_legal is not None
    assert fetched_legal.suggested_sections == "[]"
