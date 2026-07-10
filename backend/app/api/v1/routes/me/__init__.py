from fastapi import APIRouter

from app.api.v1.routes.me import devices, my_activities, notifications, places, profile

router = APIRouter()
router.include_router(profile.router, prefix="", tags=["me"])
router.include_router(my_activities.router, prefix="/activities", tags=["me"])
router.include_router(notifications.router, prefix="/notifications", tags=["me"])
router.include_router(devices.router, prefix="/devices", tags=["me"])
router.include_router(places.router, prefix="/places", tags=["me"])
