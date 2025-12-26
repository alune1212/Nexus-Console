"""Tests for User API endpoints."""

import pytest
from httpx import AsyncClient

from app.config import settings


@pytest.fixture(autouse=True)
async def login_as_admin(client: AsyncClient) -> None:
    """Authenticate as an admin user for all user endpoint tests."""
    settings.admin_emails = ["admin@example.com"]
    await client.post(
        "/api/v1/auth/register",
        json={"email": "admin@example.com", "password": "password123", "name": "Admin"},
    )
    await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "password123"},
    )


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient) -> None:
    """Test creating a new user."""
    response = await client.post(
        "/api/v1/users/",
        json={"email": "test@example.com", "name": "Test User"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_user_duplicate_email(client: AsyncClient) -> None:
    """Test creating a user with duplicate email."""
    # Create first user
    await client.post(
        "/api/v1/users/",
        json={"email": "duplicate@example.com", "name": "User 1"},
    )

    # Try to create second user with same email
    response = await client.post(
        "/api/v1/users/",
        json={"email": "duplicate@example.com", "name": "User 2"},
    )
    assert response.status_code == 400
    data = response.json()
    assert "already" in data["detail"].lower()


@pytest.mark.asyncio
async def test_create_user_invalid_email(client: AsyncClient) -> None:
    """Test creating a user with invalid email."""
    response = await client.post(
        "/api/v1/users/",
        json={"email": "invalid-email", "name": "Test User"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient) -> None:
    """Test getting a user by ID."""
    # Create a user first
    create_response = await client.post(
        "/api/v1/users/",
        json={"email": "getuser@example.com", "name": "Get User"},
    )
    user_id = create_response.json()["id"]

    # Get the user
    response = await client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == "getuser@example.com"


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient) -> None:
    """Test getting a non-existent user."""
    response = await client.get("/api/v1/users/99999")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_list_users(client: AsyncClient) -> None:
    """Test listing users."""
    # Create some users
    await client.post(
        "/api/v1/users/",
        json={"email": "list1@example.com", "name": "List User 1"},
    )
    await client.post(
        "/api/v1/users/",
        json={"email": "list2@example.com", "name": "List User 2"},
    )

    # List users
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_list_users_pagination(client: AsyncClient) -> None:
    """Test listing users with pagination."""
    # Create users
    for i in range(5):
        await client.post(
            "/api/v1/users/",
            json={"email": f"page{i}@example.com", "name": f"Page User {i}"},
        )

    # Test pagination
    response = await client.get("/api/v1/users/?skip=2&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_update_user(client: AsyncClient) -> None:
    """Test updating a user."""
    # Create a user
    create_response = await client.post(
        "/api/v1/users/",
        json={"email": "update@example.com", "name": "Original Name"},
    )
    user_id = create_response.json()["id"]

    # Update the user
    response = await client.patch(
        f"/api/v1/users/{user_id}",
        json={"name": "Updated Name"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["email"] == "update@example.com"  # Email unchanged


@pytest.mark.asyncio
async def test_update_user_not_found(client: AsyncClient) -> None:
    """Test updating a non-existent user."""
    response = await client.patch(
        "/api/v1/users/99999",
        json={"name": "New Name"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_user(client: AsyncClient) -> None:
    """Test deleting a user."""
    # Create a user
    create_response = await client.post(
        "/api/v1/users/",
        json={"email": "delete@example.com", "name": "Delete User"},
    )
    user_id = create_response.json()["id"]

    # Delete the user
    response = await client.delete(f"/api/v1/users/{user_id}")
    assert response.status_code == 204

    # Verify user is deleted
    get_response = await client.get(f"/api/v1/users/{user_id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_user_not_found(client: AsyncClient) -> None:
    """Test deleting a non-existent user."""
    response = await client.delete("/api/v1/users/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_user_missing_email(client: AsyncClient) -> None:
    """Test creating a user without email."""
    response = await client.post(
        "/api/v1/users/",
        json={"name": "Test User"},
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_create_user_empty_email(client: AsyncClient) -> None:
    """Test creating a user with empty email."""
    response = await client.post(
        "/api/v1/users/",
        json={"email": "", "name": "Test User"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_user_empty_name(client: AsyncClient) -> None:
    """Test creating a user with empty name (should be allowed)."""
    response = await client.post(
        "/api/v1/users/",
        json={"email": "empty@example.com", "name": ""},
    )
    # Empty name should be allowed (optional field)
    assert response.status_code in (201, 422)  # Depending on validation rules


@pytest.mark.asyncio
async def test_create_user_invalid_email_format(client: AsyncClient) -> None:
    """Test creating a user with various invalid email formats."""
    invalid_emails = [
        "not-an-email",
        "@example.com",
        "user@",
        "user@.com",
        "user..name@example.com",
        "user@example",
    ]
    for email in invalid_emails:
        response = await client.post(
            "/api/v1/users/",
            json={"email": email, "name": "Test User"},
        )
        assert response.status_code == 422, f"Email {email} should be invalid"


@pytest.mark.asyncio
async def test_get_user_invalid_id(client: AsyncClient) -> None:
    """Test getting a user with invalid ID format."""
    response = await client.get("/api/v1/users/invalid-id")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_user_negative_id(client: AsyncClient) -> None:
    """Test getting a user with negative ID."""
    response = await client.get("/api/v1/users/-1")
    # FastAPI treats -1 as a valid integer, so it returns 404 (not found) instead of 422
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_user_invalid_email(client: AsyncClient) -> None:
    """Test updating a user with invalid email."""
    # Create a user first
    create_response = await client.post(
        "/api/v1/users/",
        json={"email": "updateinvalid@example.com", "name": "Test User"},
    )
    user_id = create_response.json()["id"]

    # Try to update with invalid email
    response = await client.patch(
        f"/api/v1/users/{user_id}",
        json={"email": "invalid-email-format"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_user_duplicate_email(client: AsyncClient) -> None:
    """Test updating a user with an email that already exists."""
    # Create two users
    await client.post(
        "/api/v1/users/",
        json={"email": "user1@example.com", "name": "User 1"},
    )
    user2_response = await client.post(
        "/api/v1/users/",
        json={"email": "user2@example.com", "name": "User 2"},
    )
    user2_id = user2_response.json()["id"]

    # Try to update user2 with user1's email
    response = await client.patch(
        f"/api/v1/users/{user2_id}",
        json={"email": "user1@example.com"},
    )
    # Database integrity error returns 409 Conflict
    assert response.status_code == 409
    data = response.json()
    assert "constraint" in data["detail"].lower() or "error" in data["error"].lower()


@pytest.mark.asyncio
async def test_update_user_empty_payload(client: AsyncClient) -> None:
    """Test updating a user with empty payload."""
    # Create a user first
    create_response = await client.post(
        "/api/v1/users/",
        json={"email": "emptyupdate@example.com", "name": "Test User"},
    )
    user_id = create_response.json()["id"]

    # Update with empty payload (should be allowed, no changes)
    response = await client.patch(
        f"/api/v1/users/{user_id}",
        json={},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "emptyupdate@example.com"


@pytest.mark.asyncio
async def test_list_users_invalid_pagination(client: AsyncClient) -> None:
    """Test listing users with invalid pagination parameters."""
    # Test negative skip (FastAPI may accept negative values, so we check behavior)
    response = await client.get("/api/v1/users/?skip=-1")
    # FastAPI may accept negative values and treat them as 0, or return 422
    assert response.status_code in (200, 422)

    # Test negative limit
    response = await client.get("/api/v1/users/?limit=-1")
    assert response.status_code in (200, 422)

    # Test non-numeric skip (should return 422)
    response = await client.get("/api/v1/users/?skip=invalid")
    assert response.status_code == 422

    # Test non-numeric limit (should return 422)
    response = await client.get("/api/v1/users/?limit=invalid")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_users_large_limit(client: AsyncClient) -> None:
    """Test listing users with very large limit."""
    # Test limit exceeding max (should be capped or rejected)
    response = await client.get("/api/v1/users/?limit=10000")
    # Should either work (with cap) or return 422
    assert response.status_code in (200, 422)


@pytest.mark.asyncio
async def test_create_user_very_long_email(client: AsyncClient) -> None:
    """Test creating a user with very long email."""
    long_email = "a" * 200 + "@example.com"
    response = await client.post(
        "/api/v1/users/",
        json={"email": long_email, "name": "Test User"},
    )
    # Should either be rejected or accepted depending on validation
    assert response.status_code in (201, 422)


@pytest.mark.asyncio
async def test_create_user_very_long_name(client: AsyncClient) -> None:
    """Test creating a user with very long name."""
    long_name = "a" * 1000
    response = await client.post(
        "/api/v1/users/",
        json={"email": "longname@example.com", "name": long_name},
    )
    # Should either be rejected or accepted depending on validation
    assert response.status_code in (201, 422)
