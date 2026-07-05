from fastapi import FastAPI

from app.api.errors import APIError, api_error_handler
from app.api.router import api_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Dvizh API",
        version="0.1.0",
        openapi_tags=[
            {"name": "system", "description": "Service health and metadata."},
            {"name": "cities", "description": "Cities and geo entry points."},
            {"name": "catalog", "description": "Static product dictionaries."},
            {"name": "me", "description": "Current user profile and mobile state."},
            {"name": "activities", "description": "Activity feed, details, and participation."},
            {"name": "notifications", "description": "Current user notifications."},
            {"name": "devices", "description": "Current user mobile devices and push tokens."},
        ],
    )

    app.add_exception_handler(APIError, api_error_handler)

    @app.get("/", tags=["system"])
    async def read_root() -> dict[str, str]:
        return {"message": "Dvizh API"}

    @app.get("/health", tags=["system"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(api_router, prefix="/api")
    return app


app = create_app()
