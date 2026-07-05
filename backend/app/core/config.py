import os

from sqlalchemy.engine import URL


def build_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    return URL.create(
        "postgresql+psycopg",
        username=os.getenv("POSTGRES_USER", "dvizh"),
        password=os.getenv("POSTGRES_PASSWORD", "dvizh"),
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", "5432")),
        database=os.getenv("POSTGRES_DB", "dvizh"),
    ).render_as_string(hide_password=False)


def build_redis_url() -> str:
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        return redis_url

    host = os.getenv("REDIS_HOST", "localhost")
    port = os.getenv("REDIS_PORT", "6379")
    database = os.getenv("REDIS_DB", "0")
    return f"redis://{host}:{port}/{database}"


DATABASE_URL = build_database_url()
REDIS_URL = build_redis_url()
