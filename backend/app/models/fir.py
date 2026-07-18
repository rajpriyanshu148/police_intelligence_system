import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base_class import Base, GUID

class FIR(Base):
    __tablename__ = "firs"
    
    case_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("cases.id", ondelete="RESTRICT"), unique=True, nullable=False)
    fir_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    # Workflow status: Draft, Submitted, Returned, Approved, Rejected, Archived
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Draft")
    
    complainant_name: Mapped[str] = mapped_column(String(100), nullable=False)
    complainant_contact: Mapped[str] = mapped_column(String(20), nullable=False)
    incident_date: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    incident_place: Mapped[str] = mapped_column(String(255), nullable=False)
    acts_sections: Mapped[str] = mapped_column(String(500), nullable=False)
    details: Mapped[str] = mapped_column(String(4000), nullable=False)
    
    created_by_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("officers.id", ondelete="RESTRICT"), nullable=False)
    approved_by_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("officers.id", ondelete="RESTRICT"), nullable=True)
    approved_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    version_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class FIRVersion(Base):
    __tablename__ = "fir_versions"
    
    fir_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("firs.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    acts_sections: Mapped[str] = mapped_column(String(500), nullable=False)
    details: Mapped[str] = mapped_column(String(4000), nullable=False)
    modified_by_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("officers.id", ondelete="RESTRICT"), nullable=False)
