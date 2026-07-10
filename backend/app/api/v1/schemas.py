import re
from datetime import datetime
from typing import Annotated, Generic, Literal, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.networks import EmailStr

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


PASSWORD_REGEX = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;\"'<>,.?/~`]).{8,128}$"
)


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
    level: str
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
    organizer: UserBrief


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


class AuthRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)
    city_id: UUID | None = None
    timezone: str = "Europe/Moscow"

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "Password must be 8-128 characters with at least one uppercase letter, "
                "one lowercase letter, one digit, and one special character"
            )
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return v.strip()


class AuthLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class AuthToken(BaseModel):
    token: str
    user: MeProfile


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "Password must be 8-128 characters with at least one uppercase letter, "
                "one lowercase letter, one digit, and one special character"
            )
        return v


class Friend(BaseModel):
    id: UUID
    name: str
    avatar_url: str | None
    mutual_events: int = 0
    created_at: datetime


class FriendRequest(BaseModel):
    id: UUID
    user: UserBrief
    status: Literal["pending", "accepted", "rejected"]
    created_at: datetime


class ChatBrief(BaseModel):
    id: UUID
    type: Literal["event", "direct"]
    name: str
    event_id: UUID | None
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0
    member_count: int = 0
    created_at: datetime


class ChatDetail(ChatBrief):
    members: list[Participant] = []


class ChatCreate(BaseModel):
    type: Literal["event", "direct"]
    name: str = Field(min_length=1, max_length=240)
    member_ids: list[UUID] = Field(min_length=1, max_length=100)


class MessageSend(BaseModel):
    text: str = Field(min_length=1, max_length=5000)


class MessageOut(BaseModel):
    id: UUID
    chat_id: UUID
    user: UserBrief
    text: str
    created_at: datetime


class UserPlace(BaseModel):
    id: UUID
    name: str
    image_url: str | None
    location: GeoPoint | None
    created_at: datetime


class UserPlaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=240)
    image_url: str | None = Field(default=None, max_length=500)
    location: GeoPoint | None = None
