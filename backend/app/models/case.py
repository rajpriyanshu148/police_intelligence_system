import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base_class import Base, GUID

class Case(Base):
    __tablename__ = "cases"
    
    complaint_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("complaints.id"), unique=True, nullable=False)
    case_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False) # Low, Medium, High, Critical
    priority: Mapped[str] = mapped_column(String(10), nullable=False) # P1, P2, P3, P4
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Under Investigation") # Under Investigation, Resolved, Closed
    
    assigned_officer_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("officers.id"), nullable=True)
    
    opened_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    closed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class CaseTimelineEvent(Base):
    __tablename__ = "case_timeline_events"
    
    case_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    event_time: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(2000), nullable=False)
    
    # Extended Sprint 2 fields
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, default="GENERAL")
    actor_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    evidence_id: Mapped[Optional[UUID]] = mapped_column(GUID, nullable=True)
    fir_id: Mapped[Optional[UUID]] = mapped_column(GUID, nullable=True)
