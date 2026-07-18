import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base_class import Base, GUID

class LoginLog(Base):
    __tablename__ = "login_logs"
    
    officer_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("officers.id"), nullable=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    user_agent: Mapped[str] = mapped_column(String(255), nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    actor_id: Mapped[Optional[UUID]] = mapped_column(GUID, ForeignKey("officers.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[UUID] = mapped_column(GUID, nullable=False)
    
    old_state: Mapped[Optional[str]] = mapped_column(String(4000), nullable=True)
    new_state: Mapped[Optional[str]] = mapped_column(String(4000), nullable=True)
    
    request_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    correlation_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    timestamp: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.datetime.now(datetime.timezone.utc))
