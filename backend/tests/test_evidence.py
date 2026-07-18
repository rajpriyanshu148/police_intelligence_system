import pytest
from httpx import AsyncClient
from uuid import uuid4
from app.core.security import get_password_hash
from app.models.officer import Officer
from app.models.case import Case
from app.models.complaint import Complaint

def _supervisor() -> Officer:
    return Officer(
        username="supervisor_test", email="sup_test@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-SUP02", department="HQ",
        role="SUPERVISOR", status="Active",
    )

def _investigator() -> Officer:
    return Officer(
        username="investigator_test", email="inv_test@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-INV02", department="CID",
        role="INVESTIGATOR", status="Active",
    )

def _unassigned_investigator() -> Officer:
    return Officer(
        username="unassigned_inv", email="unassigned@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-INV03", department="CID",
        role="INVESTIGATOR", status="Active",
    )

async def _login(client, username, password="Admin1234!"):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_evidence_upload_confirm_download_and_soft_delete(client: AsyncClient, db_session):
    # Setup officers
    sup = _supervisor()
    inv = _investigator()
    unassigned = _unassigned_investigator()
    db_session.add_all([sup, inv, unassigned])
    await db_session.flush()

    # Setup case
    complaint = Complaint(
        citizen_name="Citizen X", citizen_contact="+910002223333",
        complaint_text="Burglary in progress", status="Approved", source="WEB"
    )
    db_session.add(complaint)
    await db_session.flush()

    case = Case(
        complaint_id=complaint.id, case_number="CASE/2026/9999",
        title="Burglary CP", category="Theft", severity="High", priority="P2",
        status="Under Investigation", assigned_officer_id=inv.id
    )
    db_session.add(case)
    await db_session.flush()

    sup_token = await _login(client, "supervisor_test")
    inv_token = await _login(client, "investigator_test")
    unassigned_token = await _login(client, "unassigned_inv")

    # ── 1. Request Upload URL ──────────────────────────────────────────────────
    upload_payload = {
        "file_name": "evidence_weapon.png",
        "file_size": 102400,
        "mime_type": "image/png",
        "category": "Image",
        "title": "Stolen Weapon Image",
        "description": "Recovered weapon photo"
    }
    
    # Unassigned investigator should fail (CaseAssignmentException)
    bad_upload_resp = await client.post(
        f"/api/v1/cases/{case.id}/evidence/upload-url",
        json=upload_payload,
        headers={"Authorization": f"Bearer {unassigned_token}"}
    )
    assert bad_upload_resp.status_code == 400
    assert bad_upload_resp.json()["error"]["code"] == "CASE_004"

    # Assigned investigator should succeed
    upload_resp = await client.post(
        f"/api/v1/cases/{case.id}/evidence/upload-url",
        json=upload_payload,
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert upload_resp.status_code == 200
    up_data = upload_resp.json()["data"]
    assert "upload_url" in up_data
    assert "storage_path" in up_data
    evidence_id = up_data["evidence_id"]

    # ── 2. Confirm Upload ──────────────────────────────────────────────────────
    confirm_payload = {
        "evidence_id": evidence_id,
        "version_number": 1,
        "storage_path": up_data["storage_path"],
        "sha256_hash": "a" * 64
    }
    confirm_resp = await client.post(
        f"/api/v1/cases/{case.id}/evidence/confirm?title=Stolen%20Weapon%20Image&category=Image&file_name=evidence_weapon.png&file_size=102400&mime_type=image/png",
        json=confirm_payload,
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert confirm_resp.status_code == 201
    assert confirm_resp.json()["data"]["status"] == "VERIFIED"

    # ── 3. List Case Evidence ──────────────────────────────────────────────────
    list_resp = await client.get(
        f"/api/v1/cases/{case.id}/evidence",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert list_resp.status_code == 200
    assert len(list_resp.json()["data"]) == 1
    assert list_resp.json()["data"][0]["id"] == evidence_id

    # ── 4. Download Evidence ───────────────────────────────────────────────────
    # Unassigned investigator should be blocked
    bad_down = await client.get(
        f"/api/v1/cases/{case.id}/evidence/{evidence_id}/download",
        headers={"Authorization": f"Bearer {unassigned_token}"}
    )
    assert bad_down.status_code == 400
    assert bad_down.json()["error"]["code"] == "CASE_004"

    # Assigned investigator should get URL
    down_resp = await client.get(
        f"/api/v1/cases/{case.id}/evidence/{evidence_id}/download",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert down_resp.status_code == 200
    assert "download_url" in down_resp.json()["data"]

    # ── 5. Version History ─────────────────────────────────────────────────────
    ver_resp = await client.get(
        f"/api/v1/cases/{case.id}/evidence/{evidence_id}/versions",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert ver_resp.status_code == 200
    assert len(ver_resp.json()["data"]) == 1
    assert ver_resp.json()["data"][0]["version_number"] == 1

    # ── 6. Soft Delete ─────────────────────────────────────────────────────────
    # Investigator cannot soft-delete
    bad_del = await client.delete(
        f"/api/v1/cases/{case.id}/evidence/{evidence_id}",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert bad_del.status_code == 403

    # Supervisor can delete
    del_resp = await client.delete(
        f"/api/v1/cases/{case.id}/evidence/{evidence_id}",
        headers={"Authorization": f"Bearer {sup_token}"}
    )
    assert del_resp.status_code == 200

    # Confirm it does not appear in normal list queries
    list2_resp = await client.get(
        f"/api/v1/cases/{case.id}/evidence",
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert len(list2_resp.json()["data"]) == 0
