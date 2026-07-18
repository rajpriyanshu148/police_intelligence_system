"""
AuthService — handles login, token issuance, refresh, lockout, and password management.
Never accesses repositories or DB directly; receives them via constructor injection.
"""
import datetime
from typing import Optional
from uuid import UUID

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.settings import settings
from app.domain.exceptions.auth import (
    AuthenticationException,
    TokenExpiredException,
    PermissionDeniedException,
)
from app.domain.exceptions.officer import (
    OfficerAccountLockedException,
    OfficerInactiveException,
    OfficerNotFoundException,
)
from app.models.officer import Officer
from app.models.audit import LoginLog
from app.repositories.officer_repository import OfficerRepository
from app.repositories.audit_repository import LoginLogRepository


class AuthService:
    def __init__(
        self,
        officer_repo: OfficerRepository,
        login_log_repo: LoginLogRepository,
    ):
        self._officers = officer_repo
        self._login_logs = login_log_repo

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def login(
        self,
        username: str,
        password: str,
        ip_address: str,
        user_agent: str,
    ) -> dict:
        """Authenticate officer and return access + refresh tokens."""
        officer = await self._officers.get_by_username(username)

        # Unknown user — log failure without revealing existence
        if officer is None or officer.is_deleted:
            await self._log_login(None, ip_address, user_agent, success=False)
            raise AuthenticationException()

        # Inactive account
        if officer.status not in ("Active",):
            await self._log_login(officer.id, ip_address, user_agent, success=False)
            raise OfficerInactiveException()

        # Locked account check
        if officer.lockout_until and officer.lockout_until > datetime.datetime.now(datetime.timezone.utc):
            await self._log_login(officer.id, ip_address, user_agent, success=False)
            raise OfficerAccountLockedException()

        # Wrong password
        if not verify_password(password, officer.password_hash):
            officer.failed_login_attempts += 1
            if officer.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
                officer.lockout_until = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
                    minutes=settings.LOCKOUT_MINUTES
                )
            await self._log_login(officer.id, ip_address, user_agent, success=False)
            raise AuthenticationException()

        # Successful login — reset lockout state
        officer.failed_login_attempts = 0
        officer.lockout_until = None
        officer.last_login_at = datetime.datetime.now(datetime.timezone.utc)
        await self._log_login(officer.id, ip_address, user_agent, success=True)

        return self._build_token_response(officer)

    async def refresh(self, refresh_token: str) -> dict:
        """Rotate a valid refresh token into a new token pair."""
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise TokenExpiredException()

        officer_id = payload.get("sub")
        officer = await self._officers.get_active_by_id(UUID(officer_id))
        if officer is None or officer.is_deleted:
            raise AuthenticationException()
        if officer.status != "Active":
            raise OfficerInactiveException()

        return self._build_token_response(officer)

    async def change_password(
        self,
        officer_id: UUID,
        current_password: str,
        new_password: str,
        actor_id: UUID,
    ) -> None:
        """Change officer password after verifying current password."""
        officer = await self._officers.get_active_by_id(officer_id)
        if officer is None:
            raise OfficerNotFoundException()
        if not verify_password(current_password, officer.password_hash):
            raise AuthenticationException("Current password is incorrect.")

        officer.password_hash = get_password_hash(new_password)
        officer.last_password_change = datetime.datetime.now(datetime.timezone.utc)
        officer.password_changed_by = actor_id

    async def admin_reset_password(
        self,
        officer_id: UUID,
        new_password: str,
        actor_id: UUID,
    ) -> None:
        """Admin-initiated password reset — no current password required."""
        officer = await self._officers.get_active_by_id(officer_id)
        if officer is None:
            raise OfficerNotFoundException()
        officer.password_hash = get_password_hash(new_password)
        officer.last_password_change = datetime.datetime.now(datetime.timezone.utc)
        officer.password_changed_by = actor_id

    async def get_officer_from_token(self, token: str) -> Officer:
        """Decode access token and return the live Officer record."""
        payload = decode_token(token)
        if payload is None or payload.get("type") != "access":
            raise AuthenticationException()
        officer_id = payload.get("sub")
        officer = await self._officers.get_active_by_id(UUID(officer_id))
        if officer is None or officer.is_deleted:
            raise AuthenticationException()
        if officer.status != "Active":
            raise OfficerInactiveException()
        return officer

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _build_token_response(self, officer: Officer) -> dict:
        token_data = {"sub": str(officer.id), "role": officer.role, "username": officer.username}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "Bearer",
            "officer": {
                "id": str(officer.id),
                "username": officer.username,
                "email": officer.email,
                "role": officer.role,
                "department": officer.department,
                "badge_number": officer.badge_number,
            },
        }

    async def _log_login(
        self,
        officer_id: Optional[UUID],
        ip_address: str,
        user_agent: str,
        success: bool,
    ) -> None:
        log = LoginLog(
            officer_id=officer_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
        )
        await self._login_logs.add(log)
