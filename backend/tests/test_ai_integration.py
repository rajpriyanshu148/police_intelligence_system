import pytest
import datetime
from httpx import AsyncClient
from uuid import uuid4, UUID
from app.core.security import get_password_hash
from app.models.officer import Officer
from app.models.case import Case
from app.models.complaint import Complaint
from app.models.fir import FIR
from app.models.ai_integration import AICaseAnalysis, AIFIRSuggestion, AILegalRecommendation

def _investigator() -> Officer:
    return Officer(
        username="investigator_ai", email="inv_ai@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-INV06", department="CID",
        role="INVESTIGATOR", status="Active",
    )

def _supervisor() -> Officer:
    return Officer(
        username="supervisor_ai", email="sup_ai@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-SUP06", department="CID",
        role="SUPERVISOR", status="Active",
    )

async def _login(client, username, password="Admin1234!"):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_ai_integration_workflow_e2e(client: AsyncClient, db_session):
    inv = _investigator()
    sup = _supervisor()
    db_session.add_all([inv, sup])
    await db_session.commit()

    # Complaint & Case Setup
    complaint = Complaint(
        citizen_name="Citizen AI", citizen_contact="+910007776666",
        complaint_text="My laptop was stolen from central library.", status="Approved", source="WEB"
    )
    db_session.add(complaint)
    await db_session.commit()

    case = Case(
        complaint_id=complaint.id, case_number="CASE/2026/0500",
        title="Library Laptop Theft", category="Theft", severity="Moderate", priority="P3",
        status="Under Investigation", assigned_officer_id=inv.id
    )
    db_session.add(case)
    await db_session.commit()

    # Store raw UUID values
    case_uuid = case.id

    inv_token = await _login(client, "investigator_ai")
    sup_token = await _login(client, "supervisor_ai")

    # ── 1. Run AI Complaint Analysis ─────────────────────────────────────────
    analyze_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/ai/analyze",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert analyze_resp.status_code == 200
    analysis_data = analyze_resp.json()["data"]
    assert analysis_data["review_status"] == "Draft"
    assert "Theft" in analysis_data["suggested_category"]
    
    analysis_uuid = UUID(analysis_data["id"])

    # ── 2. Submit Officer Review for Case Analysis (Approve with Edits) ───────
    review_analysis_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/ai/review",
        json={
            "target_type": "ANALYSIS",
            "suggestion_id": str(analysis_uuid),
            "action": "EDIT",
            "edited_text": "Approved Summary: Laptop theft reported at central library by Citizen AI."
        },
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert review_analysis_resp.status_code == 200
    assert review_analysis_resp.json()["data"]["review_outcome"] == "Edited"

    # Verify that case properties were promoted on core Case table
    # Start fresh transaction to read from DB
    await db_session.commit()
    db_case = await db_session.get(Case, case_uuid)
    assert db_case.category == "Theft"
    assert db_case.severity == "Major"      # Promoted from AI analysis mock response
    assert db_case.priority == "P2"         # Promoted from P3 to P2

    # ── 3. Run AI Named Entity Extraction ─────────────────────────────────────
    entities_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/ai/entities",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert entities_resp.status_code == 200
    entities_data = entities_resp.json()["data"]["entities"]
    assert len(entities_data) > 0
    # Checks confidence tags mapping
    assert entities_data[0]["confidence_level"] in ("High", "Medium", "Low")

    # Setup FIR Draft
    fir = FIR(
        case_id=case_uuid, fir_number="FIR/DRAFT/0500", status="Draft",
        complainant_name="Citizen AI", complainant_contact="+910007776666",
        incident_date=datetime.datetime.now(datetime.timezone.utc),
        incident_place="Central Library", acts_sections="BNS 303", details="Narrative placeholder",
        created_by_id=inv.id
    )
    db_session.add(fir)
    await db_session.commit()
    fir_uuid = fir.id

    # ── 4. Generate AI FIR Narrative Draft ────────────────────────────────────
    fir_draft_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/ai/fir",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert fir_draft_resp.status_code == 200
    fir_draft_data = fir_draft_resp.json()["data"]
    assert fir_draft_data["review_status"] == "Draft"
    
    fir_sugg_uuid = UUID(fir_draft_data["id"])

    # Review and Approve FIR Draft Suggestion
    review_fir_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/ai/review",
        json={
            "target_type": "FIR",
            "suggestion_id": str(fir_sugg_uuid),
            "action": "ACCEPT"
        },
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert review_fir_resp.status_code == 200
    assert review_fir_resp.json()["data"]["review_outcome"] == "Approved"

    # Verify that FIR details were updated on core FIR record
    await db_session.commit()
    db_fir = await db_session.get(FIR, fir_uuid)
    assert "FIRST INFORMATION REPORT NARRATIVE" in db_fir.details
    assert db_fir.version_number == 2

    # ── 5. Generate AI Legal Recommendations ───────────────────────────────
    legal_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/ai/legal",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert legal_resp.status_code == 200
    legal_data = legal_resp.json()["data"]
    assert legal_data["review_status"] == "Draft"
    
    legal_rec_uuid = UUID(legal_data["id"])

    # Approve BNS section recommendations
    review_legal_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/ai/review",
        json={
            "target_type": "LEGAL",
            "suggestion_id": str(legal_rec_uuid),
            "action": "ACCEPT",
            "approved_sections": ["BNS Section 303", "BNS Section 307"]
        },
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert review_legal_resp.status_code == 200
    assert review_legal_resp.json()["data"]["review_outcome"] == "Approved"

    # Verify that acts/sections are mapped to core FIR record
    await db_session.commit()
    db_fir = await db_session.get(FIR, fir_uuid)
    assert "BNS Section 303" in db_fir.acts_sections
    assert db_fir.version_number == 3

    # ── 6. Query Health Check Route ───────────────────────────────────────────
    health_resp = await client.get(
        "/api/v1/ai/health",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert health_resp.status_code == 200
    assert health_resp.json()["data"]["status"] == "ready"
