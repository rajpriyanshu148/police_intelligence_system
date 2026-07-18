from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
import datetime
from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field

from app.api.dependencies.auth import require_roles
from app.api.dependencies.services import (
    get_system_setting_repo, get_police_station_repo, get_department_repo,
    get_legal_dictionary_repo, get_dashboard_preference_repo, get_analytics_service,
    get_crime_intelligence_service, get_dashboard_service, get_telemetry_metric_repo
)
from app.api.dependencies.repositories import get_unit_of_work
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.models.officer import Officer
from app.models.administration import SystemSetting, PoliceStation, Department, LegalDictionary
from app.services.analytics_service import AnalyticsService, CrimeIntelligenceService, DashboardService, CacheManager
from app.api.v1.schemas.common import ok

router = APIRouter(prefix="", tags=["Administration & Dashboards"])

# ── Administration Request DTOs ──────────────────────────────────────────────

class SettingUpdatePayload(BaseModel):
    value: str
    description: Optional[str] = None

class PoliceStationPayload(BaseModel):
    code: str
    name: str
    district: str
    state: str

class DepartmentPayload(BaseModel):
    station_id: UUID
    name: str
    code: str

class LegalDictionaryPayload(BaseModel):
    act_name: str
    section_code: str
    title: str
    description: str
    punishment: Optional[str] = None

class DashboardPreferencePayload(BaseModel):
    preference_json: Dict[str, Any]


# ── 1. Administration Routers ────────────────────────────────────────────────

@router.get("/admin/settings", summary="Retrieve all system settings")
async def get_settings(
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    repo = Depends(get_system_setting_repo)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    settings_list = await repo.list_all()
    data = [{s.key: s.value, "description": s.description} for s in settings_list]
    return ok(data, "System settings retrieved.", req_id, corr_id)


@router.put("/admin/settings/{key}", summary="Update a system setting")
async def update_setting(
    key: str,
    body: SettingUpdatePayload,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    repo = Depends(get_system_setting_repo),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        setting = await repo.get_by_key(key)
        if setting:
            setting.value = body.value
            if body.description is not None:
                setting.description = body.description
            setting.updated_by_id = current_officer.id
        else:
            setting = SystemSetting(
                key=key,
                value=body.value,
                description=body.description,
                updated_by_id=current_officer.id
            )
            # Ensure unique primary key elements
            setting.id = uuid4()
            await repo.add(setting)

    # Invalidate cache on settings change
    CacheManager.clear_all()
    return ok({"key": key, "value": body.value}, "System setting updated.", req_id, corr_id)


@router.post("/admin/police-stations", summary="Register a police station")
async def create_station(
    body: PoliceStationPayload,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    repo = Depends(get_police_station_repo),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        station = PoliceStation(
            id=uuid4(),
            code=body.code,
            name=body.name,
            district=body.district,
            state=body.state,
            is_active=True
        )
        await repo.add(station)
    return ok({"id": station.id, "code": station.code}, "Police station registered.", req_id, corr_id)


@router.post("/admin/departments", summary="Register a department inside a station")
async def create_dept(
    body: DepartmentPayload,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    repo = Depends(get_department_repo),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        dept = Department(
            id=uuid4(),
            station_id=body.station_id,
            name=body.name,
            code=body.code
        )
        await repo.add(dept)
    return ok({"id": dept.id, "code": dept.code}, "Department registered.", req_id, corr_id)


@router.post("/admin/legal-dictionary", summary="Register legal reference sections")
async def create_legal_entry(
    body: LegalDictionaryPayload,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    repo = Depends(get_legal_dictionary_repo),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        entry = LegalDictionary(
            id=uuid4(),
            act_name=body.act_name,
            section_code=body.section_code,
            title=body.title,
            description=body.description,
            punishment=body.punishment,
            is_active=True
        )
        await repo.add(entry)
    return ok({"id": entry.id, "act_name": entry.act_name, "section_code": entry.section_code}, "Legal section registered.", req_id, corr_id)


@router.post("/admin/cache/refresh", summary="Clear and refresh system analytics cache")
async def clear_cache(
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN"))
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    CacheManager.clear_all()
    return ok(None, "System metrics cache flushed successfully.", req_id, corr_id)


# ── 2. Dashboard Preferences Endpoints ────────────────────────────────────────

@router.get("/dashboard/preferences", summary="Fetch dashboard user preferences")
async def get_preferences(
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    service: DashboardService = Depends(get_dashboard_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    prefs = await service.get_dashboard_preference(current_officer.id)
    return ok(prefs, "Dashboard preferences retrieved.", req_id, corr_id)


@router.post("/dashboard/preferences", summary="Save dashboard user preferences")
async def save_preferences(
    body: DashboardPreferencePayload,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR", "INVESTIGATOR")),
    service: DashboardService = Depends(get_dashboard_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    async with uow:
        await service.save_dashboard_preference(current_officer.id, body.preference_json)
    return ok(None, "Dashboard preferences saved successfully.", req_id, corr_id)


# ── 3. Dashboard Data Aggregation Endpoints ────────────────────────────────────

@router.get("/dashboard/admin/summary", summary="Retrieve Administrator telemetry summary")
async def admin_dashboard(
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN")),
    telemetry_repo = Depends(get_telemetry_metric_repo)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    # Query last 24h telemetry latency average
    yesterday = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    metrics = await telemetry_repo.get_metrics_after(yesterday)
    
    avg_latency = 0.0
    if metrics:
        avg_latency = sum(m.latency_ms for m in metrics) / len(metrics)
        
    dashboard_data = {
        "system_status": "Operational",
        "api_telemetry": {
            "request_volume_24h": len(metrics),
            "average_latency_ms": round(avg_latency, 2)
        },
        "circuit_breaker": {
            "ai_service_client": "CLOSED"
        }
    }
    return ok(dashboard_data, "Admin dashboard details loaded.", req_id, corr_id)


@router.get("/dashboard/supervisor/summary", summary="Retrieve Supervisor operational summary")
async def supervisor_dashboard(
    request: Request,
    current_officer: Officer = Depends(require_roles("SUPERVISOR", "ADMIN")),
    analytics: AnalyticsService = Depends(get_analytics_service),
    hotspots: CrimeIntelligenceService = Depends(get_crime_intelligence_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    # Aggregate summary stats for past 30 days
    stats = await analytics.get_summary_statistics("monthly")
    hotspot_geojson = await hotspots.get_crime_hotspots("monthly")
    
    data = {
        "total_active_cases": stats["cases"]["status_counts"].get("Under Investigation", 0),
        "total_resolved_cases": stats["cases"]["status_counts"].get("Resolved", 0),
        "total_pending_complaints": stats["complaints"].get("Pending", 0) if isinstance(stats["complaints"], dict) else len(stats["complaints"]),
        "crime_hotspots": hotspot_geojson,
        "investigators_workload": stats["officers"]
    }
    return ok(data, "Supervisor dashboard details loaded.", req_id, corr_id)


@router.get("/dashboard/investigator/summary", summary="Retrieve Investigator active summaries")
async def investigator_dashboard(
    request: Request,
    current_officer: Officer = Depends(require_roles("INVESTIGATOR", "SUPERVISOR", "ADMIN")),
    analytics: AnalyticsService = Depends(get_analytics_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    
    stats = await analytics.get_summary_statistics("monthly")
    
    # Filter workload down to current officer
    my_stats = {"active_cases": 0, "resolved_cases": 0}
    for o in stats["officers"]:
        if o["officer_id"] == current_officer.id:
            my_stats["active_cases"] = o["active_cases"]
            my_stats["resolved_cases"] = o["resolved_cases"]
            break
            
    data = {
        "personal_kpis": my_stats,
        "recent_crimes_count": sum(c["count"] for c in stats["crimes"])
    }
    return ok(data, "Investigator dashboard details loaded.", req_id, corr_id)
