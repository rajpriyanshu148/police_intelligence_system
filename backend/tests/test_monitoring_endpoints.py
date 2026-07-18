import pytest

@pytest.mark.asyncio
async def test_health_monitoring_endpoints(client):
    # 1. Liveness check
    r = await client.get("/api/v1/live")
    assert r.status_code == 200
    assert r.json() == {"status": "alive"}

    # 2. Readiness check
    r = await client.get("/api/v1/ready")
    assert r.status_code == 200
    assert r.json()["status"] == "ready"

    # 3. Detailed health check
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"
    assert "subsystems" in r.json()
    assert r.json()["subsystems"]["database"] == "healthy"
    assert r.json()["subsystems"]["storage"] == "healthy"
