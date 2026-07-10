from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncConnection, create_async_engine

from app.core.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)


async def get_connection() -> AsyncIterator[AsyncConnection]:
    async with engine.begin() as connection:
        yield connection
