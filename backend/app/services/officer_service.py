"""
OfficerService — create, update, soft-delete, and profile management.
"""
import datetime
import json
from typing import List, Optional
from uuid import UUID

from app.core.security import get_password_hash
from app.domain.exceptions.officer import (
    OfficerNotFoundException,
    OfficerAlreadyExistsException,
)
from app.models.officer import Officer
from app.models.audit import AuditLog
from app.repositories.officer_repository import OfficerRepository
from app.repositories.audit_repository import AuditLogRepository


class OfficerService:
    def __init__(
        self,
        officer_repo: OfficerRepository,
        audit_repo: AuditLogRepository,
    ):
        self._officers = officer_repo
        self._audit = audit_repo

    async def create_officer(
        self,
        username: str,
        email: str,
        password: str,
        badge_number: str,
        department: str,
        role: str,
        actor_id: UUID,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Officer:
        # Uniqueness checks
        if await self._officers.get_by_username(username):
            raise OfficerAlreadyExistsException()
        if await self._officers.get_by_email(email):
            raise OfficerAlreadyExistsException()
        if await self._officers.get_by_badge(badge_number):
            raise OfficerAlreadyExistsException()

        officer = Officer(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            badge_number=badge_number,
            department=department,
            role=role,
            status="Active",
        )
        await self._officers.add(officer)
        await self._officers.db.flush()

        await self._write_audit(
            actor_id=actor_id,
            action="OFFICER_CREATE",
            entity_type="Officer",
            entity_id=officer.id,
            old_state=None,
            new_state={"username": username, "role": role, "department": department},
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return officer

    async def update_officer(
        self,
        officer_id: UUID,
        actor_id: UUID,
        email: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None,
        role: Optional[str] = None,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Officer:
        officer = await self._officers.get_active_by_id(officer_id)
        if officer is None:
            raise OfficerNotFoundException()

        old_state = {
            "email": officer.email,
            "department": officer.department,
            "status": officer.status,
            "role": officer.role,
        }

        if email is not None:
            existing = await self._officers.get_by_email(email)
            if existing and existing.id != officer_id:
                raise OfficerAlreadyExistsException("Email is already in use.")
            officer.email = email
        if department is not None:
            officer.department = department
        if status is not None:
            officer.status = status
        if role is not None:
            officer.role = role

        new_state = {
            "email": officer.email,
            "department": officer.department,
            "status": officer.status,
            "role": officer.role,
        }
        await self._write_audit(
            actor_id=actor_id,
            action="OFFICER_UPDATE",
            entity_type="Officer",
            entity_id=officer.id,
            old_state=old_state,
            new_state=new_state,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        return officer

    async def soft_delete_officer(
        self,
        officer_id: UUID,
        actor_id: UUID,
        request_id: str = "",
        correlation_id: str = "",
    ) -> None:
        officer = await self._officers.get_active_by_id(officer_id)
        if officer is None:
            raise OfficerNotFoundException()
        officer.is_deleted = True
        await self._write_audit(
            actor_id=actor_id,
            action="OFFICER_DELETE",
            entity_type="Officer",
            entity_id=officer_id,
            old_state={"is_deleted": False},
            new_state={"is_deleted": True},
            request_id=request_id,
            correlation_id=correlation_id,
        )

    async def get_officer(self, officer_id: UUID) -> Officer:
        officer = await self._officers.get_active_by_id(officer_id)
        if officer is None:
            raise OfficerNotFoundException()
        return officer

    async def list_officers(
        self,
        role: Optional[str] = None,
        department: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Officer], int]:
        skip = (page - 1) * page_size
        officers = await self._officers.list_officers(role=role, department=department, skip=skip, limit=page_size)
        total = await self._officers.count_officers(role=role, department=department)
        return officers, total

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _write_audit(
        self,
        actor_id: UUID,
        action: str,
        entity_type: str,
        entity_id,
        old_state,
        new_state,
        request_id: str = "",
        correlation_id: str = "",
    ) -> None:
        log = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_state=json.dumps(old_state) if old_state is not None else None,
            new_state=json.dumps(new_state) if new_state is not None else None,
            request_id=request_id,
            correlation_id=correlation_id,
        )
        await self._audit.add(log)
