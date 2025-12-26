"""Tests for RBAC endpoints and authorization."""

import pytest
from httpx import AsyncClient

from app.config import settings


@pytest.mark.asyncio
async def test_admin_allowlist_gets_admin_role(client: AsyncClient) -> None:
    settings.admin_emails = "allow@example.com"

    await client.post(
        "/api/v1/auth/register",
        json={"email": "allow@example.com", "password": "password123", "name": "Allow"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "allow@example.com", "password": "password123"},
    )

    resp = await client.get("/api/v1/auth/me", cookies=login.cookies)
    assert resp.status_code == 200
    data = resp.json()

    role_names = {r["name"] for r in data["roles"]}
    assert "admin" in role_names
    assert "user" not in role_names
    assert "rbac:read" in data["permissions"]
    assert "rbac:write" in data["permissions"]
    assert "users:read" in data["permissions"]
    assert "users:write" in data["permissions"]


@pytest.mark.asyncio
async def test_non_admin_cannot_list_roles(client: AsyncClient) -> None:
    settings.admin_emails = ""

    await client.post(
        "/api/v1/auth/register",
        json={"email": "user@example.com", "password": "password123", "name": "User"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "password123"},
    )

    resp = await client.get("/api/v1/roles", cookies=login.cookies)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_roles_and_permissions(client: AsyncClient) -> None:
    settings.admin_emails = "admin@example.com"

    await client.post(
        "/api/v1/auth/register",
        json={"email": "admin@example.com", "password": "password123", "name": "Admin"},
    )
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "password123"},
    )

    roles = await client.get("/api/v1/roles", cookies=login.cookies)
    assert roles.status_code == 200
    role_names = {r["name"] for r in roles.json()}
    assert "admin" in role_names
    assert "user" in role_names

    perms = await client.get("/api/v1/permissions", cookies=login.cookies)
    assert perms.status_code == 200
    perm_codes = {p["code"] for p in perms.json()}
    assert "rbac:read" in perm_codes
    assert "rbac:write" in perm_codes
    assert "users:read" in perm_codes
    assert "users:write" in perm_codes


@pytest.mark.asyncio
async def test_users_list_requires_permission(client: AsyncClient) -> None:
    settings.admin_emails = ""

    # normal user
    await client.post(
        "/api/v1/auth/register",
        json={"email": "u1@example.com", "password": "password123", "name": "U1"},
    )
    login_user = await client.post(
        "/api/v1/auth/login",
        json={"email": "u1@example.com", "password": "password123"},
    )
    resp_forbidden = await client.get("/api/v1/users/", cookies=login_user.cookies)
    assert resp_forbidden.status_code == 403

    # admin user
    settings.admin_emails = "admin2@example.com"
    await client.post(
        "/api/v1/auth/register",
        json={"email": "admin2@example.com", "password": "password123", "name": "Admin2"},
    )
    login_admin = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin2@example.com", "password": "password123"},
    )
    resp_ok = await client.get("/api/v1/users/", cookies=login_admin.cookies)
    assert resp_ok.status_code == 200


@pytest.mark.asyncio
async def test_role_delete_guards(client: AsyncClient) -> None:
    """System roles cannot be deleted; roles in use must be unassigned before deletion."""
    settings.admin_emails = "admin-del@example.com"

    # admin login
    await client.post(
        "/api/v1/auth/register",
        json={"email": "admin-del@example.com", "password": "password123", "name": "AdminDel"},
    )
    login_admin = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin-del@example.com", "password": "password123"},
    )

    # create a normal user (no admin allowlist)
    settings.admin_emails = ""
    await client.post(
        "/api/v1/auth/register",
        json={"email": "u-del@example.com", "password": "password123", "name": "UDel"},
    )

    # fetch users and find the user id
    users = await client.get("/api/v1/users/", cookies=login_admin.cookies)
    assert users.status_code == 200
    u = next((x for x in users.json() if x["email"] == "u-del@example.com"), None)
    assert u is not None
    user_id = u["id"]

    # create role
    role_resp = await client.post(
        "/api/v1/roles",
        json={"name": "temp-delete", "description": "temp"},
        cookies=login_admin.cookies,
    )
    assert role_resp.status_code == 201
    role_id = role_resp.json()["id"]

    # assign role to user (role is now in use)
    assign = await client.put(
        f"/api/v1/users/{user_id}/roles",
        json={"role_names": ["temp-delete"]},
        cookies=login_admin.cookies,
    )
    assert assign.status_code == 200

    # cannot delete role in use
    del_in_use = await client.delete(f"/api/v1/roles/{role_id}", cookies=login_admin.cookies)
    assert del_in_use.status_code == 400

    # unassign then delete succeeds
    unassign = await client.put(
        f"/api/v1/users/{user_id}/roles",
        json={"role_names": []},
        cookies=login_admin.cookies,
    )
    assert unassign.status_code == 200

    del_ok = await client.delete(f"/api/v1/roles/{role_id}", cookies=login_admin.cookies)
    assert del_ok.status_code == 204

    # system role cannot be deleted
    roles = await client.get("/api/v1/roles", cookies=login_admin.cookies)
    assert roles.status_code == 200
    admin_role = next((r for r in roles.json() if r["name"] == "admin"), None)
    assert admin_role is not None
    del_system = await client.delete(
        f"/api/v1/roles/{admin_role['id']}",
        cookies=login_admin.cookies,
    )
    assert del_system.status_code == 400
