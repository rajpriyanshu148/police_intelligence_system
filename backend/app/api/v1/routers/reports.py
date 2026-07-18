from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Request, status, BackgroundTasks
from pydantic import BaseModel, Field

from app.api.dependencies.auth import require_roles
from app.api.dependencies.services import get_reporting_service
from app.api.dependencies.repositories import get_unit_of_work
from app.domain.interfaces.unit_of_work import IUnitOfWork
from app.models.officer import Officer
from app.services.reporting_service import ReportingService
from app.api.v1.schemas.common import ok

router = APIRouter(prefix="/reports", tags=["Reporting Module"])

# ── Reporting Request DTOs ───────────────────────────────────────────────────

class ExportRequestPayload(BaseModel):
    report_type: str = Field(pattern="^(CRIME|OFFICER|AI|OPERATIONAL)$")
    timeframe: str = Field(pattern="^(daily|weekly|monthly|yearly)$")
    format: str = Field(pattern="^(PDF|EXCEL|CSV)$")


# ── Reports API Endpoints ───────────────────────────────────────────────────

@router.post("/export", status_code=status.HTTP_202_ACCEPTED, summary="Trigger async report generation")
async def trigger_export(
    body: ExportRequestPayload,
    background_tasks: BackgroundTasks,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    reporting_service: ReportingService = Depends(get_reporting_service),
    uow: IUnitOfWork = Depends(get_unit_of_work)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")

    async with uow:
        # Create Pending Report record
        report_meta = await reporting_service.create_report(
            report_type=body.report_type,
            timeframe=body.timeframe,
            officer_id=current_officer.id
        )

    # Dispatch to FastAPI background task worker
    # We pass a new session or the service to execute in background
    # Since background_tasks run after response is sent, we should execute it in a clean transaction
    async def run_async_generation():
        async with uow:
            await reporting_service.generate_report_task(
                report_id=report_meta.id,
                timeframe=body.timeframe,
                format=body.format
            )

    background_tasks.add_task(run_async_generation)

    data = {
        "report_id": report_meta.id,
        "report_type": report_meta.report_type,
        "status": "PENDING"
    }
    return ok(data, "Report generation triggered asynchronously.", req_id, corr_id)


@router.get("/{report_id}/status", summary="Check report generation status")
async def check_report_status(
    report_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    reporting_service: ReportingService = Depends(get_reporting_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")

    report_meta = await reporting_service.meta.get_by_id(report_id)
    if not report_meta:
        return ok({"report_id": report_id, "status": "NOT_FOUND"}, "Report not found.", req_id, corr_id)

    data = {
        "report_id": report_meta.id,
        "status": report_meta.status,
        "file_size": report_meta.file_size,
        "checksum": report_meta.checksum,
        "expires_at": report_meta.expires_at.isoformat() if report_meta.expires_at else None
    }
    return ok(data, "Report status retrieved.", req_id, corr_id)


@router.get("/{report_id}/download", summary="Get report presigned download link")
async def get_download_link(
    report_id: UUID,
    request: Request,
    current_officer: Officer = Depends(require_roles("ADMIN", "SUPERVISOR")),
    reporting_service: ReportingService = Depends(get_reporting_service)
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")

    try:
        download_url = await reporting_service.get_report_download_url(report_id)
        return ok({"download_url": download_url}, "Report download URL generated.", req_id, corr_id)
    except ValueError as e:
        return ok({"report_id": report_id, "status": "NOT_READY"}, str(e), req_id, corr_id)
