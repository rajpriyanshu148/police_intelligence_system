"""
CitizenService — registration, profile, search, complaint history.
"""
import json
from typing import List, Optional
from uuid import UUID

from app.domain.exceptions.citizen import (
    CitizenNotFoundException,
    CitizenAlreadyExistsException,
)
from app.models.citizen import Citizen
from app.models.audit import AuditLog
from app.repositories.citizen_repository import CitizenRepository
from app.repositories.complaint_repository import ComplaintRepository
from app.repositories.audit_repository import AuditLogRepository


class CitizenService:
    def __init__(
        self,
        citizen_repo: CitizenRepository,
        complaint_repo: ComplaintRepository,
        audit_repo: AuditLogRepository,
    ):
        self._citizens = citizen_repo
        self._complaints = complaint_repo
        self._audit = audit_repo

    async def register_citizen(
        self,
        name: str,
        phone_number: str,
        national_id: str,
        address: str,
        actor_id: UUID,
        email: Optional[str] = None,
        request_id: str = "",
        correlation_id: str = "",
    ) -> Citizen:
        # Duplicate checks
        if await self._citizens.get_by_phone(phone_number):
            raise CitizenAlreadyExistsException("A citizen with this phone number already exists.")
        if await self._citizens.get_by_national_id(national_id):
            raise CitizenAlreadyExistsException("A citizen with this national ID already exists.")

        citizen = Citizen(
            name=name,
            phone_number=phone_number,
            national_id=national_id,
            address=address,
            email=email,
        )
        await self._citizens.add(citizen)
        await self._citizens.db.flush()

        log = AuditLog(
            actor_id=actor_id,
            action="CITIZEN_REGISTER",
            entity_type="Citizen",
            entity_id=citizen.id,
            old_state=None,
            new_state=json.dumps({"name": name, "phone_number": phone_number}),
            request_id=request_id,
            correlation_id=correlation_id,
        )
        await self._audit.add(log)
        return citizen

    async def get_citizen(self, citizen_id: UUID) -> Citizen:
        citizen = await self._citizens.get_active_by_id(citizen_id)
        if citizen is None:
            raise CitizenNotFoundException()
        return citizen

    async def search_citizens(
        self, query: str, page: int = 1, page_size: int = 20
    ) -> tuple[List[Citizen], int]:
        skip = (page - 1) * page_size
        citizens = await self._citizens.search(query, skip=skip, limit=page_size)
        total = await self._citizens.count_search(query)
        return citizens, total

    async def list_citizens(
        self, page: int = 1, page_size: int = 20
    ) -> tuple[List[Citizen], int]:
        skip = (page - 1) * page_size
        citizens = await self._citizens.list_citizens(skip=skip, limit=page_size)
        total = await self._citizens.count_all()
        return citizens, total

    async def get_complaint_history(self, citizen_id: UUID) -> list:
        citizen = await self._citizens.get_active_by_id(citizen_id)
        if citizen is None:
            raise CitizenNotFoundException()
        return await self._complaints.get_complaints_by_citizen(citizen_id)
