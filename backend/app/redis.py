import os
import secrets
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from redis.asyncio import Redis as AsyncRedis

from app.core.config import REDIS_URL

_redis: AsyncRedis | None = None


def get_redis() -> AsyncRedis:
    global _redis
    if _redis is None:
        _redis = AsyncRedis.from_url(REDIS_URL, decode_responses=True)
    return _redis


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


SESSION_PREFIX = "session:"
SESSION_USER_INDEX_PREFIX = "sessions:user:"
RATE_LIMIT_PREFIX = "ratelimit:"
TTL = 60 * 60 * 24  # 24 hours


async def create_session(user_id: str) -> str:
    """Create a new session token for the given user."""
    r = get_redis()
    token = secrets.token_hex(32)

    pipe = r.pipeline()
    pipe.setex(f"{SESSION_PREFIX}{token}", TTL, user_id)
    pipe.sadd(f"{SESSION_USER_INDEX_PREFIX}{user_id}", token)
    await pipe.execute()

    return token


async def get_user_id_from_session(token: str) -> str | None:
    """Get the user ID associated with a session token, with sliding expiration."""
    r = get_redis()
    key = f"{SESSION_PREFIX}{token}"
    user_id = await r.get(key)
    if user_id:
        await r.expire(key, TTL)
    return user_id


async def delete_session(token: str) -> None:
    """Delete a single session token."""
    r = get_redis()
    key = f"{SESSION_PREFIX}{token}"
    user_id = await r.get(key)
    if user_id:
        pipe = r.pipeline()
        pipe.delete(key)
        pipe.srem(f"{SESSION_USER_INDEX_PREFIX}{user_id}", token)
        await pipe.execute()


async def delete_all_user_sessions(user_id: str) -> int:
    """Delete all sessions for a given user. Returns the number of sessions deleted."""
    r = get_redis()
    index_key = f"{SESSION_USER_INDEX_PREFIX}{user_id}"
    tokens = await r.smembers(index_key)

    if not tokens:
        return 0

    pipe = r.pipeline()
    for token in tokens:
        pipe.delete(f"{SESSION_PREFIX}{token}")
    pipe.delete(index_key)
    await pipe.execute()

    return len(tokens)


class RateLimiter:
    window_seconds: int = 900  # 15 minutes

    async def check(
        self,
        key: str,
        max_attempts: int,
        window: int | None = None,
    ) -> tuple[bool, int]:
        """Check if action is allowed. Returns (allowed, remaining_attempts)."""
        r = get_redis()
        window = window or self.window_seconds
        redis_key = f"{RATE_LIMIT_PREFIX}{key}"

        current = await r.get(redis_key)
        if current is None:
            await r.setex(redis_key, window, 1)
            return True, max_attempts - 1

        count = int(current)
        if count >= max_attempts:
            ttl = await r.ttl(redis_key)
            return False, 0

        await r.incr(redis_key)
        return True, max_attempts - count - 1

    async def get_remaining(self, key: str, max_attempts: int) -> tuple[int, int]:
        """Get (remaining_attempts, ttl_in_seconds)."""
        r = get_redis()
        redis_key = f"{RATE_LIMIT_PREFIX}{key}"
        current = await r.get(redis_key)
        if current is None:
            return max_attempts, 0
        ttl = await r.ttl(redis_key)
        return max(0, max_attempts - int(current)), max(0, ttl)


rate_limiter = RateLimiter()
