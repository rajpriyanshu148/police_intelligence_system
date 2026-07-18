from fastapi import APIRouter, Depends, Request
from uuid import UUID

from app.api.dependencies.auth import get_current_officer, require_roles
from app.api.dependencies.services import get_auth_service, get_officer_service
from app.api.v1.schemas.auth import (
    LoginRequest, RefreshRequest, ChangePasswordRequest,
    AdminResetPasswordRequest, CreateOfficerRequest, UpdateOfficerRequest, OfficerOut,
)
from app.api.v1.schemas.common import ok, make_pagination
from app.models.officer import Officer
from app.services.auth_service import AuthService
from app.services.officer_service import OfficerService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", summary="Officer / Admin Login")
async def login(
    body: LoginRequest,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    token_data = await auth_service.login(
        username=body.username,
        password=body.password,
        ip_address=ip,
        user_agent=user_agent,
    )
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    return ok(token_data, "Authentication successful.", req_id, corr_id)


@router.post("/refresh", summary="Refresh Access Token")
async def refresh(
    body: RefreshRequest,
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    token_data = await auth_service.refresh(body.refresh_token)
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    return ok(token_data, "Token refreshed.", req_id, corr_id)


@router.post("/logout", summary="Logout (client-side token discard)")
async def logout(
    request: Request,
    _: Officer = Depends(get_current_officer),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    return ok(None, "Logged out successfully.", req_id, corr_id)


@router.post("/change-password", summary="Change Own Password")
async def change_password(
    body: ChangePasswordRequest,
    request: Request,
    current_officer: Officer = Depends(get_current_officer),
    auth_service: AuthService = Depends(get_auth_service),
):
    from app.repositories.unit_of_work import SqlAlchemyUnitOfWork
    from app.api.dependencies.database import get_db
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    await auth_service.change_password(
        officer_id=current_officer.id,
        current_password=body.current_password,
        new_password=body.new_password,
        actor_id=current_officer.id,
    )
    return ok(None, "Password changed successfully.", req_id, corr_id)


@router.post("/reset-password/{officer_id}", summary="Admin Password Reset")
async def admin_reset_password(
    officer_id: UUID,
    body: AdminResetPasswordRequest,
    request: Request,
    _: Officer = Depends(require_roles("ADMIN")),
    auth_service: AuthService = Depends(get_auth_service),
    current_officer: Officer = Depends(get_current_officer),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    await auth_service.admin_reset_password(
        officer_id=officer_id,
        new_password=body.new_password,
        actor_id=current_officer.id,
    )
    return ok(None, "Password reset successfully.", req_id, corr_id)


@router.get("/me", summary="Current Officer Profile")
async def get_me(
    request: Request,
    current_officer: Officer = Depends(get_current_officer),
):
    req_id = getattr(request.state, "request_id", "")
    corr_id = getattr(request.state, "correlation_id", "")
    return ok(OfficerOut.model_validate(current_officer).model_dump(), "Profile retrieved.", req_id, corr_id)
