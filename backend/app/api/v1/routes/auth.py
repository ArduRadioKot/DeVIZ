from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request, status
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.schemas import (
    AuthLogin,
    AuthRegister,
    AuthToken,
    MeProfile,
    PasswordChange,
)
from app.db import get_connection
from app.redis import (
    create_session,
    delete_all_user_sessions,
    delete_session,
    get_user_id_from_session,
    rate_limiter,
)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def _get_profile(connection: AsyncConnection, user_id: UUID) -> MeProfile:
    from app.api.v1.repositories.user_repo import get_user_profile

    return await get_user_profile(connection, user_id)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    payload: AuthRegister,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    request: Request,
) -> dict:
    ip = _get_client_ip(request)
    allowed, _ = await rate_limiter.check(f"register:ip:{ip}", max_attempts=3, window=3600)
    if not allowed:
        raise_api_error(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "rate_limit_exceeded",
            "Too many registration attempts. Try again later.",
        )

    existing = await connection.execute(
        text("SELECT id FROM users WHERE lower(email) = lower(:email) AND deleted_at IS NULL"),
        {"email": payload.email},
    )
    if existing.scalar_one_or_none() is not None:
        return {"message": "If the email is available, you will receive a confirmation."}

    password_hash = pwd_context.hash(payload.password)

    result = await connection.execute(
        text(
            """
            INSERT INTO users (email, password_hash, name, city_id, timezone)
            VALUES (:email, :password_hash, :name, :city_id, :timezone)
            RETURNING id
            """
        ),
        {
            "email": payload.email,
            "password_hash": password_hash,
            "name": payload.name,
            "city_id": payload.city_id,
            "timezone": payload.timezone,
        },
    )
    user_id = result.scalar_one()

    profile = await _get_profile(connection, user_id)
    token = await create_session(str(user_id))

    return AuthToken(token=token, user=profile).model_dump()


@router.post("/login", response_model=AuthToken)
async def login(
    payload: AuthLogin,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    request: Request,
) -> AuthToken:
    ip = _get_client_ip(request)
    allowed, remaining = await rate_limiter.check(f"login:ip:{ip}", max_attempts=20)
    if not allowed:
        raise_api_error(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "rate_limit_exceeded",
            "Too many login attempts. Try again later.",
        )

    result = await connection.execute(
        text(
            """
            SELECT u.id, u.password_hash
            FROM users u
            WHERE lower(u.email) = lower(:email) AND u.deleted_at IS NULL
            """
        ),
        {"email": payload.email},
    )
    row = result.mappings().one_or_none()

    if row is None or not pwd_context.verify(payload.password, row["password_hash"]):
        raise_api_error(
            status.HTTP_401_UNAUTHORIZED,
            "invalid_credentials",
            "Invalid email or password",
        )

    user_id = row["id"]
    profile = await _get_profile(connection, user_id)
    token = await create_session(str(user_id))

    return AuthToken(token=token, user=profile)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        await delete_session(token)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    await delete_all_user_sessions(str(current_user_id))


@router.get("/verify", response_model=MeProfile)
async def verify_token(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> MeProfile:
    return await _get_profile(connection, current_user_id)


@router.get("/me", response_model=MeProfile)
async def get_me_token(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> MeProfile:
    return await _get_profile(connection, current_user_id)


@router.post("/password-change", response_model=MeProfile)
async def change_password(
    payload: PasswordChange,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    request: Request,
) -> MeProfile:
    ip = _get_client_ip(request)
    allowed, _ = await rate_limiter.check(
        f"password:ip:{ip}", max_attempts=5, window=900
    )
    if not allowed:
        raise_api_error(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "rate_limit_exceeded",
            "Too many password change attempts. Try again later.",
        )
    result = await connection.execute(
        text("SELECT password_hash FROM users WHERE id = :uid AND deleted_at IS NULL"),
        {"uid": current_user_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "user_not_found", "User not found")

    if not pwd_context.verify(payload.current_password, row["password_hash"]):
        raise_api_error(
            status.HTTP_401_UNAUTHORIZED,
            "invalid_password",
            "Current password is incorrect",
        )

    password_hash = pwd_context.hash(payload.new_password)
    await connection.execute(
        text("UPDATE users SET password_hash = :hash, updated_at = now() WHERE id = :uid"),
        {"hash": password_hash, "uid": current_user_id},
    )

    return await _get_profile(connection, current_user_id)
