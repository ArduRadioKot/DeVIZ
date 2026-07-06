from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.errors import APIError, api_error_handler
from app.api.router import api_router
from app.redis import close_redis


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await close_redis()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Dvizh API",
        version="0.1.0",
        lifespan=lifespan,
        openapi_tags=[
            {"name": "system", "description": "Service health and metadata."},
            {"name": "auth", "description": "Registration, login, and token-based auth."},
            {"name": "cities", "description": "Cities and geo entry points."},
            {"name": "catalog", "description": "Static product dictionaries."},
            {"name": "me", "description": "Current user profile and mobile state."},
            {"name": "activities", "description": "Activity feed, details, and participation."},
            {"name": "chats", "description": "Event and direct messaging."},
            {"name": "friends", "description": "Social graph and friend requests."},
            {"name": "notifications", "description": "Current user notifications."},
            {"name": "devices", "description": "Current user mobile devices and push tokens."},
        ],
    )

    app.add_exception_handler(APIError, api_error_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_origin_regex=r"^(https?://localhost(:\d+)?|https?://127\.0\.0\.1(:\d+)?|https://[a-zA-Z0-9-]+\.hubnear\.app)$",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
        expose_headers=["X-RateLimit-Remaining", "X-RateLimit-Reset"],
        max_age=600,
    )

    @app.middleware("http")
    async def security_headers_middleware(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={"code": "internal_error", "message": "An unexpected error occurred"},
        )

    @app.get("/", tags=["system"])
    async def read_root() -> dict[str, str]:
        return {"message": "Dvizh API"}

    @app.get("/health", tags=["system"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(api_router, prefix="/api")
    return app


app = create_app()
