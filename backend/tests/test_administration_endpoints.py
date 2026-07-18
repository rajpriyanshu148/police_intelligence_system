import pytest
from uuid import uuid4
from app.core.security import get_password_hash
from app.models.officer import Officer

def _admin() -> Officer:
    return Officer(
        username="admin_s4", email="admin_s4@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-ADM04", department="CID",
        role="ADMIN", status="Active",
    )

def _investigator() -> Officer:
    return Officer(
        username="investigator_s4", email="inv_s4@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-INV04", department="CID",
        role="INVESTIGATOR", status="Active",
    )

async def _login(client, username, password="Admin1234!"):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_admin_settings_rbac_and_crud(client, db_session):
    admin = _admin()
    inv = _investigator()
    db_session.add_all([admin, inv])
    await db_session.commit()

    admin_token = await _login(client, "admin_s4")
    inv_token = await _login(client, "investigator_s4")

    # 1. Test RBAC: Investigator is forbidden to fetch settings
    r = await client.get("/api/v1/admin/settings", headers={"Authorization": f"Bearer {inv_token}"})
    assert r.status_code == 403

    # 2. Test Admin can add/update settings
    r = await client.put(
        "/api/v1/admin/settings/DUPLICATE_SIMILARITY_THRESHOLD",
        json={"value": "0.85", "description": "AI Cosine similarity threshold override"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r.status_code == 200
    assert r.json()["data"]["value"] == "0.85"

    # Fetch settings
    r = await client.get("/api/v1/admin/settings", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert len(r.json()["data"]) > 0

    # 3. Test Dashboard Preference CRUD
    pref_payload = {"preference_json": {"layouts": "custom_investigator"}}
    r = await client.post(
        "/api/v1/dashboard/preferences",
        json=pref_payload,
        headers={"Authorization": f"Bearer {inv_token}"}
    )
    assert r.status_code == 200

    r = await client.get("/api/v1/dashboard/preferences", headers={"Authorization": f"Bearer {inv_token}"})
    assert r.status_code == 200
    assert r.json()["data"]["layouts"] == "custom_investigator"
