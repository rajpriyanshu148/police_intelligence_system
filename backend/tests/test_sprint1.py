"""
Sprint 1 tests: Citizen, Complaint, and Case management.
"""
import pytest
from httpx import AsyncClient
from app.core.security import get_password_hash
from app.models.officer import Officer


def _supervisor() -> Officer:
    return Officer(
        username="supervisor", email="sup@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-SUP01", department="HQ",
        role="SUPERVISOR", status="Active",
    )


def _investigator() -> Officer:
    return Officer(
        username="investigator", email="inv@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-INV01", department="CID",
        role="INVESTIGATOR", status="Active",
    )


async def _login(client, username, password="Admin1234!"):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["access_token"]


# ── Citizens ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_citizen(client: AsyncClient, db_session):
    db_session.add(_supervisor())
    await db_session.flush()
    token = await _login(client, "supervisor")
    resp = await client.post(
        "/api/v1/citizens",
        json={"name": "Rajesh Kumar", "phone_number": "+919999111111",
              "national_id": "AAAA-1234-5678", "address": "12, Park St, Delhi"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["name"] == "Rajesh Kumar"


@pytest.mark.asyncio
async def test_duplicate_citizen_rejected(client: AsyncClient, db_session):
    db_session.add(_supervisor())
    await db_session.flush()
    token = await _login(client, "supervisor")
    payload = {"name": "Citizen A", "phone_number": "+919000000001",
               "national_id": "BBBB-0001-0001", "address": "1 Main St"}
    await client.post("/api/v1/citizens", json=payload, headers={"Authorization": f"Bearer {token}"})
    # same national_id
    payload["phone_number"] = "+919000000002"
    resp = await client.post("/api/v1/citizens", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400
    assert "CITIZEN_002" in resp.json()["error"]["code"]


# ── Complaints ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_and_assign_complaint(client: AsyncClient, db_session):
    sup = _supervisor()
    inv = _investigator()
    db_session.add_all([sup, inv])
    await db_session.flush()

    sup_token = await _login(client, "supervisor")

    # Create complaint
    resp = await client.post(
        "/api/v1/complaints",
        json={"citizen_name": "John Doe", "citizen_contact": "+911234567890",
              "complaint_text": "My motorcycle was stolen from outside my house yesterday night."},
        headers={"Authorization": f"Bearer {sup_token}"},
    )
    assert resp.status_code == 201
    complaint_id = resp.json()["data"]["id"]

    # Assign to investigator
    assign_resp = await client.post(
        f"/api/v1/complaints/{complaint_id}/assign",
        json={"officer_id": str(inv.id)},
        headers={"Authorization": f"Bearer {sup_token}"},
    )
    assert assign_resp.status_code == 200
    assert assign_resp.json()["data"]["status"] == "Assigned"


@pytest.mark.asyncio
async def test_complaint_status_transition(client: AsyncClient, db_session):
    sup = _supervisor()
    db_session.add(sup)
    await db_session.flush()
    token = await _login(client, "supervisor")

    create = await client.post(
        "/api/v1/complaints",
        json={"citizen_name": "Jane Doe", "citizen_contact": "+910987654321",
              "complaint_text": "Fraud committed by local shopkeeper - needs investigation."},
        headers={"Authorization": f"Bearer {token}"},
    )
    complaint_id = create.json()["data"]["id"]

    # Pending → Rejected
    status_resp = await client.post(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "Rejected"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["data"]["status"] == "Rejected"


# ── Cases ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_case_from_complaint(client: AsyncClient, db_session):
    sup = _supervisor()
    db_session.add(sup)
    await db_session.flush()
    token = await _login(client, "supervisor")

    # Create complaint first
    complaint_resp = await client.post(
        "/api/v1/complaints",
        json={"citizen_name": "Test Citizen", "citizen_contact": "+910001112222",
              "complaint_text": "Armed robbery at night market near sector 14 area."},
        headers={"Authorization": f"Bearer {token}"},
    )
    complaint_id = complaint_resp.json()["data"]["id"]

    # Promote to case
    case_resp = await client.post(
        "/api/v1/cases",
        json={"complaint_id": complaint_id, "title": "Armed Robbery Investigation",
              "category": "Robbery", "severity": "High", "priority": "P1"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert case_resp.status_code == 201
    case_data = case_resp.json()["data"]
    assert "CASE/" in case_data["case_number"]
    assert case_data["status"] == "Under Investigation"


@pytest.mark.asyncio
async def test_duplicate_case_rejected(client: AsyncClient, db_session):
    sup = _supervisor()
    db_session.add(sup)
    await db_session.flush()
    token = await _login(client, "supervisor")

    complaint_resp = await client.post(
        "/api/v1/complaints",
        json={"citizen_name": "Another Citizen", "citizen_contact": "+910003334444",
              "complaint_text": "Cybercrime fraud involving online banking transactions."},
        headers={"Authorization": f"Bearer {token}"},
    )
    complaint_id = complaint_resp.json()["data"]["id"]

    case_payload = {"complaint_id": complaint_id, "title": "Cybercrime Case",
                    "category": "Cybercrime", "severity": "High", "priority": "P2"}
    await client.post("/api/v1/cases", json=case_payload, headers={"Authorization": f"Bearer {token}"})
    # second time — must be rejected
    resp = await client.post("/api/v1/cases", json=case_payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "CASE_002"


@pytest.mark.asyncio
async def test_timeline_event_added(client: AsyncClient, db_session):
    sup = _supervisor()
    db_session.add(sup)
    await db_session.flush()
    token = await _login(client, "supervisor")

    complaint_resp = await client.post(
        "/api/v1/complaints",
        json={"citizen_name": "T Citizen", "citizen_contact": "+910005556666",
              "complaint_text": "Murder case reported near the railway station at midnight."},
        headers={"Authorization": f"Bearer {token}"},
    )
    complaint_id = complaint_resp.json()["data"]["id"]
    case_resp = await client.post(
        "/api/v1/cases",
        json={"complaint_id": complaint_id, "title": "Homicide", "category": "Murder",
              "severity": "Critical", "priority": "P1"},
        headers={"Authorization": f"Bearer {token}"},
    )
    case_id = case_resp.json()["data"]["id"]

    timeline_resp = await client.post(
        f"/api/v1/cases/{case_id}/timeline",
        json={"event_time": "2026-07-17T06:00:00Z", "title": "Scene Investigation",
              "description": "Forensics team arrived and collected evidence from the crime scene."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert timeline_resp.status_code == 201
    assert timeline_resp.json()["data"]["title"] == "Scene Investigation"


@pytest.mark.asyncio
async def test_investigator_cannot_modify_unassigned_case(client: AsyncClient, db_session):
    sup = _supervisor()
    inv = _investigator()
    db_session.add_all([sup, inv])
    await db_session.flush()

    sup_token = await _login(client, "supervisor")
    inv_token = await _login(client, "investigator")

    complaint_resp = await client.post(
        "/api/v1/complaints",
        json={"citizen_name": "P Citizen", "citizen_contact": "+910007778888",
              "complaint_text": "Theft of electronic equipment from company premises at night."},
        headers={"Authorization": f"Bearer {sup_token}"},
    )
    complaint_id = complaint_resp.json()["data"]["id"]
    case_resp = await client.post(
        "/api/v1/cases",
        json={"complaint_id": complaint_id, "title": "Theft Case",
              "category": "Theft", "severity": "Medium", "priority": "P2"},
        headers={"Authorization": f"Bearer {sup_token}"},
    )
    case_id = case_resp.json()["data"]["id"]

    # Investigator attempts to update — should be forbidden (not assigned)
    upd_resp = await client.patch(
        f"/api/v1/cases/{case_id}",
        json={"title": "Hacked Case"},
        headers={"Authorization": f"Bearer {inv_token}"},
    )
    assert upd_resp.status_code == 400
    assert upd_resp.json()["error"]["code"] == "CASE_004"
