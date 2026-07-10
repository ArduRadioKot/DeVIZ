from typing import Annotated
from uuid import UUID

from fastapi import Header, status

from app.api.errors import raise_api_error
from app.redis import get_user_id_from_session


async def get_optional_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> UUID | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        return None
    uid = await get_user_id_from_session(token)
    return UUID(uid) if uid else None


async def get_current_user_id(
    authorization: Annotated[str | None, Header()] = None,
) -> UUID:
    if not authorization or not authorization.startswith("Bearer "):
        raise_api_error(
            status.HTTP_401_UNAUTHORIZED,
            "auth_required",
            "Authorization header with Bearer token is required",
        )

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise_api_error(
            status.HTTP_401_UNAUTHORIZED,
            "auth_required",
            "Authorization header with Bearer token is required",
        )

    uid = await get_user_id_from_session(token)
    if uid is None:
        raise_api_error(
            status.HTTP_401_UNAUTHORIZED,
            "session_expired",
            "Session expired or invalid. Please log in again.",
        )

    return UUID(uid)
