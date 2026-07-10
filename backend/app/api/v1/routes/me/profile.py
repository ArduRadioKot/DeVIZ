from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.schemas import MeProfile, MeUpdate
from app.db import get_connection

router = APIRouter()


async def get_profile_or_404(connection: AsyncConnection, user_id: UUID) -> MeProfile:
    from app.api.v1.repositories.user_repo import get_user_profile

    return await get_user_profile(connection, user_id)


@router.get("/", response_model=MeProfile)
async def get_me(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> MeProfile:
    return await get_profile_or_404(connection, current_user_id)


@router.patch("/", response_model=MeProfile)
async def update_me(
    payload: MeUpdate,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> MeProfile:
    updates = []
    params: dict[str, object] = {"user_id": current_user_id}

    if payload.name is not None:
        updates.append("name = :name")
        params["name"] = payload.name

    if payload.avatar_url is not None:
        updates.append("avatar_url = :avatar_url")
        params["avatar_url"] = payload.avatar_url

    if payload.city_id is not None:
        updates.append("city_id = :city_id")
        params["city_id"] = payload.city_id

    if payload.timezone is not None:
        updates.append("timezone = :timezone")
        params["timezone"] = payload.timezone

    if updates:
        try:
            await connection.execute(
                text(
                    f"""
                    UPDATE users
                    SET {', '.join(updates)},
                        updated_at = now()
                    WHERE id = :user_id
                      AND deleted_at IS NULL
                    """
                ),
                params,
            )
        except IntegrityError as error:
            sqlstate = getattr(error.orig, "sqlstate", None)
            if sqlstate == "23503":
                raise_api_error(status.HTTP_404_NOT_FOUND, "city_not_found", "City not found")
            raise

    return await get_profile_or_404(connection, current_user_id)
