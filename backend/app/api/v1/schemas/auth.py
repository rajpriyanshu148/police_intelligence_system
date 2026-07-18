import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Request Schemas ─────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=6, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class CreateOfficerRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(max_length=100)
    password: str = Field(min_length=8, max_length=128)
    badge_number: str = Field(min_length=3, max_length=50)
    department: str = Field(min_length=2, max_length=100)
    role: str = Field(pattern="^(ADMIN|SUPERVISOR|INVESTIGATOR)$")


class UpdateOfficerRequest(BaseModel):
    email: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)
    status: Optional[str] = Field(default=None, pattern="^(Active|Suspended|On Leave|Inactive)$")
    role: Optional[str] = Field(default=None, pattern="^(ADMIN|SUPERVISOR|INVESTIGATOR)$")


# ── Response Schemas ─────────────────────────────────────────────────────────

class OfficerOut(BaseModel):
    id: UUID
    username: str
    email: str
    badge_number: str
    department: str
    role: str
    status: str
    last_login_at: Optional[datetime.datetime]
    last_password_change: Optional[datetime.datetime]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    officer: dict
