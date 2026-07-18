import time
from datetime import datetime, timezone
from fastapi import APIRouter, Response, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.api.dependencies.database import get_db
from app.core.settings import settings

router = APIRouter(tags=["system"])

BOOT_TIME = time.time()

@router.get("/live", summary="Liveness Probe")
async def live_probe():
    return {"status": "alive"}

from app.api.dependencies.services import get_storage_service, get_ai_client
from app.domain.interfaces.storage import IStorageService
from app.domain.interfaces.ai_client import IAIClient

@router.get("/ready", summary="Readiness Probe")
async def ready_probe(
    db: AsyncSession = Depends(get_db),
    storage: IStorageService = Depends(get_storage_service),
    ai: IAIClient = Depends(get_ai_client)
):
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    storage_status = "healthy"
    try:
        # Perform write check
        path = "health_ready_check.txt"
        await storage.upload_file(path, b"1")
        await storage.delete_file(path)
    except Exception:
        storage_status = "unhealthy"

    ai_status = "healthy"
    try:
        # Perform heartbeat liveness check
        status_res = await ai.get_health_status()
        if status_res.get("status") != "ready":
            ai_status = "unhealthy"
    except Exception:
        ai_status = "unhealthy"

    if "unhealthy" in (db_status, storage_status, ai_status):
        return Response(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=f"Service unavailable. Database: {db_status}, Storage: {storage_status}, AI: {ai_status}"
        )
    return {"status": "ready"}

@router.get("/health", summary="Detailed Health Check")
async def health_check(
    db: AsyncSession = Depends(get_db),
    storage: IStorageService = Depends(get_storage_service),
    ai: IAIClient = Depends(get_ai_client)
):
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"
        
    storage_status = "healthy"
    try:
        path = "health_detail_check.txt"
        await storage.upload_file(path, b"1")
        await storage.delete_file(path)
    except Exception:
        storage_status = "unhealthy"

    ai_status = "healthy"
    circuit_state = "CLOSED"
    try:
        status_res = await ai.get_health_status()
        if status_res.get("status") != "ready":
            ai_status = "unhealthy"
        circuit_state = getattr(ai, "circuit_state", "CLOSED")
    except Exception:
        ai_status = "unhealthy"
        circuit_state = "OPEN"
        
    overall = "healthy" if all(s == "healthy" for s in (db_status, storage_status, ai_status)) else "degraded"
    
    return {
        "status": overall,
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "uptime_seconds": time.time() - BOOT_TIME,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "subsystems": {
            "database": db_status,
            "storage": storage_status,
            "ai_service": {
                "status": ai_status,
                "circuit_breaker": circuit_state
            }
        }
    }


@router.get("/version", summary="Version Info")
async def version_info():
    return {
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "build_time": "2026-07-17T05:30:00Z",
        "commit_hash": "aipas_b0"
    }
