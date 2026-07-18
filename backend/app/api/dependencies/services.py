"""
Dependency injection providers for all Sprint 1 services.
Services are constructed fresh per-request with repository instances bound to the session.
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.database import get_db
from app.repositories.officer_repository import OfficerRepository
from app.repositories.citizen_repository import CitizenRepository
from app.repositories.complaint_repository import ComplaintRepository
from app.repositories.case_repository import CaseRepository, CaseTimelineRepository
from app.repositories.audit_repository import LoginLogRepository, AuditLogRepository
from app.services.auth_service import AuthService
from app.services.officer_service import OfficerService
from app.services.citizen_service import CitizenService
from app.services.complaint_service import ComplaintService
from app.services.case_service import CaseService


# ── Repository providers ────────────────────────────────────────────────────

def get_officer_repo(db: AsyncSession = Depends(get_db)) -> OfficerRepository:
    return OfficerRepository(db)

def get_citizen_repo(db: AsyncSession = Depends(get_db)) -> CitizenRepository:
    return CitizenRepository(db)

def get_complaint_repo(db: AsyncSession = Depends(get_db)) -> ComplaintRepository:
    return ComplaintRepository(db)

def get_case_repo(db: AsyncSession = Depends(get_db)) -> CaseRepository:
    return CaseRepository(db)

def get_case_timeline_repo(db: AsyncSession = Depends(get_db)) -> CaseTimelineRepository:
    return CaseTimelineRepository(db)

def get_login_log_repo(db: AsyncSession = Depends(get_db)) -> LoginLogRepository:
    return LoginLogRepository(db)

def get_audit_repo(db: AsyncSession = Depends(get_db)) -> AuditLogRepository:
    return AuditLogRepository(db)

from app.repositories.evidence_repository import EvidenceRepository
from app.repositories.fir_repository import FIRRepository

def get_evidence_repo(db: AsyncSession = Depends(get_db)) -> EvidenceRepository:
    return EvidenceRepository(db)

def get_fir_repo(db: AsyncSession = Depends(get_db)) -> FIRRepository:
    return FIRRepository(db)


from app.repositories.ai_repository import (
    AICaseAnalysisRepository, AIFIRSuggestionRepository, AILegalRecommendationRepository
)

def get_ai_case_analysis_repo(db: AsyncSession = Depends(get_db)) -> AICaseAnalysisRepository:
    return AICaseAnalysisRepository(db)

def get_ai_fir_suggestion_repo(db: AsyncSession = Depends(get_db)) -> AIFIRSuggestionRepository:
    return AIFIRSuggestionRepository(db)

def get_ai_legal_recommendation_repo(db: AsyncSession = Depends(get_db)) -> AILegalRecommendationRepository:
    return AILegalRecommendationRepository(db)


from app.repositories.administration_repository import (
    SystemSettingRepository, PoliceStationRepository, DepartmentRepository,
    LegalDictionaryRepository, TelemetryMetricRepository, ReportMetadataRepository, DashboardPreferenceRepository
)

def get_system_setting_repo(db: AsyncSession = Depends(get_db)) -> SystemSettingRepository:
    return SystemSettingRepository(db)

def get_police_station_repo(db: AsyncSession = Depends(get_db)) -> PoliceStationRepository:
    return PoliceStationRepository(db)

def get_department_repo(db: AsyncSession = Depends(get_db)) -> DepartmentRepository:
    return DepartmentRepository(db)

def get_legal_dictionary_repo(db: AsyncSession = Depends(get_db)) -> LegalDictionaryRepository:
    return LegalDictionaryRepository(db)

def get_telemetry_metric_repo(db: AsyncSession = Depends(get_db)) -> TelemetryMetricRepository:
    return TelemetryMetricRepository(db)

def get_report_metadata_repo(db: AsyncSession = Depends(get_db)) -> ReportMetadataRepository:
    return ReportMetadataRepository(db)

def get_dashboard_preference_repo(db: AsyncSession = Depends(get_db)) -> DashboardPreferenceRepository:
    return DashboardPreferenceRepository(db)


from app.repositories.analytics_repository import AnalyticsRepository

def get_analytics_repo(db: AsyncSession = Depends(get_db)) -> AnalyticsRepository:
    return AnalyticsRepository(db)






# ── Service providers ───────────────────────────────────────────────────────

def get_auth_service(
    officer_repo: OfficerRepository = Depends(get_officer_repo),
    login_log_repo: LoginLogRepository = Depends(get_login_log_repo),
) -> AuthService:
    return AuthService(officer_repo=officer_repo, login_log_repo=login_log_repo)


def get_officer_service(
    officer_repo: OfficerRepository = Depends(get_officer_repo),
    audit_repo: AuditLogRepository = Depends(get_audit_repo),
) -> OfficerService:
    return OfficerService(officer_repo=officer_repo, audit_repo=audit_repo)


def get_citizen_service(
    citizen_repo: CitizenRepository = Depends(get_citizen_repo),
    complaint_repo: ComplaintRepository = Depends(get_complaint_repo),
    audit_repo: AuditLogRepository = Depends(get_audit_repo),
) -> CitizenService:
    return CitizenService(
        citizen_repo=citizen_repo,
        complaint_repo=complaint_repo,
        audit_repo=audit_repo,
    )


def get_complaint_service(
    complaint_repo: ComplaintRepository = Depends(get_complaint_repo),
    officer_repo: OfficerRepository = Depends(get_officer_repo),
    audit_repo: AuditLogRepository = Depends(get_audit_repo),
) -> ComplaintService:
    return ComplaintService(
        complaint_repo=complaint_repo,
        officer_repo=officer_repo,
        audit_repo=audit_repo,
    )


def get_case_service(
    case_repo = Depends(get_case_repo),
    timeline_repo = Depends(get_case_timeline_repo),
    complaint_repo = Depends(get_complaint_repo),
    officer_repo = Depends(get_officer_repo),
    audit_repo = Depends(get_audit_repo),
    fir_repo = Depends(get_fir_repo),
) -> CaseService:
    return CaseService(
        case_repo=case_repo,
        timeline_repo=timeline_repo,
        complaint_repo=complaint_repo,
        officer_repo=officer_repo,
        audit_repo=audit_repo,
        fir_repo=fir_repo
    )


# ── Storage Infrastructure provider ──────────────────────────────────────────

from app.domain.interfaces.storage import IStorageService
from app.infrastructure.storage.local import LocalStorageAdapter
from app.infrastructure.storage.s3 import S3StorageService
from app.core.settings import settings

def get_storage_service() -> IStorageService:
    if settings.STORAGE_BACKEND.lower() == "s3":
        return S3StorageService()
    return LocalStorageAdapter()


from app.services.evidence_service import EvidenceService

def get_evidence_service(
    evidence_repo = Depends(get_evidence_repo),
    case_repo = Depends(get_case_repo),
    timeline_repo = Depends(get_case_timeline_repo),
    audit_repo = Depends(get_audit_repo),
    storage_service = Depends(get_storage_service),
) -> EvidenceService:
    return EvidenceService(
        evidence_repo=evidence_repo,
        case_repo=case_repo,
        timeline_repo=timeline_repo,
        audit_repo=audit_repo,
        storage_service=storage_service
    )


from app.services.fir_service import FIRService

def get_fir_service(
    fir_repo = Depends(get_fir_repo),
    case_repo = Depends(get_case_repo),
    timeline_repo = Depends(get_case_timeline_repo),
    audit_repo = Depends(get_audit_repo),
    officer_repo = Depends(get_officer_repo),
) -> FIRService:
    return FIRService(
        fir_repo=fir_repo,
        case_repo=case_repo,
        timeline_repo=timeline_repo,
        audit_repo=audit_repo,
        officer_repo=officer_repo
    )


from app.infrastructure.ai_client.http_client import HTTPTestCaseAIClient
from app.services.ai_integration_service import AIIntegrationService
from app.core.settings import settings

def get_ai_client() -> HTTPTestCaseAIClient:
    # If no URL is specified or we are testing, enable mock_mode
    is_mock = not settings.AI_SERVICE_URL or settings.APP_ENV == "testing"
    return HTTPTestCaseAIClient(
        base_url=settings.AI_SERVICE_URL or "http://ai-service-mock",
        api_key=settings.AI_SERVICE_API_KEY,
        mock_mode=is_mock
    )

def get_ai_integration_service(
    ai_client = Depends(get_ai_client),
    analysis_repo = Depends(get_ai_case_analysis_repo),
    fir_sugg_repo = Depends(get_ai_fir_suggestion_repo),
    legal_rec_repo = Depends(get_ai_legal_recommendation_repo),
    case_repo = Depends(get_case_repo),
    timeline_repo = Depends(get_case_timeline_repo),
    fir_repo = Depends(get_fir_repo),
    audit_repo = Depends(get_audit_repo),
    officer_repo = Depends(get_officer_repo)
) -> AIIntegrationService:
    return AIIntegrationService(
        ai_client=ai_client,
        analysis_repo=analysis_repo,
        fir_sugg_repo=fir_sugg_repo,
        legal_rec_repo=legal_rec_repo,
        case_repo=case_repo,
        timeline_repo=timeline_repo,
        fir_repo=fir_repo,
        audit_repo=audit_repo,
        officer_repo=officer_repo
    )


from app.services.analytics_service import AnalyticsService, CrimeIntelligenceService, DashboardService

def get_analytics_service(
    analytics_repo = Depends(get_analytics_repo)
) -> AnalyticsService:
    return AnalyticsService(analytics_repo=analytics_repo)

def get_crime_intelligence_service(
    analytics_repo = Depends(get_analytics_repo)
) -> CrimeIntelligenceService:
    return CrimeIntelligenceService(analytics_repo=analytics_repo)

def get_dashboard_service(
    analytics_service = Depends(get_analytics_service),
    pref_repo = Depends(get_dashboard_preference_repo),
    setting_repo = Depends(get_system_setting_repo),
    case_repo = Depends(get_case_repo),
    fir_repo = Depends(get_fir_repo),
    complaint_repo = Depends(get_complaint_repo)
) -> DashboardService:
    return DashboardService(
        analytics_service=analytics_service,
        pref_repo=pref_repo,
        setting_repo=setting_repo,
        case_repo=case_repo,
        fir_repo=fir_repo,
        complaint_repo=complaint_repo
    )


from app.services.reporting_service import ReportingService
from app.api.dependencies.services import get_storage_service

def get_reporting_service(
    meta_repo = Depends(get_report_metadata_repo),
    analytics_repo = Depends(get_analytics_repo),
    storage_service = Depends(get_storage_service)
) -> ReportingService:
    return ReportingService(
        report_meta_repo=meta_repo,
        analytics_repo=analytics_repo,
        storage_service=storage_service
    )






