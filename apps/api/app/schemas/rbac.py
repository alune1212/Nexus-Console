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

    model_config = ConfigDict(from_attributes=True)


class RoleCreate(BaseModel):
    name: str
    description: str | None = None

    model_config = ConfigDict(strict=True)


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

    model_config = ConfigDict(strict=True)


class RolePermissionsUpdate(BaseModel):
    permission_codes: list[str]

    model_config = ConfigDict(strict=True)


class UserRolesUpdate(BaseModel):
    role_names: list[str]

    model_config = ConfigDict(strict=True)
