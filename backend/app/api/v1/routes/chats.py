from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.schemas import (
    ChatBrief,
    ChatCreate,
    ChatDetail,
    MessageOut,
    MessageSend,
    Participant,
    UserBrief,
)
from app.db import get_connection

router = APIRouter()


@router.get("", response_model=list[ChatBrief])
async def list_chats(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[ChatBrief]:
    result = await connection.execute(
        text(
            """
            SELECT c.id, c.type, c.name, c.event_id, c.created_at,
                   (SELECT count(*) FROM chat_members cm WHERE cm.chat_id = c.id) AS member_count,
                   m.text AS last_message,
                   m.created_at AS last_message_at,
                   (SELECT count(*) FROM messages um
                    JOIN chat_members ucm ON ucm.chat_id = um.chat_id AND ucm.user_id = :uid
                    WHERE um.chat_id = c.id AND um.created_at > COALESCE(ucm.joined_at, '1970-01-01')
                   ) AS unread_count
            FROM chats c
            JOIN chat_members cm ON cm.chat_id = c.id
            LEFT JOIN LATERAL (
                SELECT text, created_at FROM messages
                WHERE chat_id = c.id
                ORDER BY created_at DESC
                LIMIT 1
            ) m ON true
            WHERE cm.user_id = :uid AND c.deleted_at IS NULL
            ORDER BY m.created_at DESC NULLS LAST, c.created_at DESC
            """
        ),
        {"uid": current_user_id},
    )
    return [
        ChatBrief(
            id=row["id"],
            type=row["type"],
            name=row["name"],
            event_id=row["event_id"],
            last_message=row["last_message"],
            last_message_at=row["last_message_at"],
            unread_count=row["unread_count"],
            member_count=row["member_count"],
            created_at=row["created_at"],
        )
        for row in result.mappings()
    ]


@router.get("/{chat_id}", response_model=ChatDetail)
async def get_chat(
    chat_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ChatDetail:
    result = await connection.execute(
        text(
            """
            SELECT c.id, c.type, c.name, c.event_id, c.created_at,
                   (SELECT count(*) FROM chat_members cm WHERE cm.chat_id = c.id) AS member_count
            FROM chats c
            JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = :uid
            WHERE c.id = :chat_id AND c.deleted_at IS NULL
            """
        ),
        {"chat_id": chat_id, "uid": current_user_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "chat_not_found", "Chat not found")

    members_result = await connection.execute(
        text(
            """
            SELECT cm.user_id, cm.role, cm.joined_at, u.name, u.avatar_url
            FROM chat_members cm
            JOIN users u ON u.id = cm.user_id
            WHERE cm.chat_id = :chat_id
            ORDER BY cm.joined_at ASC
            """
        ),
        {"chat_id": chat_id},
    )

    members = [
        Participant(
            user=UserBrief(id=m["user_id"], name=m["name"], avatar_url=m["avatar_url"]),
            role=m["role"] if m["role"] == "organizer" else "participant",
            joined_at=m["joined_at"],
        )
        for m in members_result.mappings()
    ]

    return ChatDetail(
        id=row["id"],
        type=row["type"],
        name=row["name"],
        event_id=row["event_id"],
        member_count=row["member_count"],
        members=members,
        created_at=row["created_at"],
    )


@router.post("", response_model=ChatBrief, status_code=status.HTTP_201_CREATED)
async def create_chat(
    payload: ChatCreate,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ChatBrief:
    all_ids = list(set(payload.member_ids) | {current_user_id})

    result = await connection.execute(
        text(
            """
            INSERT INTO chats (type, name)
            VALUES (:type, :name)
            RETURNING id, created_at
            """
        ),
        {"type": payload.type, "name": payload.name},
    )
    chat = result.mappings().one()

    for uid in all_ids:
        role = "admin" if uid == current_user_id else "member"
        await connection.execute(
            text(
                """
                INSERT INTO chat_members (chat_id, user_id, role)
                VALUES (:chat_id, :user_id, :role)
                ON CONFLICT (chat_id, user_id) DO NOTHING
                """
            ),
            {"chat_id": chat["id"], "user_id": uid, "role": role},
        )

    return ChatBrief(
        id=chat["id"],
        type=payload.type,
        name=payload.name,
        event_id=None,
        member_count=len(all_ids),
        created_at=chat["created_at"],
    )


@router.get("/{chat_id}/messages", response_model=list[MessageOut])
async def list_messages(
    chat_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    before: UUID | None = None,
) -> list[MessageOut]:
    membership = await connection.execute(
        text(
            "SELECT 1 FROM chat_members WHERE chat_id = :chat_id AND user_id = :uid"
        ),
        {"chat_id": chat_id, "uid": current_user_id},
    )
    if membership.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "chat_not_found", "Chat not found")

    conditions = ["m.chat_id = :chat_id"]
    params: dict = {"chat_id": chat_id, "limit": limit}
    if before is not None:
        conditions.append("m.id < :before")
        params["before"] = before

    result = await connection.execute(
        text(
            f"""
            SELECT m.id, m.chat_id, m.user_id, m.text, m.created_at,
                   u.name, u.avatar_url
            FROM messages m
            JOIN users u ON u.id = m.user_id
            WHERE {' AND '.join(conditions)}
            ORDER BY m.created_at DESC
            LIMIT :limit
            """
        ),
        params,
    )
    rows = list(result.mappings())
    rows.reverse()

    return [
        MessageOut(
            id=row["id"],
            chat_id=row["chat_id"],
            user=UserBrief(id=row["user_id"], name=row["name"], avatar_url=row["avatar_url"]),
            text=row["text"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@router.post("/{chat_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    chat_id: UUID,
    payload: MessageSend,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> MessageOut:
    membership = await connection.execute(
        text(
            "SELECT 1 FROM chat_members WHERE chat_id = :chat_id AND user_id = :uid"
        ),
        {"chat_id": chat_id, "uid": current_user_id},
    )
    if membership.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "chat_not_found", "Chat not found")

    result = await connection.execute(
        text(
            """
            INSERT INTO messages (chat_id, user_id, text)
            VALUES (:chat_id, :user_id, :text)
            RETURNING id, created_at
            """
        ),
        {"chat_id": chat_id, "user_id": current_user_id, "text": payload.text},
    )
    msg = result.mappings().one()

    user_result = await connection.execute(
        text("SELECT id, name, avatar_url FROM users WHERE id = :uid"),
        {"uid": current_user_id},
    )
    user = user_result.mappings().one()

    return MessageOut(
        id=msg["id"],
        chat_id=chat_id,
        user=UserBrief(id=user["id"], name=user["name"], avatar_url=user["avatar_url"]),
        text=payload.text,
        created_at=msg["created_at"],
    )


@router.delete("/{chat_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    chat_id: UUID,
    user_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    chat = await connection.execute(
        text(
            "SELECT type FROM chats WHERE id = :chat_id AND deleted_at IS NULL"
        ),
        {"chat_id": chat_id},
    )
    chat_row = chat.mappings().one_or_none()
    if chat_row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "chat_not_found", "Chat not found")

    if chat_row["type"] == "event":
        raise_api_error(status.HTTP_403_FORBIDDEN, "cannot_remove_from_event_chat", "Cannot remove members from event chats")

    is_admin = await connection.execute(
        text(
            "SELECT 1 FROM chat_members WHERE chat_id = :chat_id AND user_id = :uid AND role = 'admin'"
        ),
        {"chat_id": chat_id, "uid": current_user_id},
    )
    if current_user_id != user_id and is_admin.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_403_FORBIDDEN, "not_admin", "Only admins can remove members")

    await connection.execute(
        text(
            "DELETE FROM chat_members WHERE chat_id = :chat_id AND user_id = :user_id"
        ),
        {"chat_id": chat_id, "user_id": user_id},
    )
