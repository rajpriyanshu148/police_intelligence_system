import pytest
import datetime
from httpx import AsyncClient
from uuid import uuid4
from app.core.security import get_password_hash
from app.models.officer import Officer
from app.models.case import Case
from app.models.complaint import Complaint
from app.models.fir import FIR

def _admin() -> Officer:
    return Officer(
        username="admin_workflow", email="admin_wf@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-ADM02", department="HQ",
        role="ADMIN", status="Active",
    )

def _supervisor() -> Officer:
    return Officer(
        username="supervisor_workflow", email="sup_wf@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-SUP04", department="CID",
        role="SUPERVISOR", status="Active",
    )

def _investigator() -> Officer:
    return Officer(
        username="investigator_workflow", email="inv_wf@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-INV05", department="CID",
        role="INVESTIGATOR", status="Active",
    )

async def _login(client, username, password="Admin1234!"):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_case_workflow_lifecyle_restrictions_and_timeline(client: AsyncClient, db_session):
    adm = _admin()
    sup = _supervisor()
    inv = _investigator()
    db_session.add_all([adm, sup, inv])
    await db_session.commit()  # Use commit to prevent request rollback from erasing officers

    # Case setup
    complaint = Complaint(
        citizen_name="Citizen Z", citizen_contact="+910005554444",
        complaint_text="Car hijacking CP", status="Approved", source="MOBILE"
    )
    db_session.add(complaint)
    await db_session.commit()

    case = Case(
        complaint_id=complaint.id, case_number="CASE/2026/7777",
        title="Hijacking CP", category="Robbery", severity="Critical", priority="P1",
        status="Under Investigation", assigned_officer_id=inv.id
    )
    db_session.add(case)
    await db_session.commit()

    # Create Draft FIR (unapproved)
    fir = FIR(
        case_id=case.id, fir_number="FIR/DRAFT/hijacking", status="Draft",
        complainant_name="Citizen Z", complainant_contact="+910005554444",
        incident_date=datetime.datetime.now(datetime.timezone.utc),
        incident_place="Connaught Place", acts_sections="IPC Section 392",
        details="Draft incident details", created_by_id=inv.id
    )
    db_session.add(fir)
    await db_session.commit()

    # Store IDs in local variables before they expire
    case_uuid = case.id
    fir_uuid = fir.id

    inv_token = await _login(client, "investigator_workflow")
    sup_token = await _login(client, "supervisor_workflow")
    adm_token = await _login(client, "admin_workflow")

    # ── 1. Closing Case without approved FIR must fail ────────────────────────
    close_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/status",
        json={"status": "Closed"},
        headers={"Authorization": f"Bearer {sup_token}"}
    )
    assert close_resp.status_code == 400
    assert close_resp.json()["error"]["code"] == "FIR_005"

    # Now approve the FIR
    # Since we are updating the FIR directly via SQL session, let's fetch it, modify, and commit
    await db_session.commit()  # Start a new transaction clean
    db_fir = await db_session.get(FIR, fir_uuid)
    db_fir.status = "Approved"
    db_fir.fir_number = "FIR/CID/2026/7777"
    await db_session.commit()

    # ── 2. Supervisor can close the case ──────────────────────────────────────
    close_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/status",
        json={"status": "Closed"},
        headers={"Authorization": f"Bearer {sup_token}"}
    )
    print("CLOSE RESP STATUS:", close_resp.status_code)
    print("CLOSE RESP BODY:", close_resp.text)
    assert close_resp.status_code == 200
    assert close_resp.json()["data"]["status"] == "Closed"

    # ── 3. Closed case is read-only (no uploads allowed) ──────────────────────
    upload_payload = {
        "file_name": "evidence_car.png",
        "file_size": 204800,
        "mime_type": "image/png",
        "category": "Image",
        "title": "Stolen car photo",
        "description": "Recovered car from CP outer circle."
    }
    upload_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/evidence/upload-url",
        json=upload_payload,
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert upload_resp.status_code == 400
    assert upload_resp.json()["error"]["code"] == "CASE_003"

    # ── 4. Reopening Case is only allowed for ADMIN ───────────────────────────
    # Supervisor tries to reopen -> should fail (CASE_006)
    bad_reopen = await client.post(
        f"/api/v1/cases/{case_uuid}/status",
        json={"status": "Under Investigation"},
        headers={"Authorization": f"Bearer {sup_token}"}
    )
    assert bad_reopen.status_code == 400
    assert bad_reopen.json()["error"]["code"] == "CASE_006"

    # Admin tries to reopen -> should succeed
    reopen_resp = await client.post(
        f"/api/v1/cases/{case_uuid}/status",
        json={"status": "Under Investigation"},
        headers={"Authorization": f"Bearer {adm_token}"}
    )
    assert reopen_resp.status_code == 200
    assert reopen_resp.json()["data"]["status"] == "Under Investigation"

    # ── 5. Verification of Timeline Events ─────────────────────────────────────
    timeline_resp = await client.get(
        f"/api/v1/cases/{case_uuid}/timeline",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert timeline_resp.status_code == 200
    events = timeline_resp.json()["data"]
    # Check that events exist for status transitions
    event_titles = [e["title"] for e in events]
    assert any("Case status changed to Closed" in t for t in event_titles)
    assert any("Case status changed to Under Investigation" in t for t in event_titles)
