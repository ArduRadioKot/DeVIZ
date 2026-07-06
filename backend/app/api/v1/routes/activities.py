from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id, get_optional_user_id
from app.api.v1.repositories.activity_repo import (
    cancel_activity,
    create_activity,
    get_activity_or_404,
    join_activity,
    leave_activity,
    list_activities,
    list_participants,
    update_activity,
)
from app.api.v1.schemas import (
    ActivityCreate,
    ActivityDetail,
    ActivityListItem,
    ActivityStatus,
    Page,
    Participant,
)
from app.db import get_connection

router = APIRouter()


@router.get("", response_model=Page[ActivityListItem])
async def list_activities_route(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    viewer_user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
    city_id: UUID | None = None,
    category: Annotated[str | None, Query(min_length=2, max_length=60)] = None,
    status_filter: Annotated[ActivityStatus | None, Query(alias="status")] = None,
    search: Annotated[str | None, Query(min_length=2, max_length=200)] = None,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lon: Annotated[float | None, Query(ge=-180, le=180)] = None,
    radius_m: Annotated[int | None, Query(ge=100, le=100_000)] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 30,
    cursor: str | None = None,
) -> Page[ActivityListItem]:
    if (lat is None) != (lon is None):
        raise_api_error(status.HTTP_400_BAD_REQUEST, "geo_point_required", "lat and lon must be provided together")

    return await list_activities(
        connection=connection,
        viewer_user_id=viewer_user_id,
        limit=limit,
        cursor=cursor,
        city_id=city_id,
        category=category,
        status_filter=status_filter,
        search=search,
        lat=lat,
        lon=lon,
        radius_m=radius_m,
    )


@router.post("", response_model=ActivityDetail, status_code=status.HTTP_201_CREATED)
async def create_activity_route(
    payload: ActivityCreate,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ActivityDetail:
    return await create_activity(connection, payload, current_user_id)


@router.get("/{activity_id}", response_model=ActivityDetail)
async def get_activity_route(
    activity_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    viewer_user_id: Annotated[UUID | None, Depends(get_optional_user_id)],
) -> ActivityDetail:
    return await get_activity_or_404(connection, activity_id, viewer_user_id)


@router.patch("/{activity_id}", response_model=ActivityDetail)
async def update_activity_route(
    activity_id: UUID,
    payload: ActivityCreate,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ActivityDetail:
    return await update_activity(connection, activity_id, payload, current_user_id)


@router.get("/{activity_id}/participants", response_model=list[Participant])
async def list_participants_route(
    activity_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
) -> list[Participant]:
    await get_activity_or_404(connection, activity_id, None)
    return await list_participants(connection, activity_id)


@router.post("/{activity_id}/join", response_model=ActivityDetail)
async def join_activity_route(
    activity_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ActivityDetail:
    return await join_activity(connection, activity_id, current_user_id)


@router.post("/{activity_id}/leave", response_model=ActivityDetail)
async def leave_activity_route(
    activity_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ActivityDetail:
    return await leave_activity(connection, activity_id, current_user_id)


@router.post("/{activity_id}/cancel", response_model=ActivityDetail)
async def cancel_activity_route(
    activity_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ActivityDetail:
    return await cancel_activity(connection, activity_id, current_user_id)
