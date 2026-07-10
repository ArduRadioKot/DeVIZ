from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.pagination import decode_activity_cursor, encode_activity_cursor
from app.api.v1.repositories.activity_repo import activity_list_item_from_row, activity_select
from app.api.v1.schemas import ActivityListItem, Page
from app.db import get_connection

router = APIRouter()


@router.get("", response_model=Page[ActivityListItem])
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
