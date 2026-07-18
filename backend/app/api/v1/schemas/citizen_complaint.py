import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class RegisterCitizenRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone_number: str = Field(min_length=7, max_length=20)
    national_id: str = Field(min_length=4, max_length=50)
    address: str = Field(min_length=5, max_length=255)
    email: Optional[str] = Field(default=None, max_length=100)


class CitizenOut(BaseModel):
    id: UUID
    name: str
    phone_number: str
    email: Optional[str]
    address: str
    national_id: str
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


# ── Complaint Schemas ────────────────────────────────────────────────────────

class CreateComplaintRequest(BaseModel):
    citizen_name: str = Field(min_length=2, max_length=100)
    citizen_contact: str = Field(min_length=7, max_length=20)
    complaint_text: str = Field(min_length=10, max_length=2000)
    source: str = Field(default="OFFICER_DESK", pattern="^(WEB|MOBILE|OFFICER_DESK|PHONE|EMAIL)$")
    citizen_id: Optional[UUID] = None


class UpdateComplaintRequest(BaseModel):
    complaint_text: Optional[str] = Field(default=None, min_length=10, max_length=2000)


class AssignComplaintRequest(BaseModel):
    officer_id: UUID


class TransitionComplaintRequest(BaseModel):
    status: str = Field(pattern="^(Assigned|Under Review|Escalated|Approved|Rejected|Closed)$")


class ComplaintOut(BaseModel):
    id: UUID
    citizen_id: Optional[UUID]
    citizen_name: str
    citizen_contact: str
    complaint_text: str
    status: str
    source: str
    assigned_officer_id: Optional[UUID]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
