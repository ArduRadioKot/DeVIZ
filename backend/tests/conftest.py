import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import DATABASE_URL
from app.main import create_app


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def app():
    return create_app()


@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def db_connection():
    engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
    async with engine.begin() as conn:
        yield conn
    await engine.dispose()


@pytest_asyncio.fixture
async def demo_token(client) -> str:
    """Register and return a valid auth token for demo user."""
    # Try login first
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "test@demo.ru", "password": "Demo1234!"},
    )
    if resp.status_code == 200:
        return resp.json()["token"]

    # Register
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@demo.ru",
            "password": "Demo1234!",
            "name": "Test User",
            "timezone": "Europe/Moscow",
        },
    )
    if resp.status_code == 201:
        return resp.json()["token"]

    pytest.skip("Could not create demo user for tests")
