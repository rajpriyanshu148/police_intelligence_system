import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_live_endpoint(client: AsyncClient):
    response = await client.get("/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}

    response_v1 = await client.get("/api/v1/live")
    assert response_v1.status_code == 200
    assert response_v1.json() == {"status": "alive"}

@pytest.mark.asyncio
async def test_ready_endpoint(client: AsyncClient):
    response = await client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}

@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["subsystems"]["database"] == "healthy"
    assert "uptime_seconds" in body
    assert "version" in body

@pytest.mark.asyncio
async def test_version_endpoint(client: AsyncClient):
    response = await client.get("/version")
    assert response.status_code == 200
    body = response.json()
    assert body["version"] == "1.0.0"
    assert body["environment"] == "testing"
