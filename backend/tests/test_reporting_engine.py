import pytest
from uuid import UUID
from app.core.security import get_password_hash
from app.models.officer import Officer
from app.services.reporting_service import ReportingService
from app.api.dependencies.services import get_reporting_service

def _supervisor() -> Officer:
    return Officer(
        username="supervisor_s4_reports", email="sup_rep@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-SUP04", department="CID",
        role="SUPERVISOR", status="Active",
    )

async def _login(client, username, password="Admin1234!"):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_async_reporting_workflow(client, db_session):
    sup = _supervisor()
    db_session.add(sup)
    await db_session.commit()

    token = await _login(client, "supervisor_s4_reports")

    # 1. Trigger Async Export
    payload = {
        "report_type": "OPERATIONAL",
        "timeframe": "weekly",
        "format": "PDF"
    }
    r = await client.post(
        "/api/v1/reports/export",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 202
    resp_data = r.json()["data"]
    assert resp_data["status"] == "PENDING"
    
    report_uuid = UUID(resp_data["report_id"])

    # 2. Run the generation task in database context
    from app.repositories.administration_repository import ReportMetadataRepository
    from app.repositories.analytics_repository import AnalyticsRepository
    from app.infrastructure.storage.local import LocalStorageAdapter
    
    meta_repo = ReportMetadataRepository(db_session)
    analytics_repo = AnalyticsRepository(db_session)
    storage_service = LocalStorageAdapter(root_dir="temp_test_reports")
    
    reporting_service = ReportingService(
        report_meta_repo=meta_repo,
        analytics_repo=analytics_repo,
        storage_service=storage_service
    )
    await reporting_service.generate_report_task(report_uuid, "weekly", "PDF")
    await db_session.commit()

    # 3. Check status
    r = await client.get(f"/api/v1/reports/{report_uuid}/status", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["data"]["status"] == "COMPLETED"
    assert r.json()["data"]["checksum"] is not None

    # 4. Fetch Download URL
    r = await client.get(f"/api/v1/reports/{report_uuid}/download", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert "download_url" in r.json()["data"]
