"""Tests for authentication API endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.auth_identity import AuthIdentity
from app.models.user import User


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient) -> None:
    """Test successful user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "securepassword123",
            "name": "New User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"
    assert data["is_active"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient) -> None:
    """Test registration with duplicate email."""
    # Register first user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "password123",
            "name": "First User",
        },
    )

    # Try to register with same email
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "differentpassword",
            "name": "Second User",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_invalid_password(client: AsyncClient) -> None:
    """Test registration with invalid password (too short)."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "short",  # Less than 8 characters
            "name": "Test User",
        },
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    """Test successful login."""
    # Register a user first
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "logintest@example.com",
            "password": "testpassword123",
            "name": "Login Test",
        },
    )

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "logintest@example.com",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "logintest@example.com"

    # Check cookies are set
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient) -> None:
    """Test login with wrong password."""
    # Register a user first
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrongpass@example.com",
            "password": "correctpassword",
            "name": "Test User",
        },
    )

    # Try to login with wrong password
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrongpass@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient) -> None:
    """Test login with non-existent email."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "somepassword",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient) -> None:
    """Test getting current user when authenticated."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "password": "password123",
            "name": "Me User",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "me@example.com",
            "password": "password123",
        },
    )

    # Get cookies from login response
    cookies = login_response.cookies

    # Call /me endpoint with cookies
    response = await client.get("/api/v1/auth/me", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["name"] == "Me User"
    assert any(role["name"] == "user" for role in data["roles"])
    assert data["permissions"] == []


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient) -> None:
    """Test getting current user when not authenticated."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient) -> None:
    """Test refreshing access token."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh@example.com",
            "password": "password123",
            "name": "Refresh User",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "refresh@example.com",
            "password": "password123",
        },
    )

    cookies = login_response.cookies

    # Refresh token
    response = await client.post("/api/v1/auth/refresh", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "refresh@example.com"

    # New cookies should be set
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_refresh_without_token(client: AsyncClient) -> None:
    """Test refresh endpoint without refresh token."""
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, setup_database: None) -> None:
    """Test logout functionality and token version increment."""
    # Get database session (we need to check token_version)
    from app.tests.conftest import TestSessionLocal

    async with TestSessionLocal() as db:
        # Register and login
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "logout@example.com",
                "password": "password123",
                "name": "Logout User",
            },
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "logout@example.com",
                "password": "password123",
            },
        )

        cookies = login_response.cookies

        # Check initial token_version
        result = await db.execute(
            select(AuthIdentity).where(AuthIdentity.identifier == "logout@example.com")
        )
        auth_identity_before = result.scalar_one()
        initial_version = auth_identity_before.token_version

        # Logout
        logout_response = await client.post("/api/v1/auth/logout", cookies=cookies)
        assert logout_response.status_code == 204

        # Check token_version was incremented
        await db.refresh(auth_identity_before)
        assert auth_identity_before.token_version == initial_version + 1

        # Try to use old access token (should fail)
        me_response = await client.get("/api/v1/auth/me", cookies=cookies)
        assert me_response.status_code == 401


@pytest.mark.asyncio
async def test_token_version_revocation(client: AsyncClient, setup_database: None) -> None:
    """Test that old tokens are invalid after token_version increment."""
    from app.tests.conftest import TestSessionLocal

    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "revoke@example.com",
            "password": "password123",
            "name": "Revoke User",
        },
    )

    # Login and save cookies
    login1 = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "revoke@example.com",
            "password": "password123",
        },
    )
    cookies1 = login1.cookies

    # Verify first login works
    response1 = await client.get("/api/v1/auth/me", cookies=cookies1)
    assert response1.status_code == 200

    # Manually increment token_version (simulating logout)
    async with TestSessionLocal() as db:
        result = await db.execute(
            select(AuthIdentity).where(AuthIdentity.identifier == "revoke@example.com")
        )
        auth_identity = result.scalar_one()
        auth_identity.token_version += 1
        await db.commit()

    # Old token should now be invalid
    response2 = await client.get("/api/v1/auth/me", cookies=cookies1)
    assert response2.status_code == 401


@pytest.mark.asyncio
async def test_inactive_user_cannot_login(client: AsyncClient, setup_database: None) -> None:
    """Test that inactive users cannot login."""
    from app.tests.conftest import TestSessionLocal

    # Register user
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "inactive@example.com",
            "password": "password123",
            "name": "Inactive User",
        },
    )

    # Deactivate user
    async with TestSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "inactive@example.com"))
        user = result.scalar_one()
        user.is_active = False
        await db.commit()

    # Try to login
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "inactive@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 400
    assert "inactive" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient) -> None:
    """Test successful password change."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "changepass@example.com",
            "password": "oldpassword123",
            "name": "Change Pass User",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "changepass@example.com",
            "password": "oldpassword123",
        },
    )
    cookies = login_response.cookies

    # Change password
    response = await client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "oldpassword123",
            "new_password": "newpassword123",
        },
        cookies=cookies,
    )
    assert response.status_code == 204

    # Old password should no longer work
    old_login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "changepass@example.com",
            "password": "oldpassword123",
        },
    )
    assert old_login_response.status_code == 401

    # New password should work
    new_login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "changepass@example.com",
            "password": "newpassword123",
        },
    )
    assert new_login_response.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_current(client: AsyncClient) -> None:
    """Test password change with wrong current password."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrongcurrent@example.com",
            "password": "correctpassword",
            "name": "Test User",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "wrongcurrent@example.com",
            "password": "correctpassword",
        },
    )
    cookies = login_response.cookies

    # Try to change password with wrong current password
    response = await client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
        },
        cookies=cookies,
    )
    assert response.status_code == 400
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_password_unauthenticated(client: AsyncClient) -> None:
    """Test password change without authentication."""
    response = await client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "oldpassword",
            "new_password": "newpassword123",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password_invalid_new_password(client: AsyncClient) -> None:
    """Test password change with invalid new password (too short)."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "invalidnew@example.com",
            "password": "oldpassword123",
            "name": "Test User",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "invalidnew@example.com",
            "password": "oldpassword123",
        },
    )
    cookies = login_response.cookies

    # Try to change password with too short new password
    response = await client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "oldpassword123",
            "new_password": "short",  # Less than 8 characters
        },
        cookies=cookies,
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient) -> None:
    """Test getting current user profile via /users/me."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "profile@example.com",
            "password": "password123",
            "name": "Profile User",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "profile@example.com",
            "password": "password123",
        },
    )
    cookies = login_response.cookies

    # Get profile
    response = await client.get("/api/v1/users/me", cookies=cookies)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile@example.com"
    assert data["name"] == "Profile User"


@pytest.mark.asyncio
async def test_get_current_user_profile_unauthenticated(client: AsyncClient) -> None:
    """Test getting current user profile without authentication."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_current_user_profile(client: AsyncClient) -> None:
    """Test updating current user profile."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "updateprofile@example.com",
            "password": "password123",
            "name": "Original Name",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "updateprofile@example.com",
            "password": "password123",
        },
    )
    cookies = login_response.cookies

    # Update profile
    response = await client.patch(
        "/api/v1/users/me",
        json={
            "name": "Updated Name",
        },
        cookies=cookies,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["email"] == "updateprofile@example.com"


@pytest.mark.asyncio
async def test_update_current_user_profile_email(client: AsyncClient) -> None:
    """Test updating current user profile email."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "updateemail1@example.com",
            "password": "password123",
            "name": "User 1",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "updateemail1@example.com",
            "password": "password123",
        },
    )
    cookies = login_response.cookies

    # Update email
    response = await client.patch(
        "/api/v1/users/me",
        json={
            "email": "newemail@example.com",
        },
        cookies=cookies,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newemail@example.com"


@pytest.mark.asyncio
async def test_update_current_user_profile_duplicate_email(client: AsyncClient) -> None:
    """Test updating current user profile with duplicate email."""
    # Register two users
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate1@example.com",
            "password": "password123",
            "name": "User 1",
        },
    )

    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate2@example.com",
            "password": "password123",
            "name": "User 2",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "duplicate2@example.com",
            "password": "password123",
        },
    )
    cookies = login_response.cookies

    # Try to update user2's email to user1's email
    response = await client.patch(
        "/api/v1/users/me",
        json={
            "email": "duplicate1@example.com",
        },
        cookies=cookies,
    )
    assert response.status_code == 400
    assert "already" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_current_user_profile_unauthenticated(client: AsyncClient) -> None:
    """Test updating current user profile without authentication."""
    response = await client.patch(
        "/api/v1/users/me",
        json={
            "name": "New Name",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password_invalidates_tokens(client: AsyncClient) -> None:
    """Test that changing password invalidates existing tokens."""
    # Register and login
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "tokeninvalidate@example.com",
            "password": "oldpassword123",
            "name": "Test User",
        },
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "tokeninvalidate@example.com",
            "password": "oldpassword123",
        },
    )
    cookies = login_response.cookies

    # Verify token works
    me_response = await client.get("/api/v1/users/me", cookies=cookies)
    assert me_response.status_code == 200

    # Change password
    await client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "oldpassword123",
            "new_password": "newpassword123",
        },
        cookies=cookies,
    )

    # Old token should be invalid
    old_me_response = await client.get("/api/v1/users/me", cookies=cookies)
    assert old_me_response.status_code == 401
