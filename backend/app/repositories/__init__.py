from app.repositories.base import BaseRepository
from app.repositories.unit_of_work import SqlAlchemyUnitOfWork
from app.repositories.officer_repository import OfficerRepository
from app.repositories.citizen_repository import CitizenRepository
from app.repositories.complaint_repository import ComplaintRepository
from app.repositories.case_repository import CaseRepository, CaseTimelineRepository
from app.repositories.audit_repository import LoginLogRepository, AuditLogRepository
from app.repositories.evidence_repository import EvidenceRepository
from app.repositories.fir_repository import FIRRepository
from app.repositories.ai_repository import (
    AICaseAnalysisRepository, AIFIRSuggestionRepository, AILegalRecommendationRepository
)
from app.repositories.administration_repository import (
    SystemSettingRepository, PoliceStationRepository, DepartmentRepository,
    LegalDictionaryRepository, TelemetryMetricRepository, ReportMetadataRepository, DashboardPreferenceRepository
)

__all__ = [
    "BaseRepository",
    "SqlAlchemyUnitOfWork",
    "OfficerRepository",
    "CitizenRepository",
    "ComplaintRepository",
    "CaseRepository",
    "CaseTimelineRepository",
    "LoginLogRepository",
    "AuditLogRepository",
    "EvidenceRepository",
    "FIRRepository",
]
