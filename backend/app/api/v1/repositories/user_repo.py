"""Data access layer for users."""

from uuid import UUID

from fastapi import status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.schemas import MeProfile


def profile_from_row(row) -> MeProfile:
    return MeProfile(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        avatar_url=row.get("avatar_url"),
        city=(
            {
                "id": row["city_id"],
                "name": row["city_name"],
                "region": row.get("city_region"),
                "timezone": row["city_timezone"],
            }
            if row.get("city_id")
            else None
        ),
        timezone=row["timezone"],
    )


async def get_user_profile(connection: AsyncConnection, user_id: UUID) -> MeProfile:
    """Fetch a user profile by ID, or raise 404."""
    result = await connection.execute(
        text(
            """
            SELECT u.id, u.email, u.name, u.avatar_url, u.timezone,
                   c.id AS city_id, c.name AS city_name, c.region AS city_region,
                   c.timezone AS city_timezone
            FROM users u
            LEFT JOIN cities c ON c.id = u.city_id
            WHERE u.id = :user_id AND u.deleted_at IS NULL
            """
        ),
        {"user_id": user_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "user_not_found", "User not found")
    return profile_from_row(row)
