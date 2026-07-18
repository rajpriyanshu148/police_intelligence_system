import datetime
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy import select, func, case, cast, Float, Integer, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.case import Case, CaseTimelineEvent
from app.models.complaint import Complaint
from app.models.fir import FIR
from app.models.evidence import Evidence
from app.models.officer import Officer
from app.models.ai_integration import AICaseAnalysis, AIFIRSuggestion, AILegalRecommendation
from app.models.audit import AuditLog

class AnalyticsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_crime_statistics(self, start_date: datetime.datetime, end_date: datetime.datetime) -> List[Dict[str, Any]]:
        # SQL CTE to calculate category counts and compute percentage of total using window functions
        total_stmt = select(func.count(Case.id)).where(
            and_(Case.opened_at >= start_date, Case.opened_at <= end_date, Case.is_deleted == False)
        ).scalar_subquery()

        stmt = (
            select(
                Case.category,
                func.count(Case.id).label("count"),
                (cast(func.count(Case.id), Float) / cast(func.coalesce(total_stmt, 1), Float) * 100).label("percentage")
            )
            .where(and_(Case.opened_at >= start_date, Case.opened_at <= end_date, Case.is_deleted == False))
            .group_by(Case.category)
            .order_by(func.count(Case.id).desc())
        )
        res = await self.db.execute(stmt)
        return [{"category": r.category, "count": r.count, "percentage": round(r.percentage, 2)} for r in res.all()]

    async def get_complaint_statistics(self, start_date: datetime.datetime, end_date: datetime.datetime) -> List[Dict[str, Any]]:
        stmt = (
            select(
                Complaint.status,
                func.count(Complaint.id).label("count")
            )
            .where(and_(Complaint.created_at >= start_date, Complaint.created_at <= end_date, Complaint.is_deleted == False))
            .group_by(Complaint.status)
        )
        res = await self.db.execute(stmt)
        return [{"status": r.status, "count": r.count} for r in res.all()]

    async def get_case_statistics(self, start_date: datetime.datetime, end_date: datetime.datetime) -> Dict[str, Any]:
        # Case aging query using CTE
        aging_stmt = (
            select(
                func.count(Case.id).label("total_cases"),
                func.avg(
                    case(
                        (Case.status == "Closed", func.julianday(Case.closed_at) - func.julianday(Case.opened_at)),
                        else_=func.julianday(func.current_timestamp()) - func.julianday(Case.opened_at)
                    )
                ).label("average_aging_days")
            )
            .where(and_(Case.opened_at >= start_date, Case.opened_at <= end_date, Case.is_deleted == False))
        )
        res = await self.db.execute(aging_stmt)
        row = res.first()
        total = row.total_cases if row and row.total_cases else 0
        avg_aging = row.average_aging_days if row and row.average_aging_days else 0.0

        # Status counts
        status_stmt = (
            select(Case.status, func.count(Case.id).label("count"))
            .where(and_(Case.opened_at >= start_date, Case.opened_at <= end_date, Case.is_deleted == False))
            .group_by(Case.status)
        )
        status_res = await self.db.execute(status_stmt)
        status_counts = {r.status: r.count for r in status_res.all()}

        return {
            "total_cases": total,
            "average_aging_days": round(float(avg_aging), 2),
            "status_counts": status_counts
        }

    async def get_fir_statistics(self, start_date: datetime.datetime, end_date: datetime.datetime) -> Dict[str, Any]:
        # Calculate conversion rate: FIR counts / Approved Complaints
        complaints_stmt = select(func.count(Complaint.id)).where(
            and_(Complaint.created_at >= start_date, Complaint.created_at <= end_date, Complaint.status == "Approved", Complaint.is_deleted == False)
        ).scalar_subquery()

        fir_stmt = (
            select(
                func.count(FIR.id).label("total_firs"),
                (cast(func.count(FIR.id), Float) / cast(func.coalesce(complaints_stmt, 1), Float)).label("conversion_rate")
            )
            .where(and_(FIR.created_at >= start_date, FIR.created_at <= end_date, FIR.is_deleted == False))
        )
        res = await self.db.execute(fir_stmt)
        row = res.first()
        total = row.total_firs if row and row.total_firs else 0
        rate = row.conversion_rate if row and row.conversion_rate else 0.0

        # Status counts
        status_stmt = (
            select(FIR.status, func.count(FIR.id).label("count"))
            .where(and_(FIR.created_at >= start_date, FIR.created_at <= end_date, FIR.is_deleted == False))
            .group_by(FIR.status)
        )
        status_res = await self.db.execute(status_stmt)
        status_counts = {r.status: r.count for r in status_res.all()}

        return {
            "total_firs": total,
            "conversion_rate": round(float(rate), 4),
            "status_counts": status_counts
        }

    async def get_evidence_statistics(self, start_date: datetime.datetime, end_date: datetime.datetime) -> Dict[str, Any]:
        from app.models.evidence import EvidenceVersion
        stmt = (
            select(
                func.count(Evidence.id).label("total_files"),
                func.sum(EvidenceVersion.file_size).label("total_size_bytes")
            )
            .join(EvidenceVersion, and_(
                Evidence.id == EvidenceVersion.evidence_id,
                EvidenceVersion.version_number == Evidence.current_version
            ), isouter=True)
            .where(and_(Evidence.created_at >= start_date, Evidence.created_at <= end_date, Evidence.is_deleted == False))
        )
        res = await self.db.execute(stmt)
        row = res.first()
        total_files = row.total_files if row and row.total_files else 0
        total_size = row.total_size_bytes if row and row.total_size_bytes else 0
        return {
            "total_files": total_files,
            "total_size_bytes": total_size if total_size else 0
        }


    async def get_officer_statistics(self, start_date: datetime.datetime, end_date: datetime.datetime) -> List[Dict[str, Any]]:
        # Computes officer active workloads and average resolution latency
        stmt = (
            select(
                Officer.id,
                Officer.username,
                Officer.badge_number,
                func.count(case((Case.status == "Under Investigation", Case.id))).label("active_cases"),
                func.count(case((Case.status == "Resolved", Case.id))).label("resolved_cases"),
                func.avg(
                    case(
                        (Case.status == "Resolved", func.julianday(Case.closed_at) - func.julianday(Case.opened_at))
                    )
                ).label("average_resolution_days")
            )
            .join(Case, Officer.id == Case.assigned_officer_id, isouter=True)
            .where(and_(Case.opened_at >= start_date, Case.opened_at <= end_date, Case.is_deleted == False))
            .group_by(Officer.id)
            .order_by(func.count(Case.id).desc())
        )
        res = await self.db.execute(stmt)
        return [
            {
                "officer_id": r.id,
                "username": r.username,
                "badge_number": r.badge_number,
                "active_cases": r.active_cases,
                "resolved_cases": r.resolved_cases,
                "average_resolution_days": round(float(r.average_resolution_days), 2) if r.average_resolution_days else 0.0
            }
            for r in res.all()
        ]

    async def get_ai_statistics(self, start_date: datetime.datetime, end_date: datetime.datetime) -> Dict[str, Any]:
        # Computes AI acceptance/edit/rejection rates across Case Analyses and FIR Suggestions
        stmt = (
            select(
                AICaseAnalysis.review_status,
                func.count(AICaseAnalysis.id).label("count")
            )
            .where(and_(AICaseAnalysis.created_at >= start_date, AICaseAnalysis.created_at <= end_date))
            .group_by(AICaseAnalysis.review_status)
        )
        res = await self.db.execute(stmt)
        counts = {r.review_status: r.count for r in res.all()}

        total = sum(counts.values())
        if total == 0:
            return {"total_suggestions": 0, "acceptance_rate": 0.0, "edit_rate": 0.0, "rejection_rate": 0.0}

        accepted = counts.get("Approved", 0)
        edited = counts.get("Edited", 0)
        rejected = counts.get("Rejected", 0)

        return {
            "total_suggestions": total,
            "acceptance_rate": round(accepted / total, 4),
            "edit_rate": round(edited / total, 4),
            "rejection_rate": round(rejected / total, 4)
        }

    async def get_audit_statistics(self, start_date: datetime.datetime, end_date: datetime.datetime) -> List[Dict[str, Any]]:
        stmt = (
            select(
                AuditLog.action,
                func.count(AuditLog.id).label("count")
            )
            .where(and_(AuditLog.created_at >= start_date, AuditLog.created_at <= end_date))
            .group_by(AuditLog.action)
            .order_by(func.count(AuditLog.id).desc())
        )
        res = await self.db.execute(stmt)
        return [{"action": r.action, "count": r.count} for r in res.all()]
