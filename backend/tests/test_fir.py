import pytest
from httpx import AsyncClient
from uuid import uuid4
from app.core.security import get_password_hash
from app.models.officer import Officer
from app.models.case import Case
from app.models.complaint import Complaint

def _supervisor() -> Officer:
    return Officer(
        username="supervisor_fir", email="sup_fir@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-SUP03", department="CID",
        role="SUPERVISOR", status="Active",
    )

def _investigator() -> Officer:
    return Officer(
        username="investigator_fir", email="inv_fir@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-INV04", department="CID",
        role="INVESTIGATOR", status="Active",
    )

async def _login(client, username, password="Admin1234!"):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_fir_draft_edit_submit_approve_workflow(client: AsyncClient, db_session):
    sup = _supervisor()
    inv = _investigator()
    db_session.add_all([sup, inv])
    await db_session.flush()

    # Case setup
    complaint = Complaint(
        citizen_name="Citizen Y", citizen_contact="+910009998888",
        complaint_text="Weapon theft", status="Approved", source="WEB"
    )
    db_session.add(complaint)
    await db_session.flush()

    case = Case(
        complaint_id=complaint.id, case_number="CASE/2026/8888",
        title="Weapon Theft Investigation", category="Theft", severity="Critical", priority="P1",
        status="Under Investigation", assigned_officer_id=inv.id
    )
    db_session.add(case)
    await db_session.flush()

    inv_token = await _login(client, "investigator_fir")
    sup_token = await _login(client, "supervisor_fir")

    # ── 1. Create Draft FIR ────────────────────────────────────────────────────
    fir_payload = {
        "complainant_name": "Rohan Sen",
        "complainant_contact": "+918888888888",
        "incident_date": "2026-07-16T21:45:00Z",
        "incident_place": "Connaught Place Sector 4, New Delhi",
        "acts_sections": "BNS Section 303 (Theft)",
        "details": "Complainant reported theft of a blue scooter parked outside station."
    }
    
    resp = await client.post(
        f"/api/v1/cases/{case.id}/fir",
        json=fir_payload,
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert resp.status_code == 201
    fir_data = resp.json()["data"]
    assert fir_data["status"] == "Draft"
    assert "FIR/DRAFT" in fir_data["fir_number"]

    # ── 2. Edit Draft FIR (creates history record) ──────────────────────────────
    edit_payload = {
        "acts_sections": "BNS Section 303, Section 379",
        "details": "Amended: Complainant reported theft of a blue scooter with registration DL-3C-1234."
    }
    edit_resp = await client.patch(
        f"/api/v1/cases/{case.id}/fir",
        json=edit_payload,
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert edit_resp.status_code == 200
    assert edit_resp.json()["data"]["version_number"] == 2

    # Check history contains version 1
    hist_resp = await client.get(
        f"/api/v1/cases/{case.id}/fir/history",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert hist_resp.status_code == 200
    assert len(hist_resp.json()["data"]) == 1
    assert hist_resp.json()["data"][0]["version_number"] == 1
    assert "BNS Section 303 (Theft)" in hist_resp.json()["data"][0]["acts_sections"]

    # ── 3. Submit FIR ──────────────────────────────────────────────────────────
    sub_resp = await client.post(
        f"/api/v1/cases/{case.id}/fir/submit",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert sub_resp.status_code == 200
    assert sub_resp.json()["data"]["status"] == "Submitted"

    # ── 4. Return for Corrections ──────────────────────────────────────────────
    ret_resp = await client.post(
        f"/api/v1/cases/{case.id}/fir/approve",
        json={"approved": False, "feedback": "Correction requested in details.", "action": "RETURN"},
        headers={"Authorization": f"Bearer {sup_token}"}
    )
    assert ret_resp.status_code == 200
    assert ret_resp.json()["data"]["status"] == "Returned"

    # Resubmit
    await client.post(
        f"/api/v1/cases/{case.id}/fir/submit",
        headers={"Authorization": f"Bearer {inv_token}"}
    )

    # ── 5. Approve FIR (finalizes, generates sequential FIR number) ─────────────
    app_resp = await client.post(
        f"/api/v1/cases/{case.id}/fir/approve",
        json={"approved": True, "feedback": "Perfect details.", "action": "APPROVE"},
        headers={"Authorization": f"Bearer {sup_token}"}
    )
    assert app_resp.status_code == 200
    assert app_resp.json()["data"]["status"] == "Approved"
    assert "FIR/CID/2026/0001" in app_resp.json()["data"]["fir_number"]
