from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.schemas import City, GeoPoint
from app.db import get_connection

router = APIRouter()


def city_from_row(row: dict) -> City:
    return City(
        id=row["id"],
        name=row["name"],
        region=row["region"],
        country_code=row["country_code"],
        timezone=row["timezone"],
        center=GeoPoint(latitude=row["latitude"], longitude=row["longitude"]),
    )


@router.get("", response_model=list[City])
async def list_cities(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    query: Annotated[str | None, Query(min_length=2, max_length=80)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[City]:
    conditions = []
    params: dict[str, object] = {"limit": limit}

    if query is not None:
        conditions.append("name ILIKE :query")
        params["query"] = f"%{query}%"

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    result = await connection.execute(
        text(
            f"""
            SELECT id,
                   name,
                   region,
                   country_code,
                   timezone,
                   ST_Y(center::geometry) AS latitude,
                   ST_X(center::geometry) AS longitude
            FROM cities
            {where_clause}
            ORDER BY name
            LIMIT :limit
            """
        ),
        params,
    )

    return [city_from_row(row) for row in result.mappings()]


@router.get("/{city_id}", response_model=City)
async def get_city(
    city_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> City:
    result = await connection.execute(
        text(
            """
            SELECT id,
                   name,
                   region,
                   country_code,
                   timezone,
                   ST_Y(center::geometry) AS latitude,
                   ST_X(center::geometry) AS longitude
            FROM cities
            WHERE id = :city_id
            """
        ),
        {"city_id": city_id},
    )
    row = result.mappings().one_or_none()

    if row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "city_not_found", "City not found")

    return city_from_row(row)
