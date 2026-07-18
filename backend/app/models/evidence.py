import datetime
from typing import Optional
from uuid import UUID
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base_class import Base, GUID

class Evidence(Base):
    __tablename__ = "evidences"
    
    case_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("cases.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False) # Image, PDF, Video, Audio, Physical Evidence Photos, Forensic Reports, Other
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    
    # Evidence status: UPLOADING, PENDING_VERIFICATION, VERIFIED, SEALED, ARCHIVED, SOFT_DELETED
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="PENDING_VERIFICATION")
    current_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class EvidenceVersion(Base):
    __tablename__ = "evidence_versions"
    
    evidence_id: Mapped[UUID] = mapped_column(GUID, ForeignKey("evidences.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    hash_algorithm: Mapped[str] = mapped_column(String(50), default="SHA-256", nullable=False)
    uploaded_by: Mapped[UUID] = mapped_column(GUID, ForeignKey("officers.id", ondelete="RESTRICT"), nullable=False)
    
    # Reserve fields for future malware scanning
    scan_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    scan_engine: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    scan_time: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Image/video evidence metadata fields
    original_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    captured_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    gps_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    device_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    exif_present: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
