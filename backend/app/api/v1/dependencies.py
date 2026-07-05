from typing import Annotated
from uuid import UUID

from fastapi import Header, status

from app.api.errors import raise_api_error


def get_optional_user_id(
    user_id: Annotated[UUID | None, Header(alias="X-User-Id")] = None,
) -> UUID | None:
    return user_id


def get_current_user_id(
    user_id: Annotated[UUID | None, Header(alias="X-User-Id")] = None,
) -> UUID:
    if user_id is None:
        raise_api_error(
            status.HTTP_401_UNAUTHORIZED,
            "auth_required",
            "X-User-Id header is required until auth is implemented",
        )

    return user_id
