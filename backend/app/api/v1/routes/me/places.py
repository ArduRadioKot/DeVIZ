from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.schemas import GeoPoint, UserPlace, UserPlaceCreate
from app.db import get_connection

router = APIRouter()


@router.get("", response_model=list[UserPlace])
async def list_places(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[UserPlace]:
    result = await connection.execute(
        text(
            """
            SELECT id, name, image_url,
                   ST_Y(location::geometry) AS latitude,
                   ST_X(location::geometry) AS longitude,
                   created_at
            FROM user_places
            WHERE user_id = :uid
            ORDER BY created_at DESC
            """
        ),
        {"uid": current_user_id},
    )
    return [
        UserPlace(
            id=row["id"],
            name=row["name"],
            image_url=row["image_url"],
            location=GeoPoint(latitude=row["latitude"], longitude=row["longitude"]) if row["latitude"] is not None else None,
            created_at=row["created_at"],
        )
        for row in result.mappings()
    ]


@router.post("", response_model=UserPlace, status_code=status.HTTP_201_CREATED)
async def create_place(
    payload: UserPlaceCreate,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> UserPlace:
    if payload.location is not None:
        result = await connection.execute(
            text(
                """
                INSERT INTO user_places (user_id, name, image_url, location)
                VALUES (:uid, :name, :image_url,
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography)
                RETURNING id, created_at,
                          ST_Y(location::geometry) AS latitude,
                          ST_X(location::geometry) AS longitude
                """
            ),
            {
                "uid": current_user_id,
                "name": payload.name,
                "image_url": payload.image_url,
                "lat": payload.location.latitude,
                "lon": payload.location.longitude,
            },
        )
    else:
        result = await connection.execute(
            text(
                """
                INSERT INTO user_places (user_id, name, image_url)
                VALUES (:uid, :name, :image_url)
                RETURNING id, created_at,
                          NULL::double precision AS latitude,
                          NULL::double precision AS longitude
                """
            ),
            {
                "uid": current_user_id,
                "name": payload.name,
                "image_url": payload.image_url,
            },
        )

    row = result.mappings().one()
    return UserPlace(
        id=row["id"],
        name=payload.name,
        image_url=payload.image_url,
        location=GeoPoint(latitude=row["latitude"], longitude=row["longitude"]) if row["latitude"] is not None else None,
        created_at=row["created_at"],
    )


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_place(
    place_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    result = await connection.execute(
        text(
            "DELETE FROM user_places WHERE id = :place_id AND user_id = :uid RETURNING id"
        ),
        {"place_id": place_id, "uid": current_user_id},
    )
    if result.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "place_not_found", "Place not found")
