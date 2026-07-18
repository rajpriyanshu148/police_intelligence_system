import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base_class import Base, GUID

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    updated_by_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)


class PoliceStation(Base):
    __tablename__ = "police_stations"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Department(Base):
    __tablename__ = "departments"

    station_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("police_stations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)


class LegalDictionary(Base):
    __tablename__ = "legal_dictionary"

    act_name: Mapped[str] = mapped_column(String(100), nullable=False)
    section_code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    punishment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class TelemetryMetric(Base):
    __tablename__ = "api_telemetry_metrics"

    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        default=lambda: datetime.datetime.now(datetime.timezone.utc)
    )
    endpoint: Mapped[str] = mapped_column(String(200), nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    officer_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)


class ReportMetadata(Base):
    __tablename__ = "reports_metadata"

    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING") # PENDING, GENERATING, COMPLETED, FAILED
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("officers.id", ondelete="CASCADE"), nullable=False)


class DashboardPreference(Base):
    __tablename__ = "dashboard_preferences"

    officer_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("officers.id", ondelete="CASCADE"), unique=True, nullable=False)
    preference_json: Mapped[str] = mapped_column(Text, nullable=False)
