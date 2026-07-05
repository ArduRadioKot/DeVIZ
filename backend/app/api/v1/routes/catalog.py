from fastapi import APIRouter

from app.api.v1.schemas import CatalogItem

router = APIRouter()

ACTIVITY_CATEGORIES = [
    CatalogItem(code="sport", title="Спорт"),
    CatalogItem(code="walk", title="Прогулки"),
    CatalogItem(code="board_games", title="Настолки"),
    CatalogItem(code="study", title="Учеба"),
    CatalogItem(code="culture", title="Культура"),
    CatalogItem(code="other", title="Другое"),
]

ACTIVITY_LEVELS = [
    CatalogItem(code="any", title="Любой"),
    CatalogItem(code="beginner", title="Новичок"),
    CatalogItem(code="amateur", title="Любитель"),
    CatalogItem(code="confident", title="Уверенный"),
]


@router.get("/activity-categories", response_model=list[CatalogItem])
async def list_activity_categories() -> list[CatalogItem]:
    return ACTIVITY_CATEGORIES


@router.get("/activity-levels", response_model=list[CatalogItem])
async def list_activity_levels() -> list[CatalogItem]:
    return ACTIVITY_LEVELS
