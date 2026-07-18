import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.core.middleware import (
    RequestIdMiddleware,
    TimingMiddleware,
    LoggingMiddleware,
    SecurityHeadersMiddleware,
    ExceptionHandlerMiddleware
)
from app.api.v1.routers.health import router as health_router
from app.api.v1.routers.auth import router as auth_router
from app.api.v1.routers.officers import router as officers_router
from app.api.v1.routers.citizens import router as citizens_router
from app.api.v1.routers.complaints import router as complaints_router
from app.api.v1.routers.cases import router as cases_router
from app.api.v1.routers.evidence import router as evidence_router
from app.api.v1.routers.fir import router as fir_router
from app.api.v1.routers.ai import router as ai_router
from app.api.v1.routers.administration import router as admin_router
from app.api.v1.routers.reports import router as reports_router
from app.api.v1.routers.search import router as search_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AI Police Assistance System — Backend API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Middleware stack (applied in reverse order — last added = outermost) ─────
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(TimingMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(ExceptionHandlerMiddleware)

# ── Health / system routes (available at root and versioned) ─────────────────
app.include_router(health_router)
app.include_router(health_router, prefix=settings.API_V1_STR)

# ── Sprint 1 API routes ───────────────────────────────────────────────────────
v1_prefix = settings.API_V1_STR
app.include_router(auth_router,       prefix=v1_prefix)
app.include_router(officers_router,   prefix=v1_prefix)
app.include_router(citizens_router,   prefix=v1_prefix)
app.include_router(complaints_router, prefix=v1_prefix)
app.include_router(cases_router,      prefix=v1_prefix)
app.include_router(evidence_router,   prefix=v1_prefix)
app.include_router(fir_router,        prefix=v1_prefix)
app.include_router(ai_router,         prefix=v1_prefix)
app.include_router(admin_router,      prefix=v1_prefix)
app.include_router(reports_router,     prefix=v1_prefix)
app.include_router(search_router,      prefix=v1_prefix)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
