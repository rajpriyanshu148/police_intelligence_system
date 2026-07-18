import datetime
import json
import hashlib
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.administration import ReportMetadata
from app.repositories.administration_repository import ReportMetadataRepository
from app.repositories.analytics_repository import AnalyticsRepository
from app.domain.interfaces.storage import IStorageService

class ReportingService:
    def __init__(
        self,
        report_meta_repo: ReportMetadataRepository,
        analytics_repo: AnalyticsRepository,
        storage_service: IStorageService
    ):
        self.meta = report_meta_repo
        self.analytics = analytics_repo
        self.storage = storage_service

    async def create_report(
        self,
        report_type: str,
        timeframe: str,
        officer_id: UUID
    ) -> ReportMetadata:
        meta_rec = ReportMetadata(
            id=uuid4(),
            report_type=report_type,
            status="PENDING",
            file_path=None,
            file_size=None,
            checksum=None,
            expires_at=None,
            created_by_id=officer_id
        )
        await self.meta.add(meta_rec)
        await self.meta.db.flush()
        return meta_rec

    async def generate_report_task(
        self,
        report_id: UUID,
        timeframe: str,
        format: str  # "PDF", "EXCEL", "CSV"
    ) -> None:
        meta_rec = await self.meta.get_by_id(report_id)
        if not meta_rec:
            return

        meta_rec.status = "GENERATING"
        await self.meta.db.flush()

        # Compute timeframe dates
        now = datetime.datetime.now(datetime.timezone.utc)
        start_date = now - datetime.timedelta(days=30) # Default to 30 days
        if timeframe == "daily":
            start_date = now - datetime.timedelta(days=1)
        elif timeframe == "weekly":
            start_date = now - datetime.timedelta(days=7)
        elif timeframe == "yearly":
            start_date = now - datetime.timedelta(days=365)

        try:
            # 1. Fetch data from AnalyticsRepository based on report type
            report_data = {}
            if meta_rec.report_type == "CRIME":
                report_data = {"crimes": await self.analytics.get_crime_statistics(start_date, now)}
            elif meta_rec.report_type == "OFFICER":
                report_data = {"officers": await self.analytics.get_officer_statistics(start_date, now)}
            elif meta_rec.report_type == "AI":
                report_data = {"ai_stats": await self.analytics.get_ai_statistics(start_date, now)}
            else:
                report_data = {
                    "cases": await self.analytics.get_case_statistics(start_date, now),
                    "firs": await self.analytics.get_fir_statistics(start_date, now)
                }

            # 2. Format output data as bytes
            file_data = b""
            mime_type = ""
            file_extension = ""

            if format == "CSV":
                # Create CSV bytes
                lines = ["Key,Value"]
                for k, v in report_data.items():
                    lines.append(f"{k},{json.dumps(v)}")
                file_data = "\n".join(lines).encode("utf-8")
                mime_type = "text/csv"
                file_extension = "csv"

            elif format == "EXCEL":
                # Simulated Excel as tab-separated values (fully compatible with Excel opening tab-separated sheets)
                lines = ["Key\tValue"]
                for k, v in report_data.items():
                    lines.append(f"{k}\t{json.dumps(v)}")
                file_data = "\n".join(lines).encode("utf-8")
                mime_type = "application/vnd.ms-excel"
                file_extension = "xls"

            else:
                # PDF: Generate simple printable HTML report layout
                html = f"""<html>
                <head><style>body {{ font-family: sans-serif; padding: 20px; }} h1 {{ color: #2C3E50; }}</style></head>
                <body>
                    <h1>AIPAS Operational Report</h1>
                    <p>Generated At: {now.isoformat()}</p>
                    <p>Timeframe: {timeframe}</p>
                    <hr/>
                    <pre>{json.dumps(report_data, indent=2)}</pre>
                </body>
                </html>"""
                file_data = html.encode("utf-8")
                mime_type = "application/pdf"
                file_extension = "pdf"

            # 3. Save report output using IStorageService
            storage_path = f"reports/{meta_rec.id}.{file_extension}"
            await self.storage.upload_file(storage_path, file_data)

            # 4. Update metadata
            meta_rec.status = "COMPLETED"
            meta_rec.file_path = storage_path
            meta_rec.file_size = len(file_data)
            meta_rec.checksum = hashlib.sha256(file_data).hexdigest()
            # Set 24 hour expiration duration
            meta_rec.expires_at = now + datetime.timedelta(hours=24)
            await self.meta.db.flush()

        except Exception as e:
            meta_rec.status = "FAILED"
            await self.meta.db.flush()
            raise e

    async def get_report_download_url(self, report_id: UUID) -> str:
        meta_rec = await self.meta.get_by_id(report_id)
        if not meta_rec or meta_rec.status != "COMPLETED" or not meta_rec.file_path:
            raise ValueError("Report is not ready or has failed.")
        return await self.storage.generate_presigned_download_url(meta_rec.file_path)
