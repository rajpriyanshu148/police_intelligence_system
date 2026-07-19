import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return PG_UUID(as_uuid=True)
        else:
            return CHAR(36)

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            else:
                return str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value

class Officer(Base):
    __tablename__ = "officers"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    badge_number = Column(String(50), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False)
    role = Column(String(50), default="Officer")  # Admin, Investigator, Officer
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assigned_cases = relationship("Case", back_populates="assigned_officer")
    audit_logs = relationship("AuditLog", back_populates="officer")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    citizen_name = Column(String(100), nullable=False)
    citizen_contact = Column(String(50), nullable=False)
    complaint_text = Column(Text, nullable=False)
    status = Column(String(50), default="Pending")  # Pending, Processing, Processed, Rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case = relationship("Case", uselist=False, back_populates="complaint")

class Case(Base):
    __tablename__ = "cases"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    complaint_id = Column(GUID, ForeignKey("complaints.id"), unique=True, nullable=False)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)  # Theft, Cybercrime, Assault, Murder, etc.
    severity = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    priority = Column(String(50), default="P3")  # P1, P2, P3, P4
    status = Column(String(50), default="Under Investigation")  # Under Investigation, Closed, Under Trial
    assigned_officer_id = Column(GUID, ForeignKey("officers.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    complaint = relationship("Complaint", back_populates="case")
    assigned_officer = relationship("Officer", back_populates="assigned_cases")
    fir = relationship("FIR", uselist=False, back_populates="case")
    entities = relationship("Entity", back_populates="case", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="case", cascade="all, delete-orphan")

class FIR(Base):
    __tablename__ = "firs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    case_id = Column(GUID, ForeignKey("cases.id"), unique=True, nullable=False)
    fir_number = Column(String(50), unique=True, index=True, nullable=False)
    draft_text = Column(Text, nullable=False)
    legal_sections = Column(Text, nullable=True)  # JSON or comma-separated list of sections
    status = Column(String(50), default="Draft")  # Draft, Approved, Filed
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)

    # Relationships
    case = relationship("Case", back_populates="fir")

class Entity(Base):
    __tablename__ = "entities"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    case_id = Column(GUID, ForeignKey("cases.id"), nullable=False)
    entity_type = Column(String(50), nullable=False)  # Suspect, Victim, Location, Weapon, Stolen_Item, Date
    entity_value = Column(String(200), nullable=False)
    confidence = Column(Float, default=1.0)

    # Relationships
    case = relationship("Case", back_populates="entities")

class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    case_id = Column(GUID, ForeignKey("cases.id"), nullable=False)
    event_time = Column(DateTime, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case = relationship("Case", back_populates="timeline_events")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    action = Column(String(100), nullable=False)
    officer_id = Column(GUID, ForeignKey("officers.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)

    # Relationships
    officer = relationship("Officer", back_populates="audit_logs")
