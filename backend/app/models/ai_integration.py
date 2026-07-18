import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database.base_class import Base, GUID

class AICaseAnalysis(Base):
    __tablename__ = "ai_case_analyses"

    id = Column(GUID, primary_key=True)
    case_id = Column(GUID, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    summary_draft = Column(Text, nullable=False)
    summary_approved = Column(Text, nullable=True)
    suggested_category = Column(String(100), nullable=False)
    suggested_severity = Column(String(50), nullable=False)
    suggested_priority = Column(String(10), nullable=False)
    suggested_department = Column(String(150), nullable=False)
    missing_information = Column(Text, nullable=True)  # JSON-serialized list
    potential_duplicates = Column(Text, nullable=True)  # JSON-serialized list

    review_status = Column(String(50), default="Draft", nullable=False)  # Draft, Approved, Rejected, Edited
    reviewed_by_id = Column(GUID, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    model_provider = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=True)
    prompt_template_version = Column(String(50), nullable=True)
    temperature = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    prompt_hash = Column(String(100), nullable=True)
    response_hash = Column(String(100), nullable=True)
    model_confidence = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    case = relationship("Case")
    reviewed_by = relationship("Officer")


class AIFIRSuggestion(Base):
    __tablename__ = "ai_fir_suggestions"

    id = Column(GUID, primary_key=True)
    case_id = Column(GUID, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    fir_id = Column(GUID, ForeignKey("firs.id", ondelete="CASCADE"), nullable=False)
    original_narrative_draft = Column(Text, nullable=False)
    approved_narrative = Column(Text, nullable=True)

    review_status = Column(String(50), default="Draft", nullable=False)  # Draft, Approved, Rejected, Edited
    reviewed_by_id = Column(GUID, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    model_provider = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=True)
    prompt_template_version = Column(String(50), nullable=True)
    temperature = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    prompt_hash = Column(String(100), nullable=True)
    response_hash = Column(String(100), nullable=True)
    feedback = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    case = relationship("Case")
    fir = relationship("FIR")
    reviewed_by = relationship("Officer")


class AILegalRecommendation(Base):
    __tablename__ = "ai_legal_recommendations"

    id = Column(GUID, primary_key=True)
    case_id = Column(GUID, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    suggested_sections = Column(Text, nullable=False)  # JSON-serialized list of LegalSectionVO
    officer_approved_sections = Column(Text, nullable=True)  # JSON-serialized list of section codes

    review_status = Column(String(50), default="Draft", nullable=False)  # Draft, Approved, Rejected, Edited
    reviewed_by_id = Column(GUID, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    model_provider = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=True)
    prompt_template_version = Column(String(50), nullable=True)
    temperature = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    prompt_hash = Column(String(100), nullable=True)
    response_hash = Column(String(100), nullable=True)
    feedback = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    case = relationship("Case")
    reviewed_by = relationship("Officer")
