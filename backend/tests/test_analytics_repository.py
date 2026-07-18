import pytest
import datetime
from uuid import uuid4
from app.models.case import Case
from app.models.complaint import Complaint
from app.models.fir import FIR
from app.models.ai_integration import AICaseAnalysis
from app.repositories.analytics_repository import AnalyticsRepository

@pytest.mark.asyncio
async def test_analytics_aggregations(db_session):
    # Setup data
    complaint = Complaint(
        citizen_name="Citizen Analytics", citizen_contact="+910001112222",
        complaint_text="My wallet was stolen.", status="Approved", source="WEB"
    )
    db_session.add(complaint)
    await db_session.flush()

    case = Case(
        complaint_id=complaint.id, case_number="CASE/2026/ANALYTICS",
        title="Wallet Theft", category="Theft", severity="Moderate", priority="P3",
        status="Under Investigation"
    )
    db_session.add(case)
    await db_session.flush()

    ai_analysis = AICaseAnalysis(
        id=uuid4(), case_id=case.id, summary_draft="Mock summary",
        suggested_category="Theft", suggested_severity="Major", suggested_priority="P2",
        suggested_department="HQ", model_provider="self", model_name="llama",
        review_status="Approved" # Accepted AI analysis
    )
    db_session.add(ai_analysis)
    await db_session.flush()

    # Run analytical repository tests
    analytics_repo = AnalyticsRepository(db_session)
    start_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
    end_date = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)

    # 1. Crime stats
    crime_stats = await analytics_repo.get_crime_statistics(start_date, end_date)
    assert len(crime_stats) > 0
    assert crime_stats[0]["category"] == "Theft"
    assert crime_stats[0]["count"] == 1

    # 2. Case stats
    case_stats = await analytics_repo.get_case_statistics(start_date, end_date)
    assert case_stats["total_cases"] == 1
    assert "Under Investigation" in case_stats["status_counts"]

    # 3. AI stats
    ai_stats = await analytics_repo.get_ai_statistics(start_date, end_date)
    assert ai_stats["total_suggestions"] == 1
    assert ai_stats["acceptance_rate"] == 1.0
