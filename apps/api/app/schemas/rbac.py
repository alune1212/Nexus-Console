"""RBAC schemas."""

from pydantic import BaseModel, ConfigDict


class PermissionResponse(BaseModel):
    id: int
    code: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    permissions: list[PermissionResponse] = []
    is_system: bool = False
    exclusive_group: str | None = None
    priority: int = 0

    model_config = ConfigDict(from_attributes=True)


class RoleRefResponse(BaseModel):
    """Lightweight role representation (without permissions)."""

    id: int
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    exclusive_group: str | None = None
    priority: int = 0

    model_config = ConfigDict(strict=True)


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    exclusive_group: str | None = None
    priority: int | None = None

    model_config = ConfigDict(strict=True)


class RolePermissionsUpdate(BaseModel):
    permission_codes: list[str]

    model_config = ConfigDict(strict=True)


class UserRolesUpdate(BaseModel):
    role_names: list[str]

    model_config = ConfigDict(strict=True)
