"""
Sprint 1 tests: Officer Management — CRUD, RBAC enforcement, soft delete.
"""
import pytest
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.models.officer import Officer


def _admin() -> Officer:
    return Officer(
        username="admin_user", email="admin@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-00001", department="HQ",
        role="ADMIN", status="Active",
    )


def _investigator() -> Officer:
    return Officer(
        username="inv_user", email="inv@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-00002", department="CID",
        role="INVESTIGATOR", status="Active",
    )


async def _login(client, username, password="Admin1234!"):
    resp = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return resp.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_create_officer_as_admin(client: AsyncClient, db_session):
    db_session.add(_admin())
    await db_session.flush()
    token = await _login(client, "admin_user")
    resp = await client.post(
        "/api/v1/officers",
        json={
            "username": "new_officer", "email": "new@police.gov",
            "password": "Secure123!", "badge_number": "IND-99999",
            "department": "Traffic", "role": "INVESTIGATOR",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["username"] == "new_officer"


@pytest.mark.asyncio
async def test_create_officer_as_investigator_forbidden(client: AsyncClient, db_session):
    db_session.add(_investigator())
    await db_session.flush()
    token = await _login(client, "inv_user")
    resp = await client.post(
        "/api/v1/officers",
        json={
            "username": "bad_officer", "email": "bad@police.gov",
            "password": "Secure123!", "badge_number": "IND-88888",
            "department": "CID", "role": "INVESTIGATOR",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_duplicate_officer_rejected(client: AsyncClient, db_session):
    db_session.add(_admin())
    await db_session.flush()
    token = await _login(client, "admin_user")
    payload = {
        "username": "dup_officer", "email": "dup@police.gov",
        "password": "Secure123!", "badge_number": "IND-77777",
        "department": "HQ", "role": "INVESTIGATOR",
    }
    await client.post("/api/v1/officers", json=payload, headers={"Authorization": f"Bearer {token}"})
    # second call with same badge — should fail
    payload["username"] = "dup2"
    payload["email"] = "dup2@police.gov"
    resp = await client.post("/api/v1/officers", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "OFFICER_002"


@pytest.mark.asyncio
async def test_soft_delete_officer(client: AsyncClient, db_session):
    db_session.add(_admin())
    await db_session.flush()
    token = await _login(client, "admin_user")
    # create
    create_resp = await client.post(
        "/api/v1/officers",
        json={
            "username": "del_officer", "email": "del@police.gov",
            "password": "Secure123!", "badge_number": "IND-66666",
            "department": "Finance", "role": "INVESTIGATOR",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    officer_id = create_resp.json()["data"]["id"]
    # delete
    del_resp = await client.delete(
        f"/api/v1/officers/{officer_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_resp.status_code == 200
    # confirm not found
    get_resp = await client.get(
        f"/api/v1/officers/{officer_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_resp.status_code == 404
