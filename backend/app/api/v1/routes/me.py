from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.pagination import decode_activity_cursor, encode_activity_cursor
from app.api.v1.routes.activities import activity_list_item_from_row, activity_select
from app.api.v1.schemas import (
    ActivityListItem,
    CityBrief,
    Device,
    DeviceRegister,
    MeProfile,
    MeUpdate,
    Notification,
    Page,
    ReadAllNotificationsResult,
)
from app.db import get_connection

router = APIRouter()


def profile_from_row(row: dict) -> MeProfile:
    city = None
    if row["city_id"] is not None:
        city = CityBrief(
            id=row["city_id"],
            name=row["city_name"],
            region=row["city_region"],
            timezone=row["city_timezone"],
        )

    return MeProfile(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        avatar_url=row["avatar_url"],
        city=city,
        timezone=row["timezone"],
    )


def notification_from_row(row: dict) -> Notification:
    return Notification(
        id=row["id"],
        type=row["type"],
        title=row["title"],
        body=row["body"],
        activity_id=row["activity_id"],
        payload=row["payload"],
        read_at=row["read_at"],
        created_at=row["created_at"],
    )


def device_from_row(row: dict) -> Device:
    return Device(
        id=row["id"],
        platform=row["platform"],
        device_name=row["device_name"],
        app_version=row["app_version"],
        last_seen_at=row["last_seen_at"],
        created_at=row["created_at"],
    )


async def get_profile_or_404(connection: AsyncConnection, user_id: UUID) -> MeProfile:
    result = await connection.execute(
        text(
            """
            SELECT u.id,
                   u.email,
                   u.name,
                   u.avatar_url,
                   u.timezone,
                   c.id AS city_id,
                   c.name AS city_name,
                   c.region AS city_region,
                   c.timezone AS city_timezone
            FROM users u
            LEFT JOIN cities c ON c.id = u.city_id
            WHERE u.id = :user_id
              AND u.deleted_at IS NULL
            """
        ),
        {"user_id": user_id},
    )
    row = result.mappings().one_or_none()

    if row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "user_not_found", "User not found")

    return profile_from_row(row)


@router.get("", response_model=MeProfile)
async def get_me(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> MeProfile:
    return await get_profile_or_404(connection, current_user_id)


@router.patch("", response_model=MeProfile)
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


@router.get("/activities", response_model=Page[ActivityListItem])
async def list_my_activities(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    role: Literal["organizer", "participant"] | None = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 30,
    cursor: str | None = None,
) -> Page[ActivityListItem]:
    conditions = ["a.deleted_at IS NULL"]
    params: dict[str, object] = {
        "viewer_user_id": current_user_id,
        "current_user_id": current_user_id,
        "limit": limit + 1,
    }

    if role == "organizer":
        conditions.append("a.organizer_id = :current_user_id")
    elif role == "participant":
        conditions.append(
            """
            EXISTS (
                SELECT 1
                FROM activity_participants ap
                WHERE ap.activity_id = a.id
                  AND ap.user_id = :current_user_id
                  AND ap.role = 'participant'
            )
            """
        )
    else:
        conditions.append(
            """
            EXISTS (
                SELECT 1
                FROM activity_participants ap
                WHERE ap.activity_id = a.id
                  AND ap.user_id = :current_user_id
            )
            """
        )

    if cursor is not None:
        try:
            cursor_starts_at, cursor_id = decode_activity_cursor(cursor)
        except (ValueError, KeyError, TypeError):
            raise_api_error(status.HTTP_400_BAD_REQUEST, "invalid_cursor", "Invalid cursor")

        conditions.append("(a.start_at > :cursor_starts_at OR (a.start_at = :cursor_starts_at AND a.id > :cursor_id))")
        params["cursor_starts_at"] = cursor_starts_at
        params["cursor_id"] = cursor_id

    result = await connection.execute(
        text(
            f"""
            {activity_select()}
            WHERE {' AND '.join(conditions)}
            ORDER BY a.start_at ASC, a.id ASC
            LIMIT :limit
            """
        ),
        params,
    )
    rows = list(result.mappings())
    items = [activity_list_item_from_row(row, current_user_id) for row in rows[:limit]]
    next_cursor = encode_activity_cursor(items[-1].starts_at, items[-1].id) if len(rows) > limit and items else None

    return Page(items=items, next_cursor=next_cursor)


@router.get("/notifications", response_model=Page[Notification])
async def list_notifications(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    limit: Annotated[int, Query(ge=1, le=100)] = 30,
    cursor: UUID | None = None,
) -> Page[Notification]:
    conditions = ["user_id = :user_id"]
    params: dict[str, object] = {"user_id": current_user_id, "limit": limit + 1}

    if cursor is not None:
        conditions.append("id < :cursor")
        params["cursor"] = cursor

    result = await connection.execute(
        text(
            f"""
            SELECT id,
                   user_id,
                   activity_id,
                   type,
                   title,
                   body,
                   payload,
                   read_at,
                   created_at
            FROM notifications
            WHERE {' AND '.join(conditions)}
            ORDER BY id DESC
            LIMIT :limit
            """
        ),
        params,
    )
    rows = list(result.mappings())
    items = [notification_from_row(row) for row in rows[:limit]]
    next_cursor = str(items[-1].id) if len(rows) > limit and items else None

    return Page(items=items, next_cursor=next_cursor)


@router.post("/notifications/{notification_id}/read", response_model=Notification)
async def read_notification(
    notification_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> Notification:
    result = await connection.execute(
        text(
            """
            UPDATE notifications
            SET read_at = COALESCE(read_at, now())
            WHERE id = :notification_id
              AND user_id = :user_id
            RETURNING id,
                      user_id,
                      activity_id,
                      type,
                      title,
                      body,
                      payload,
                      read_at,
                      created_at
            """
        ),
        {"notification_id": notification_id, "user_id": current_user_id},
    )
    row = result.mappings().one_or_none()

    if row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "notification_not_found", "Notification not found")

    return notification_from_row(row)


@router.post("/notifications/read-all", response_model=ReadAllNotificationsResult)
async def read_all_notifications(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ReadAllNotificationsResult:
    result = await connection.execute(
        text(
            """
            WITH updated AS (
                UPDATE notifications
                SET read_at = now()
                WHERE user_id = :user_id
                  AND read_at IS NULL
                  AND created_at <= now()
                RETURNING id
            )
            SELECT (SELECT count(*) FROM updated) AS updated_count,
                   (
                       SELECT count(*)
                       FROM notifications
                       WHERE user_id = :user_id
                         AND read_at IS NULL
                   ) AS unread_count
            """
        ),
        {"user_id": current_user_id},
    )
    row = result.mappings().one()

    return ReadAllNotificationsResult(
        updated_count=row["updated_count"],
        unread_count=row["unread_count"],
    )


@router.get("/devices", response_model=list[Device])
async def list_devices(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[Device]:
    result = await connection.execute(
        text(
            """
            SELECT id,
                   platform,
                   device_name,
                   app_version,
                   last_seen_at,
                   created_at
            FROM user_devices
            WHERE user_id = :user_id
              AND deleted_at IS NULL
            ORDER BY last_seen_at DESC, id DESC
            """
        ),
        {"user_id": current_user_id},
    )

    return [device_from_row(row) for row in result.mappings()]


@router.post("/devices", response_model=Device, status_code=status.HTTP_201_CREATED)
async def register_device(
    payload: DeviceRegister,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> Device:
    result = await connection.execute(
        text(
            """
            INSERT INTO user_devices (
                user_id,
                platform,
                push_token,
                device_name,
                app_version
            )
            VALUES (
                :user_id,
                :platform,
                :push_token,
                :device_name,
                :app_version
            )
            ON CONFLICT (push_token) WHERE deleted_at IS NULL
            DO UPDATE SET user_id = EXCLUDED.user_id,
                          platform = EXCLUDED.platform,
                          device_name = EXCLUDED.device_name,
                          app_version = EXCLUDED.app_version,
                          last_seen_at = now(),
                          updated_at = now()
            RETURNING id,
                      platform,
                      device_name,
                      app_version,
                      last_seen_at,
                      created_at
            """
        ),
        {
            "user_id": current_user_id,
            "platform": payload.platform,
            "push_token": payload.push_token,
            "device_name": payload.device_name,
            "app_version": payload.app_version,
        },
    )

    return device_from_row(result.mappings().one())


@router.delete("/devices/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    result = await connection.execute(
        text(
            """
            UPDATE user_devices
            SET deleted_at = now(),
                updated_at = now()
            WHERE id = :device_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            RETURNING id
            """
        ),
        {"device_id": device_id, "user_id": current_user_id},
    )

    if result.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "device_not_found", "Device not found")
