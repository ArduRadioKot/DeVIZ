"""WebSocket endpoint for real-time chat."""

from collections import defaultdict
from uuid import UUID

from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.db import engine
from app.redis import get_user_id_from_session

router = APIRouter()

_subscribers: dict[str, set[WebSocket]] = defaultdict(set)


async def _auth(token: str) -> str | None:
    return await get_user_id_from_session(token)


@router.websocket("")
async def chat_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = await _auth(token)
    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    await websocket.send_json({"type": "connected", "user_id": user_id})

    subscribed_chats: set[str] = set()

    try:
        while True:
            raw = await websocket.receive_json()

            msg_type = raw.get("type")

            if msg_type == "subscribe":
                chat_id = raw.get("chat_id")
                if chat_id:
                    _subscribers[chat_id].add(websocket)
                    subscribed_chats.add(chat_id)
                    await websocket.send_json({"type": "subscribed", "chat_id": chat_id})

            elif msg_type == "unsubscribe":
                chat_id = raw.get("chat_id")
                if chat_id:
                    _subscribers[chat_id].discard(websocket)
                    subscribed_chats.discard(chat_id)

            elif msg_type == "message":
                chat_id = raw.get("chat_id")
                text_content = raw.get("text", "").strip()
                if not chat_id or not text_content:
                    await websocket.send_json({"type": "error", "message": "chat_id and text are required"})
                    continue

                async with engine.connect() as conn:
                    result = await conn.execute(
                        text(
                            """
                            INSERT INTO messages (chat_id, user_id, text)
                            VALUES (:chat_id, :user_id, :text)
                            RETURNING id, created_at
                            """
                        ),
                        {"chat_id": chat_id, "user_id": user_id, "text": text_content},
                    )
                    await conn.commit()
                    row = result.mappings().one()
                    message_out = {
                        "id": str(row["id"]),
                        "chat_id": chat_id,
                        "user_id": user_id,
                        "text": text_content,
                        "created_at": row["created_at"].isoformat(),
                    }

                payload = {"type": "new_message", "message": message_out}
                dead: list[WebSocket] = []
                for ws in _subscribers.get(chat_id, set()):
                    try:
                        await ws.send_json(payload)
                    except Exception:
                        dead.append(ws)
                for ws in dead:
                    _subscribers[chat_id].discard(ws)

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        for chat_id in subscribed_chats:
            _subscribers[chat_id].discard(websocket)
