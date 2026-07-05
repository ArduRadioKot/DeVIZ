from fastapi import APIRouter

from app.api.v1.routes import activities, catalog, cities, me

router = APIRouter()
router.include_router(cities.router, prefix="/cities", tags=["cities"])
router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
router.include_router(me.router, prefix="/me", tags=["me"])
router.include_router(activities.router, prefix="/activities", tags=["activities"])
