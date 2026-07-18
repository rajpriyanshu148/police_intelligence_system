import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class CreateCaseRequest(BaseModel):
    complaint_id: UUID
    title: str = Field(min_length=3, max_length=200)
    category: str = Field(min_length=2, max_length=100)
    severity: str = Field(pattern="^(Low|Medium|High|Critical)$")
    priority: str = Field(pattern="^(P1|P2|P3|P4)$")


class UpdateCaseRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    category: Optional[str] = Field(default=None, max_length=100)
    severity: Optional[str] = Field(default=None, pattern="^(Low|Medium|High|Critical)$")
    priority: Optional[str] = Field(default=None, pattern="^(P1|P2|P3|P4)$")


class AssignCaseRequest(BaseModel):
    officer_id: UUID


class TransitionCaseRequest(BaseModel):
    status: str = Field(pattern="^(Under Investigation|Resolved|Closed)$")


class AddTimelineEventRequest(BaseModel):
    event_time: datetime.datetime
    title: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=5, max_length=2000)


class CaseOut(BaseModel):
    id: UUID
    complaint_id: UUID
    case_number: str
    title: str
    category: str
    severity: str
    priority: str
    status: str
    assigned_officer_id: Optional[UUID]
    opened_at: datetime.datetime
    closed_at: Optional[datetime.datetime]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class TimelineEventOut(BaseModel):
    id: UUID
    case_id: UUID
    event_time: datetime.datetime
    title: str
    description: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
