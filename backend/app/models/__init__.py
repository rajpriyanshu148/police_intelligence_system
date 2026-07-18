from app.database.base_class import Base, GUID
from app.models.officer import Officer
from app.models.citizen import Citizen
from app.models.complaint import Complaint
from app.models.case import Case, CaseTimelineEvent
from app.models.audit import LoginLog, AuditLog
from app.models.evidence import Evidence, EvidenceVersion
from app.models.fir import FIR, FIRVersion
from app.models.ai_integration import AICaseAnalysis, AIFIRSuggestion, AILegalRecommendation
from app.models.administration import (
    SystemSetting, PoliceStation, Department, LegalDictionary, TelemetryMetric, ReportMetadata, DashboardPreference
)
