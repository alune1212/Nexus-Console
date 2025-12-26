"""User schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.rbac import RoleResponse


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    name: str | None = None


class UserCreate(UserBase):
    """Schema for creating a user."""

    model_config = ConfigDict(strict=True)


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    email: EmailStr | None = None
    name: str | None = None
    is_active: bool | None = None

    model_config = ConfigDict(strict=True)


class UserResponse(UserBase):
    """Schema for user response."""

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CurrentUserResponse(BaseModel):
    """Schema for current user with RBAC information."""

    id: int
    email: EmailStr
    name: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    roles: list[RoleResponse]
    permissions: list[str]

    model_config = ConfigDict(from_attributes=True)
