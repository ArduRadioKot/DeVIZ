from datetime import datetime
from typing import Generic, Literal, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

ActivityLevel = Literal["any", "beginner", "amateur", "confident"]
ActivityStatus = Literal["open", "confirmed", "full", "cancelled", "expired", "completed"]
DevicePlatform = Literal["ios", "android", "web"]
ViewerBlockReason = Literal[
    "auth_required",
    "already_joined",
    "activity_closed",
    "deadline_passed",
    "activity_full",
]

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None = None


class GeoPoint(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class Price(BaseModel):
    amount: int = Field(ge=0)
    currency: Literal["RUB"] = "RUB"


class CityBrief(BaseModel):
    id: UUID
    name: str
    region: str | None
    timezone: str


class City(CityBrief):
    country_code: str
    center: GeoPoint


class UserBrief(BaseModel):
    id: UUID
    name: str
    avatar_url: str | None


class ActivityParticipantsSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    count: int
    minimum: int = Field(alias="min")
    limit: int


class ActivityViewerState(BaseModel):
    is_participant: bool
    role: Literal["organizer", "participant"] | None
    can_join: bool
    join_block_reason: ViewerBlockReason | None


class ActivityListItem(BaseModel):
    id: UUID
    title: str
    category: str
    level: ActivityLevel
    city: CityBrief
    address: str
    location: GeoPoint
    distance_m: int | None = None
    starts_at: datetime
    join_deadline: datetime
    participants: ActivityParticipantsSummary
    status: ActivityStatus
    price: Price | None
    viewer: ActivityViewerState


class ActivityDetail(ActivityListItem):
    organizer: UserBrief
    description: str | None
    timezone: str
    duration_minutes: int


class ActivityCreate(BaseModel):
    city_id: UUID
    title: str = Field(min_length=3, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    category: str = Field(min_length=2, max_length=60)
    level: ActivityLevel = "any"
    address: str = Field(min_length=3, max_length=240)
    location: GeoPoint
    timezone: str = Field(min_length=3, max_length=64)
    starts_at: datetime
    duration_minutes: int = Field(gt=0, le=1440)
    join_deadline: datetime
    participants_min: int = Field(gt=0, le=1000)
    participants_limit: int = Field(gt=0, le=1000)
    price: Price | None = None

    @model_validator(mode="after")
    def validate_limits(self) -> "ActivityCreate":
        if self.participants_limit < self.participants_min:
            raise ValueError("participants_limit must be greater than or equal to participants_min")
        if self.join_deadline > self.starts_at:
            raise ValueError("join_deadline must be before or equal to starts_at")
        return self


class Participant(BaseModel):
    user: UserBrief
    role: Literal["organizer", "participant"]
    joined_at: datetime


class MeProfile(BaseModel):
    id: UUID
    email: str
    name: str
    avatar_url: str | None
    city: CityBrief | None
    timezone: str


class MeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    avatar_url: str | None = Field(default=None, max_length=500)
    city_id: UUID | None = None
    timezone: str | None = Field(default=None, min_length=3, max_length=64)


class Notification(BaseModel):
    id: UUID
    type: str
    title: str
    body: str | None
    activity_id: UUID | None
    payload: dict
    read_at: datetime | None
    created_at: datetime


class ReadAllNotificationsResult(BaseModel):
    updated_count: int
    unread_count: int


class DeviceRegister(BaseModel):
    platform: DevicePlatform
    push_token: str = Field(min_length=10, max_length=500)
    device_name: str | None = Field(default=None, max_length=120)
    app_version: str | None = Field(default=None, max_length=40)


class Device(BaseModel):
    id: UUID
    platform: DevicePlatform
    device_name: str | None
    app_version: str | None
    last_seen_at: datetime
    created_at: datetime


class CatalogItem(BaseModel):
    code: str
    title: str
