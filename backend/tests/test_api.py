"""Basic API smoke tests. Requires a running PostgreSQL + Redis instance."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app

pytestmark = pytest.mark.asyncio


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestHealth:
    async def test_health_endpoint(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}

    async def test_root_endpoint(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data


class TestAuth:
    async def test_register_validation(self, client):
        resp = await client.post(
            "/api/v1/auth/register",
            json={"email": "not-an-email", "password": "short", "name": "Test"},
        )
        assert resp.status_code == 422

    async def test_login_validation(self, client):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "not-an-email", "password": ""},
        )
        assert resp.status_code == 422

    async def test_verify_without_token(self, client):
        resp = await client.get("/api/v1/auth/verify")
        assert resp.status_code == 401

    async def test_verify_with_bad_token(self, client):
        resp = await client.get(
            "/api/v1/auth/verify",
            headers={"Authorization": "Bearer deadbeef"},
        )
        assert resp.status_code == 401


class TestActivities:
    async def test_list_activities_without_auth(self, client):
        resp = await client.get("/api/v1/activities")
        # Listing should work without auth (optional viewer)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "next_cursor" in data


class TestCities:
    async def test_list_cities(self, client):
        resp = await client.get("/api/v1/cities")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data


class TestCatalog:
    async def test_list_categories(self, client):
        resp = await client.get("/api/v1/catalog/categories")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_levels(self, client):
        resp = await client.get("/api/v1/catalog/levels")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
