"""
Sprint 1 tests: Authentication — login, refresh, lockout, RBAC, password change.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.models.officer import Officer


def _make_officer(**kwargs) -> Officer:
    defaults = dict(
        username="test_admin",
        email="admin@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-00001",
        department="HQ",
        role="ADMIN",
        status="Active",
        failed_login_attempts=0,
    )
    defaults.update(kwargs)
    return Officer(**defaults)


# ── Login ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session):
    db_session.add(_make_officer())
    await db_session.flush()
    resp = await client.post("/api/v1/auth/login", json={"username": "test_admin", "password": "Admin1234!"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert "refresh_token" in body["data"]
    assert body["data"]["officer"]["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db_session):
    db_session.add(_make_officer())
    await db_session.flush()
    resp = await client.post("/api/v1/auth/login", json={"username": "test_admin", "password": "wrongpassword"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "AUTH_001"


@pytest.mark.asyncio
async def test_login_unknown_user(client: AsyncClient, db_session):
    resp = await client.post("/api/v1/auth/login", json={"username": "nobody", "password": "password"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_suspended_officer(client: AsyncClient, db_session):
    db_session.add(_make_officer(status="Suspended"))
    await db_session.flush()
    resp = await client.post("/api/v1/auth/login", json={"username": "test_admin", "password": "Admin1234!"})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "OFFICER_004"


@pytest.mark.asyncio
async def test_account_lockout_after_5_failures(client: AsyncClient, db_session):
    db_session.add(_make_officer())
    await db_session.flush()
    # 5 failed attempts
    for _ in range(5):
        await client.post("/api/v1/auth/login", json={"username": "test_admin", "password": "wrongpass"})
    # 6th attempt should trigger lockout response
    resp = await client.post("/api/v1/auth/login", json={"username": "test_admin", "password": "Admin1234!"})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "OFFICER_003"


# ── Token operations ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session):
    db_session.add(_make_officer())
    await db_session.flush()
    login = await client.post("/api/v1/auth/login", json={"username": "test_admin", "password": "Admin1234!"})
    refresh_token = login.json()["data"]["refresh_token"]
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()["data"]


@pytest.mark.asyncio
async def test_refresh_with_invalid_token(client: AsyncClient, db_session):
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid.token.here"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, db_session):
    db_session.add(_make_officer())
    await db_session.flush()
    login = await client.post("/api/v1/auth/login", json={"username": "test_admin", "password": "Admin1234!"})
    token = login.json()["data"]["access_token"]
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["data"]["username"] == "test_admin"


@pytest.mark.asyncio
async def test_protected_endpoint_no_token(client: AsyncClient, db_session):
    resp = await client.get("/api/v1/officers")
    assert resp.status_code == 401
