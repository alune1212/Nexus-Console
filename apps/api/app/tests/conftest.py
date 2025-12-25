"""Pytest configuration and fixtures."""

import asyncio
from collections.abc import AsyncGenerator
from contextlib import suppress

import pytest
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)

# Create test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db() -> AsyncGenerator[AsyncSession]:
    """Override database dependency for tests."""
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@pytest.fixture(scope="function", autouse=True)
async def setup_database() -> AsyncGenerator[None]:
    """Create tables before each test and drop after."""
    # Initialize cache for tests
    FastAPICache.init(InMemoryBackend(), prefix="test-cache")

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    # Clear cache
    await FastAPICache.clear()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient]:
    """Create an async test client."""
    # Override database dependency
    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_rate_limit_storage() -> None:
    """Ensure rate limiter storage is cleared before/after each test."""
    storage = getattr(app.state.limiter, "_storage", None)
    if storage is not None:
        storage.reset()
    yield
    if storage is not None:
        storage.reset()


def _dispose_test_engine() -> None:
    """Dispose the async test engine to stop the aiosqlite worker thread."""
    asyncio.run(test_engine.dispose())


def _shutdown_rate_limiter_timers() -> None:
    """Cancel lingering slowapi timers to avoid non-daemon threads."""
    limiter = getattr(app.state, "limiter", None)
    if limiter is None:
        return

    storages = [getattr(limiter, "_storage", None)]
    fallback = getattr(limiter, "_fallback_limiter", None)
    if fallback is not None:
        storages.append(getattr(fallback, "_storage", None))

    for storage in storages:
        if storage is None:
            continue
        timer = getattr(storage, "timer", None)
        if timer is None:
            continue
        timer.cancel()
        with suppress(RuntimeError):
            timer.join(timeout=1)
        storage.timer = None


def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    """Ensure pytest shuts down cleanly."""
    _dispose_test_engine()
    _shutdown_rate_limiter_timers()
