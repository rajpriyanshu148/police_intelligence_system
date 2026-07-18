import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

class CreateFIRRequest(BaseModel):
    complainant_name: str = Field(min_length=2, max_length=100)
    complainant_contact: str = Field(min_length=7, max_length=20)
    incident_date: datetime.datetime
    incident_place: str = Field(min_length=3, max_length=255)
    acts_sections: str = Field(min_length=2, max_length=500)
    details: str = Field(min_length=10, max_length=4000)


class UpdateFIRRequest(BaseModel):
    acts_sections: Optional[str] = Field(default=None, min_length=2, max_length=500)
    details: Optional[str] = Field(default=None, min_length=10, max_length=4000)


class ApproveFIRRequest(BaseModel):
    approved: bool
    feedback: str = Field(min_length=2, max_length=1000)
    action: str = Field(default="APPROVE", pattern="^(APPROVE|RETURN|REJECT)$")


class FIROut(BaseModel):
    id: UUID
    case_id: UUID
    fir_number: str
    status: str
    complainant_name: str
    complainant_contact: str
    incident_date: datetime.datetime
    incident_place: str
    acts_sections: str
    details: str
    created_by_id: UUID
    approved_by_id: Optional[UUID]
    approved_at: Optional[datetime.datetime]
    version_number: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class FIRVersionOut(BaseModel):
    id: UUID
    fir_id: UUID
    version_number: int
    acts_sections: str
    details: str
    modified_by_id: UUID
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
