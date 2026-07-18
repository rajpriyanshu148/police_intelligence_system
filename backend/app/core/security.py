"""
Security utilities — password hashing (bcrypt direct) and JWT token management.

We use the `bcrypt` library directly instead of passlib to avoid a known
incompatibility between passlib 1.7.x and bcrypt >= 4.x.
"""
import datetime
from typing import Optional, Dict, Any

import bcrypt
import jwt

from app.core.settings import settings


# ── Password hashing ──────────────────────────────────────────────────────────

def get_password_hash(password: str) -> str:
    """Hash a plain-text password using bcrypt and return the hash string."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# ── JWT token management ──────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta
        or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate any JWT token. Returns payload dict or None."""
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# Backward-compatible alias retained for any code that still calls the old name
def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    return decode_token(token)
