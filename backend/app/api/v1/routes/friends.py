from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from sqlalchemy.exc import IntegrityError

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.schemas import Friend, FriendRequest, UserBrief
from app.db import get_connection

router = APIRouter()


@router.get("", response_model=list[Friend])
async def list_friends(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[Friend]:
    result = await connection.execute(
        text(
            """
            SELECT f.friend_id AS id, u.name, u.avatar_url, f.created_at,
                   (SELECT count(*) FROM activity_participants ap
                    JOIN activity_participants ap2 ON ap.activity_id = ap2.activity_id
                    WHERE ap.user_id = f.friend_id AND ap2.user_id = :uid
                   ) AS mutual_events
            FROM friends f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = :uid AND u.deleted_at IS NULL
            ORDER BY f.created_at DESC
            """
        ),
        {"uid": current_user_id},
    )
    return [
        Friend(
            id=row["id"],
            name=row["name"],
            avatar_url=row["avatar_url"],
            mutual_events=row["mutual_events"],
            created_at=row["created_at"],
        )
        for row in result.mappings()
    ]


@router.post("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_friend(
    user_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    if user_id == current_user_id:
        raise_api_error(status.HTTP_400_BAD_REQUEST, "cannot_friend_self", "Cannot add yourself as friend")

    user = await connection.execute(
        text("SELECT 1 FROM users WHERE id = :uid AND deleted_at IS NULL"),
        {"uid": user_id},
    )
    if user.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "user_not_found", "User not found")

    await connection.execute(
        text(
            """
            INSERT INTO friends (user_id, friend_id)
            VALUES (:uid, :fid), (:fid, :uid)
            ON CONFLICT DO NOTHING
            """
        ),
        {"uid": current_user_id, "fid": user_id},
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(
    user_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    await connection.execute(
        text(
            """
            DELETE FROM friends
            WHERE (user_id = :uid AND friend_id = :fid)
               OR (user_id = :fid AND friend_id = :uid)
            """
        ),
        {"uid": current_user_id, "fid": user_id},
    )


@router.get("/requests", response_model=list[FriendRequest])
async def list_friend_requests(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[FriendRequest]:
    result = await connection.execute(
        text(
            """
            SELECT fr.id, fr.from_user_id, fr.to_user_id, fr.status, fr.created_at,
                   u.name, u.avatar_url
            FROM friend_requests fr
            JOIN users u ON u.id = fr.from_user_id
            WHERE fr.to_user_id = :uid AND fr.status = 'pending'
            ORDER BY fr.created_at DESC
            """
        ),
        {"uid": current_user_id},
    )
    return [
        FriendRequest(
            id=row["id"],
            user=UserBrief(id=row["from_user_id"], name=row["name"], avatar_url=row["avatar_url"]),
            status=row["status"],
            created_at=row["created_at"],
        )
        for row in result.mappings()
    ]


@router.post("/requests/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def send_friend_request(
    user_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    if user_id == current_user_id:
        raise_api_error(status.HTTP_400_BAD_REQUEST, "cannot_friend_self", "Cannot send request to yourself")

    existing = await connection.execute(
        text(
            """
            SELECT 1 FROM friends
            WHERE (user_id = :uid AND friend_id = :fid)
               OR (user_id = :fid AND friend_id = :uid)
            """
        ),
        {"uid": current_user_id, "fid": user_id},
    )
    if existing.scalar_one_or_none() is not None:
        raise_api_error(status.HTTP_409_CONFLICT, "already_friends", "Already friends")

    try:
        await connection.execute(
            text(
                """
                INSERT INTO friend_requests (from_user_id, to_user_id, status)
                VALUES (:from_id, :to_id, 'pending')
                """
            ),
            {"from_id": current_user_id, "to_id": user_id},
        )
    except IntegrityError:
        raise_api_error(status.HTTP_409_CONFLICT, "request_exists", "Friend request already exists")


@router.post("/requests/{user_id}/accept", status_code=status.HTTP_204_NO_CONTENT)
async def accept_friend_request(
    user_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    result = await connection.execute(
        text(
            """
            UPDATE friend_requests
            SET status = 'accepted', updated_at = now()
            WHERE from_user_id = :from_id
              AND to_user_id = :to_id
              AND status = 'pending'
            RETURNING id
            """
        ),
        {"from_id": user_id, "to_id": current_user_id},
    )
    if result.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "request_not_found", "Friend request not found")

    await connection.execute(
        text(
            """
            INSERT INTO friends (user_id, friend_id)
            VALUES (:uid, :fid), (:fid, :uid)
            ON CONFLICT DO NOTHING
            """
        ),
        {"uid": current_user_id, "fid": user_id},
    )


@router.post("/requests/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_friend_request(
    user_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    result = await connection.execute(
        text(
            """
            UPDATE friend_requests
            SET status = 'rejected', updated_at = now()
            WHERE from_user_id = :from_id
              AND to_user_id = :to_id
              AND status = 'pending'
            RETURNING id
            """
        ),
        {"from_id": user_id, "to_id": current_user_id},
    )
    if result.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "request_not_found", "Friend request not found")
