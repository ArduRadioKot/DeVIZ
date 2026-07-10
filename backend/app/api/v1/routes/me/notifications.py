from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.schemas import Notification, Page, ReadAllNotificationsResult
from app.db import get_connection

router = APIRouter()


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


@router.get("", response_model=Page[Notification])
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


@router.post("/{notification_id}/read", response_model=Notification)
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


@router.post("/read-all", response_model=ReadAllNotificationsResult)
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
