from typing import Optional
from uuid import UUID
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base_class import Base, GUID

class Complaint(Base):
    __tablename__ = "complaints"
    
    citizen_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("citizens.id"), nullable=True)
    citizen_name: Mapped[str] = mapped_column(String(100), nullable=False)
    citizen_contact: Mapped[str] = mapped_column(String(20), nullable=False)
    complaint_text: Mapped[str] = mapped_column(String(2000), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Pending") # Pending, Assigned, Under Review, Escalated, Approved, Rejected, Closed
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="OFFICER_DESK") # WEB, MOBILE, OFFICER_DESK, PHONE, EMAIL
    
    assigned_officer_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("officers.id"), nullable=True)
    
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
