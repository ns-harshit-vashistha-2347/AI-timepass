import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from src.core.config import settings


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)



def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    now = _now_utc()
    payload: dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
        "type": "access",
    }

    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=settings.JWT_ALGORITHM)
    if payload.get("type") != "access":
        raise JWTError("Wrong token type")

    return payload


def generate_refresh_token() ->  tuple[str, str, datetime]:
    raw = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expires_at = _now_utc() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return raw, token_hash, expires_at


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


__all__ = [
    "create_access_token",
    "decode_access_token",
    "generate_refresh_token",
    "hash_refresh_token",
    "JWTError",
]
