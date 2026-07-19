import datetime
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from src.database.connection import hash_password
from src.repositories.unit_of_work import UnitOfWork
from src.utils.config_loader import config
from src.domain.dto.api_response import ResponseEnvelope, ResponseMeta

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
security = HTTPBearer()

SECRET_KEY = config["app"]["secret_key"]

class LoginRequest(BaseModel):
    username: str
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "inspector_sharma",
                "password": "password123"
            }
        }
    }

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    badge_number: str
    role: str

def get_uow() -> UnitOfWork:
    return UnitOfWork()

def create_session_token(username: str, role: str, expires_in_minutes: int = 60) -> str:
    """Creates a standard signed HS256 JWT token using PyJWT."""
    exp = datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_in_minutes)
    payload = {
        "sub": username,
        "role": role,
        "exp": exp
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_session_token(token: str) -> dict:
    """Verifies a standard HS256 JWT token and returns payload or raises HTTPException."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="AUTH_002: Session expired. Please log in again."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="AUTH_001: Invalid session token."
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    return verify_session_token(token)

def make_meta(request: Request) -> ResponseMeta:
    return ResponseMeta(
        request_id=getattr(request.state, "request_id", "N/A"),
        correlation_id=getattr(request.state, "correlation_id", "N/A"),
        api_version="v1"
    )

@router.post("/login", response_model=ResponseEnvelope, summary="Authenticate officer", description="Exchange badge username and password for a signed HS256 JWT session token.")
def login(request: Request, req: LoginRequest, uow: UnitOfWork = Depends(get_uow)):
    # Hash password
    h_password = hash_password(req.password)
    
    with uow:
        # Query officer through repository layer
        officer = uow.officers.get_by_username(req.username)
        
        if not officer or officer.password_hash != h_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="AUTH_001: Invalid badge credentials or password"
            )
            
        token = create_session_token(officer.username, officer.role)
        data = {
            "access_token": token,
            "token_type": "bearer",
            "badge_number": officer.badge_number,
            "role": officer.role
        }
        return ResponseEnvelope(
            success=True,
            message="Login successful",
            data=data,
            meta=make_meta(request)
        )
