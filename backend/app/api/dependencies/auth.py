"""
Authentication and RBAC FastAPI dependencies.
get_current_officer — validates Bearer token and returns live Officer.
require_roles       — decorator factory enforcing role-based access control.
"""
from typing import List
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer

from app.domain.exceptions.auth import AuthenticationException, PermissionDeniedException
from app.models.officer import Officer
from app.services.auth_service import AuthService
from app.api.dependencies.services import get_auth_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_officer(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> Officer:
    """Extract and validate Bearer token; return authenticated Officer."""
    if not token:
        raise AuthenticationException("No authentication token provided.")
    return await auth_service.get_officer_from_token(token)


def require_roles(*roles: str):
    """
    Dependency factory that checks the current officer holds at least one
    of the specified roles. Usage:

        @router.post("/officers", dependencies=[Depends(require_roles("ADMIN"))])
    """
    async def _guard(
        officer: Officer = Depends(get_current_officer),
    ) -> Officer:
        if officer.role not in roles:
            raise PermissionDeniedException(
                f"This action requires one of the following roles: {', '.join(roles)}."
            )
        return officer
    return _guard
