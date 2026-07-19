import os
import time
from datetime import datetime
from fastapi import APIRouter, Response, status
from pydantic import BaseModel
from sqlalchemy import text
from src.database.connection import engine
from src.vector_store.faiss_store import vector_store
from src.models.llm_engine import llm_engine
from src.utils.telemetry import telemetry

router = APIRouter(prefix="/api/v1", tags=["system"])

BOOT_TIME = time.time()
VERSION = "1.0.0"
ENVIRONMENT = os.getenv("APP_ENV", "production")

class VersionResponse(BaseModel):
    version: str
    environment: str
    build_time: str
    commit_hash: str

class SubsystemStatus(BaseModel):
    database: str
    vector_store: str
    llm: str

class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    timestamp: str
    subsystems: SubsystemStatus

@router.get("/version", response_model=VersionResponse, summary="Get service build version", description="Retrieve operational build information, deployment environment, and code commit descriptors.")
def get_version():
    return VersionResponse(
        version=VERSION,
        environment=ENVIRONMENT,
        build_time="2026-07-17T05:20:00Z",
        commit_hash=os.getenv("COMMIT_HASH", "de7289ca")
    )

@router.get("/live", summary="Liveness probe", description="Confirm service process is running.")
def liveness_probe():
    return {"status": "alive"}

@router.get("/ready", summary="Readiness probe", description="Confirm all essential backend subsystems are connected and ready to process traffic.")
def readiness_probe():
    # 1. Database Check
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        return Response(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content="Database connection unavailable")
    
    # 2. Vector Store Check
    if not vector_store.documents:
        return Response(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content="Vector store index not loaded")
        
    return {"status": "ready"}

@router.get("/health", response_model=HealthResponse, summary="Detailed health diagnostics", description="Retrieve connection diagnostics and health indicators for all individual sub-components.")
def health_diagnostics():
    # Database check
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
        telemetry.record_error()

    # Vector store check
    vs_status = "healthy" if vector_store.documents else "unhealthy"
    
    # LLM check
    llm_status = "healthy" if llm_engine is not None else "unhealthy"

    overall_status = "healthy" if (db_status == "healthy" and vs_status == "healthy" and llm_status == "healthy") else "degraded"

    return HealthResponse(
        status=overall_status,
        version=VERSION,
        uptime_seconds=time.time() - BOOT_TIME,
        timestamp=datetime.utcnow().isoformat() + "Z",
        subsystems=SubsystemStatus(
            database=db_status,
            vector_store=vs_status,
            llm=llm_status
        )
    )

@router.get("/metrics", response_class=Response, summary="Prometheus-compatible telemetry metrics", description="Export standard Prometheus metrics detailing request throughput, error counts, processing timings, and subsystem latency stats.")
def get_metrics():
    metrics_text = telemetry.to_prometheus_format()
    return Response(content=metrics_text, media_type="text/plain; version=0.0.4; charset=utf-8")
