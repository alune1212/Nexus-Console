"""Shared API dependencies (authn/authz)."""

from __future__ import annotations

from typing import Annotated

from fastapi import Cookie, Depends
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import InactiveUserError, PermissionDeniedError, TokenError
from app.core.security import decode_token
from app.database import get_db
from app.models.auth_identity import AuthIdentity
from app.models.rbac import Role
from app.models.user import User


async def get_current_user(
    access_token: Annotated[str | None, Cookie()] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,  # type: ignore[assignment]
) -> User:
    """
    Get current authenticated user from access token cookie.

    Loads RBAC relations (roles -> permissions) from DB so that role/permission changes
    take effect immediately.
    """
    credentials_exception = TokenError("Could not validate credentials")

    if not access_token:
        raise credentials_exception

    try:
        payload = decode_token(access_token)
        user_id_str: str | None = payload.get("sub")  # type: ignore[assignment]
        token_type: str | None = payload.get("type")  # type: ignore[assignment]
        token_version: int | None = payload.get("ver")  # type: ignore[assignment]

        if user_id_str is None or token_type != "access" or token_version is None:
            raise credentials_exception

        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception from None

    stmt = (
        select(User, AuthIdentity)
        .join(AuthIdentity, User.id == AuthIdentity.user_id)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.id == user_id)
        .where(AuthIdentity.provider == "password")
    )
    row = (await db.execute(stmt)).first()

    if row is None:
        raise credentials_exception

    user, auth_identity = row

    # token revocation (logout increments token_version)
    if auth_identity.token_version != token_version:
        raise credentials_exception

    if not user.is_active:
        raise InactiveUserError()

    return user


def _get_user_permission_codes(user: User) -> set[str]:
    codes: set[str] = set()
    for role in getattr(user, "roles", []) or []:
        for perm in getattr(role, "permissions", []) or []:
            codes.add(perm.code)
    return codes


def require_permissions(*required: str):
    """Require user to have all specified permission codes."""

    async def _dep(user: Annotated[User, Depends(get_current_user)]) -> User:
        user_codes = _get_user_permission_codes(user)
        missing = [code for code in required if code not in user_codes]
        if missing:
            raise PermissionDeniedError(f"Missing permissions: {', '.join(missing)}")
        return user

    return _dep
