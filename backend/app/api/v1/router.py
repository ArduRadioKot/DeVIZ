from fastapi import APIRouter

from app.api.v1.routes import activities, auth, catalog, chats, cities, friends, me, ws

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(cities.router, prefix="/cities", tags=["cities"])
router.include_router(catalog.router, prefix="/catalog", tags=["catalog"])
router.include_router(me.router, prefix="/me", tags=["me"])
router.include_router(activities.router, prefix="/activities", tags=["activities"])
router.include_router(chats.router, prefix="/chats", tags=["chats"])
router.include_router(friends.router, prefix="/friends", tags=["friends"])
router.include_router(ws.router, prefix="/ws", tags=["ws"])
