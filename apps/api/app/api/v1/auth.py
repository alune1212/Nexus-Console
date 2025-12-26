"""Authentication API endpoints."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Response, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.config import settings
from app.core.exceptions import (
    EmailAlreadyExistsError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidPasswordError,
    TokenError,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.auth_identity import AuthIdentity
from app.models.rbac import Permission, Role
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest, LoginRequest, RegisterRequest
from app.schemas.rbac import RoleResponse
from app.schemas.user import CurrentUserResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

DEFAULT_PERMISSIONS: list[tuple[str, str]] = [
    ("users:read", "Read users"),
    ("users:write", "Write users"),
    ("rbac:read", "Read RBAC settings"),
    ("rbac:write", "Write RBAC settings"),
]


def _collect_permission_codes(user: User) -> list[str]:
    codes: set[str] = set()
    for role in user.roles:
        for perm in role.permissions:
            codes.add(perm.code)
    return sorted(codes)


def _build_current_user_response(user: User) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[RoleResponse.model_validate(r) for r in user.roles],
        permissions=_collect_permission_codes(user),
    )


async def _ensure_default_rbac(db: AsyncSession) -> tuple[Role, Role]:
    """Ensure default roles and permissions exist (for dev/tests without migration seed)."""
    role_admin = (
        await db.execute(
            select(Role).options(selectinload(Role.permissions)).where(Role.name == "admin")
        )
    ).scalar_one_or_none()
    if role_admin is None:
        role_admin = Role(name="admin", description="Administrator")
        # Avoid async lazy-load in SQLAlchemy async by initializing the collection explicitly
        role_admin.permissions = []
        db.add(role_admin)

    role_user = (await db.execute(select(Role).where(Role.name == "user"))).scalar_one_or_none()
    if role_user is None:
        role_user = Role(name="user", description="Default user")
        db.add(role_user)

    # ensure permissions exist
    existing = (await db.execute(select(Permission))).scalars().all()
    by_code = {p.code: p for p in existing}
    perms: list[Permission] = []
    for code, desc in DEFAULT_PERMISSIONS:
        perm = by_code.get(code)
        if perm is None:
            perm = Permission(code=code, description=desc)
            db.add(perm)
        perms.append(perm)

    await db.flush()

    # ensure admin has all permissions (do not clobber existing custom perms)
    existing_codes = {p.code for p in role_admin.permissions}
    for perm in perms:
        if perm.code not in existing_codes:
            role_admin.permissions.append(perm)
    await db.flush()

    return role_admin, role_user


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set authentication cookies in response."""
    # Access token cookie (短期)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.access_token_expires_minutes * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path="/",
    )
    # Refresh token cookie (长期)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.refresh_token_expires_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path="/api/v1/auth",  # 只在 auth 路径下有效
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear authentication cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """
    Register a new user.

    Creates a user account and associated password authentication identity.
    """
    # 检查邮箱是否已存在
    result = await db.execute(
        select(AuthIdentity).where(
            AuthIdentity.provider == "password", AuthIdentity.identifier == request.email
        )
    )
    if result.scalar_one_or_none():
        raise EmailAlreadyExistsError(request.email)

    role_admin, role_user = await _ensure_default_rbac(db)

    # 创建用户
    user = User(email=request.email, name=request.name, is_active=True)
    user.roles = [role_user]
    if request.email.lower() in settings.admin_email_set():
        user.roles.append(role_admin)
    db.add(user)
    await db.flush()  # 获取 user.id

    # 创建认证身份
    auth_identity = AuthIdentity(
        user_id=user.id,
        provider="password",
        identifier=request.email,
        hashed_password=hash_password(request.password),
        token_version=0,
    )
    db.add(auth_identity)

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/login", response_model=UserResponse)
async def login(
    request: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """
    Login with email and password.

    Sets access_token and refresh_token cookies on success.
    """
    # 查询认证身份
    result = await db.execute(
        select(AuthIdentity)
        .where(AuthIdentity.provider == "password")
        .where(AuthIdentity.identifier == request.email)
    )
    auth_identity = result.scalar_one_or_none()

    if not auth_identity or not auth_identity.hashed_password:
        raise InvalidCredentialsError()

    # 验证密码
    if not verify_password(request.password, auth_identity.hashed_password):
        raise InvalidCredentialsError()

    # 查询用户
    user = await db.get(User, auth_identity.user_id)
    if not user:
        raise InvalidCredentialsError()

    if not user.is_active:
        raise InactiveUserError()

    # 更新最后登录时间
    auth_identity.last_login_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(user)

    # 生成 token
    access_token = create_access_token(user.id, auth_identity.token_version)
    refresh_token = create_refresh_token(user.id, auth_identity.token_version)

    # 设置 cookie
    set_auth_cookies(response, access_token, refresh_token)

    return UserResponse.model_validate(user)


@router.get("/me", response_model=CurrentUserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> CurrentUserResponse:
    """Get current authenticated user."""
    return _build_current_user_response(current_user)


@router.post("/refresh", response_model=CurrentUserResponse)
async def refresh_token(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,  # type: ignore[assignment]
) -> CurrentUserResponse:
    """
    Refresh access token using refresh token cookie.

    Issues a new access token (and optionally a new refresh token).
    """
    credentials_exception = TokenError("Could not validate refresh token")

    if not refresh_token:
        raise credentials_exception

    try:
        payload = decode_token(refresh_token)
        user_id_str: str | None = payload.get("sub")  # type: ignore[assignment]
        token_type: str | None = payload.get("type")  # type: ignore[assignment]
        token_version: int | None = payload.get("ver")  # type: ignore[assignment]

        if user_id_str is None or token_type != "refresh" or token_version is None:
            raise credentials_exception

        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception from None

    # 查询用户及认证身份
    result = await db.execute(
        select(User, AuthIdentity)
        .join(AuthIdentity, User.id == AuthIdentity.user_id)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(User.id == user_id)
        .where(AuthIdentity.provider == "password")
    )
    row = result.first()

    if row is None:
        raise credentials_exception

    user, auth_identity = row

    # 验证 token_version
    if auth_identity.token_version != token_version:
        raise credentials_exception

    if not user.is_active:
        raise InactiveUserError()

    # 生成新 token
    new_access_token = create_access_token(user.id, auth_identity.token_version)
    new_refresh_token = create_refresh_token(user.id, auth_identity.token_version)

    # 设置新 cookie
    set_auth_cookies(response, new_access_token, new_refresh_token)

    return _build_current_user_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """
    Logout current user.

    Increments token_version to invalidate all existing tokens.
    """
    # 查询用户的认证身份
    result = await db.execute(
        select(AuthIdentity)
        .where(AuthIdentity.user_id == current_user.id)
        .where(AuthIdentity.provider == "password")
    )
    auth_identity = result.scalar_one_or_none()

    if auth_identity:
        # 递增 token_version，使所有现有 token 失效
        auth_identity.token_version += 1
        await db.commit()

    # 清除 cookie
    clear_auth_cookies(response)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    request: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    """
    Change current user's password.

    Requires current password verification.
    """
    # 查询用户的认证身份
    result = await db.execute(
        select(AuthIdentity)
        .where(AuthIdentity.user_id == current_user.id)
        .where(AuthIdentity.provider == "password")
    )
    auth_identity = result.scalar_one_or_none()

    if not auth_identity or not auth_identity.hashed_password:
        raise InvalidCredentialsError()

    # 验证当前密码
    if not verify_password(request.current_password, auth_identity.hashed_password):
        raise InvalidPasswordError("Current password is incorrect")

    # 更新密码
    auth_identity.hashed_password = hash_password(request.new_password)
    # 递增 token_version，使所有现有 token 失效（安全措施）
    auth_identity.token_version += 1

    await db.commit()
