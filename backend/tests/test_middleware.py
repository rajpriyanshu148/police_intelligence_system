import pytest
from httpx import AsyncClient
from app.domain.exceptions.base import DomainException
from app.main import app

@pytest.mark.asyncio
async def test_request_id_and_timing_and_security_headers(client: AsyncClient):
    response = await client.get("/live")
    assert response.status_code == 200
    
    assert "X-Request-ID" in response.headers
    assert "X-Correlation-ID" in response.headers
    assert "X-Process-Time" in response.headers
    
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["Cache-Control"] == "no-store, max-age=0"

@pytest.mark.asyncio
async def test_exception_handler_middleware_domain_exception(client: AsyncClient):
    from fastapi import APIRouter
    router = APIRouter()

    @router.get("/test-domain-error")
    async def throw_domain_error():
        raise DomainException("Invalid action parameters.", "VALIDATION_XYZ")

    app.include_router(router)
    
    response = await client.get("/test-domain-error")
    assert response.status_code == 400
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_XYZ"
    assert body["error"]["message"] == "Invalid action parameters."
    assert "request_id" in body["meta"]
