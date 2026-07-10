"""Data access layer for activities. All SQL queries are isolated here."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.pagination import decode_activity_cursor, encode_activity_cursor
from app.api.v1.schemas import (
    ActivityCreate,
    ActivityDetail,
    ActivityListItem,
    ActivityParticipantsSummary,
    ActivityStatus,
    ActivityViewerState,
    CityBrief,
    GeoPoint,
    Page,
    Participant,
    Price,
    UserBrief,
)

ACTIVITY_SELECT_TEMPLATE = """
    SELECT a.id,
           a.organizer_id,
           organizer.name AS organizer_name,
           organizer.avatar_url AS organizer_avatar_url,
           a.city_id,
           c.name AS city_name,
           c.region AS city_region,
           c.timezone AS city_timezone,
           a.title,
           a.description,
           a.category,
           a.level,
           a.address,
           ST_Y(a.location::geometry) AS latitude,
           ST_X(a.location::geometry) AS longitude,
           a.timezone,
           a.start_at,
           a.duration_minutes,
           a.join_deadline,
           a.min_participants,
           a.max_participants,
           a.current_participants_count,
           a.price_amount,
           a.status,
           viewer_participant.role AS viewer_role,
           {distance_expression} AS distance_m
    FROM activities a
    JOIN cities c ON c.id = a.city_id
    JOIN users organizer ON organizer.id = a.organizer_id
    LEFT JOIN activity_participants viewer_participant
      ON viewer_participant.activity_id = a.id
     AND viewer_participant.user_id = :viewer_user_id
"""


def activity_select(distance_expression: str = "NULL::double precision") -> str:
    return ACTIVITY_SELECT_TEMPLATE.format(distance_expression=distance_expression)


def build_viewer_state(row: dict, viewer_user_id: UUID | None) -> ActivityViewerState:
    role = row["viewer_role"]

    if viewer_user_id is None:
        return ActivityViewerState(
            is_participant=False, role=None, can_join=False, join_block_reason="auth_required",
        )

    if role is not None:
        return ActivityViewerState(
            is_participant=True, role=role, can_join=False, join_block_reason="already_joined",
        )

    if row["status"] not in ("open", "confirmed"):
        return ActivityViewerState(
            is_participant=False, role=None, can_join=False, join_block_reason="activity_closed",
        )

    deadline = row["join_deadline"]
    now = datetime.now(deadline.tzinfo or timezone.utc)
    if deadline < now:
        return ActivityViewerState(
            is_participant=False, role=None, can_join=False, join_block_reason="deadline_passed",
        )

    if row["current_participants_count"] >= row["max_participants"]:
        return ActivityViewerState(
            is_participant=False, role=None, can_join=False, join_block_reason="activity_full",
        )

    return ActivityViewerState(
        is_participant=False, role=None, can_join=True, join_block_reason=None,
    )


def activity_from_row(row: dict, viewer_user_id: UUID | None) -> ActivityDetail:
    price = Price(amount=row["price_amount"]) if row["price_amount"] is not None else None

    return ActivityDetail(
        id=row["id"],
        title=row["title"],
        description=row["description"],
        category=row["category"],
        level=row["level"],
        city=CityBrief(id=row["city_id"], name=row["city_name"], region=row["city_region"], timezone=row["city_timezone"]),
        organizer=UserBrief(id=row["organizer_id"], name=row["organizer_name"], avatar_url=row["organizer_avatar_url"]),
        address=row["address"],
        location=GeoPoint(latitude=row["latitude"], longitude=row["longitude"]),
        distance_m=round(row["distance_m"]) if row["distance_m"] is not None else None,
        timezone=row["timezone"],
        starts_at=row["start_at"],
        duration_minutes=row["duration_minutes"],
        join_deadline=row["join_deadline"],
        participants=ActivityParticipantsSummary(
            count=row["current_participants_count"], minimum=row["min_participants"], limit=row["max_participants"],
        ),
        price=price,
        status=row["status"],
        viewer=build_viewer_state(row, viewer_user_id),
    )


def activity_list_item_from_row(row: dict, viewer_user_id: UUID | None) -> ActivityListItem:
    detail = activity_from_row(row, viewer_user_id)
    data = detail.model_dump()
    data["organizer"] = {"id": str(row["organizer_id"]), "name": row["organizer_name"], "avatar_url": row["organizer_avatar_url"]}
    return ActivityListItem.model_validate(data)


def participant_from_row(row: dict) -> Participant:
    return Participant(
        user=UserBrief(id=row["user_id"], name=row["name"], avatar_url=row["avatar_url"]),
        role=row["role"],
        joined_at=row["joined_at"],
    )


async def get_activity_or_404(connection: AsyncConnection, activity_id: UUID, viewer_user_id: UUID | None) -> ActivityDetail:
    result = await connection.execute(
        text(f"""{activity_select()} WHERE a.id = :activity_id AND a.deleted_at IS NULL"""),
        {"activity_id": activity_id, "viewer_user_id": viewer_user_id},
    )
    row = result.mappings().one_or_none()
    if row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "activity_not_found", "Activity not found")
    return activity_from_row(row, viewer_user_id)


def raise_activity_write_error(error: IntegrityError) -> None:
    sqlstate = getattr(error.orig, "sqlstate", None)
    if sqlstate == "23503":
        raise_api_error(status.HTTP_404_NOT_FOUND, "related_entity_not_found", "Related user, city, or activity not found")
    if sqlstate == "23505":
        raise_api_error(status.HTTP_409_CONFLICT, "already_participant", "User is already a participant")
    if sqlstate == "23514":
        raise_api_error(status.HTTP_409_CONFLICT, "action_not_allowed", "This action is not allowed due to the current activity state")
    raise error


async def list_activities(
    connection: AsyncConnection,
    viewer_user_id: UUID | None,
    limit: int = 30,
    cursor: str | None = None,
    city_id: UUID | None = None,
    category: str | None = None,
    status_filter: ActivityStatus | None = None,
    search: str | None = None,
    lat: float | None = None,
    lon: float | None = None,
    radius_m: int | None = None,
) -> Page[ActivityListItem]:
    conditions = ["a.deleted_at IS NULL"]
    params: dict[str, object] = {"limit": limit + 1, "viewer_user_id": viewer_user_id}
    has_origin = lat is not None and lon is not None

    if search is not None:
        conditions.append("(a.title ILIKE :search OR a.description ILIKE :search OR a.address ILIKE :search)")
        params["search"] = f"%{search}%"

    distance_expression = "NULL::double precision"

    if city_id is not None:
        conditions.append("a.city_id = :city_id")
        params["city_id"] = city_id

    if category is not None:
        conditions.append("a.category = :category")
        params["category"] = category

    if status_filter is not None:
        conditions.append("a.status = :status")
        params["status"] = status_filter

    if has_origin:
        params["origin_lat"] = lat
        params["origin_lon"] = lon
        distance_expression = "ST_Distance(a.location, ST_SetSRID(ST_MakePoint(:origin_lon, :origin_lat), 4326)::geography)"

    if radius_m is not None:
        if not has_origin:
            raise_api_error(status.HTTP_400_BAD_REQUEST, "geo_point_required", "lat and lon are required with radius_m")
        conditions.append("ST_DWithin(a.location, ST_SetSRID(ST_MakePoint(:origin_lon, :origin_lat), 4326)::geography, :radius_m)")
        params["radius_m"] = radius_m

    if cursor is not None:
        try:
            cursor_starts_at, cursor_id = decode_activity_cursor(cursor)
        except (ValueError, KeyError, TypeError):
            raise_api_error(status.HTTP_400_BAD_REQUEST, "invalid_cursor", "Invalid cursor")
        conditions.append("(a.start_at > :cursor_starts_at OR (a.start_at = :cursor_starts_at AND a.id > :cursor_id))")
        params["cursor_starts_at"] = cursor_starts_at
        params["cursor_id"] = cursor_id

    result = await connection.execute(
        text(f"""{activity_select(distance_expression)} WHERE {' AND '.join(conditions)} ORDER BY a.start_at ASC, a.id ASC LIMIT :limit"""),
        params,
    )
    rows = list(result.mappings())
    items = [activity_list_item_from_row(row, viewer_user_id) for row in rows[:limit]]
    next_cursor = encode_activity_cursor(items[-1].starts_at, items[-1].id) if len(rows) > limit and items else None
    return Page(items=items, next_cursor=next_cursor)


async def create_activity(connection: AsyncConnection, payload: ActivityCreate, current_user_id: UUID) -> ActivityDetail:
    try:
        result = await connection.execute(
            text("""
                INSERT INTO activities (organizer_id, city_id, title, description, category, level, address,
                    location, timezone, start_at, duration_minutes, join_deadline, min_participants, max_participants, price_amount)
                VALUES (:organizer_id, :city_id, :title, :description, :category, :level, :address,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :timezone, :starts_at, :duration_minutes, :join_deadline, :participants_min, :participants_limit, :price_amount)
                RETURNING id
            """),
            {
                "organizer_id": current_user_id,
                "city_id": payload.city_id,
                "title": payload.title,
                "description": payload.description,
                "category": payload.category,
                "level": payload.level,
                "address": payload.address,
                "longitude": payload.location.longitude,
                "latitude": payload.location.latitude,
                "timezone": payload.timezone,
                "starts_at": payload.starts_at,
                "duration_minutes": payload.duration_minutes,
                "join_deadline": payload.join_deadline,
                "participants_min": payload.participants_min,
                "participants_limit": payload.participants_limit,
                "price_amount": payload.price.amount if payload.price is not None else None,
            },
        )
        activity_id = result.scalar_one()
    except IntegrityError as error:
        raise_activity_write_error(error)

    return await get_activity_or_404(connection, activity_id, current_user_id)


async def update_activity(connection: AsyncConnection, activity_id: UUID, payload: ActivityCreate, current_user_id: UUID) -> ActivityDetail:
    activity = await get_activity_or_404(connection, activity_id, current_user_id)

    if activity.organizer.id != current_user_id:
        raise_api_error(status.HTTP_403_FORBIDDEN, "not_organizer", "Only the organizer can update the activity")

    if activity.status not in ("open", "confirmed"):
        raise_api_error(status.HTTP_409_CONFLICT, "activity_not_editable", "Activity cannot be edited in its current state")

    try:
        await connection.execute(
            text("""
                UPDATE activities
                SET title = :title, description = :description, category = :category, level = :level,
                    address = :address, location = ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    timezone = :timezone, start_at = :starts_at, duration_minutes = :duration_minutes,
                    join_deadline = :join_deadline, min_participants = :participants_min,
                    max_participants = :participants_limit, price_amount = :price_amount, updated_at = now()
                WHERE id = :activity_id AND deleted_at IS NULL
            """),
            {
                "activity_id": activity_id,
                "title": payload.title,
                "description": payload.description,
                "category": payload.category,
                "level": payload.level,
                "address": payload.address,
                "longitude": payload.location.longitude,
                "latitude": payload.location.latitude,
                "timezone": payload.timezone,
                "starts_at": payload.starts_at,
                "duration_minutes": payload.duration_minutes,
                "join_deadline": payload.join_deadline,
                "participants_min": payload.participants_min,
                "participants_limit": payload.participants_limit,
                "price_amount": payload.price.amount if payload.price is not None else None,
            },
        )
    except IntegrityError as error:
        raise_activity_write_error(error)

    return await get_activity_or_404(connection, activity_id, current_user_id)


async def list_participants(connection: AsyncConnection, activity_id: UUID) -> list[Participant]:
    result = await connection.execute(
        text("""
            SELECT ap.user_id, ap.role, ap.joined_at, u.name, u.avatar_url
            FROM activity_participants ap
            JOIN users u ON u.id = ap.user_id
            WHERE ap.activity_id = :activity_id
            ORDER BY ap.joined_at ASC, ap.user_id ASC
        """),
        {"activity_id": activity_id},
    )
    return [participant_from_row(row) for row in result.mappings()]


async def join_activity(connection: AsyncConnection, activity_id: UUID, current_user_id: UUID) -> ActivityDetail:
    try:
        await connection.execute(
            text("INSERT INTO activity_participants (activity_id, user_id) VALUES (:activity_id, :user_id)"),
            {"activity_id": activity_id, "user_id": current_user_id},
        )
    except IntegrityError as error:
        raise_activity_write_error(error)

    return await get_activity_or_404(connection, activity_id, current_user_id)


async def leave_activity(connection: AsyncConnection, activity_id: UUID, current_user_id: UUID) -> ActivityDetail:
    result = await connection.execute(
        text("""
            DELETE FROM activity_participants
            WHERE activity_id = :activity_id AND user_id = :user_id AND role <> 'organizer'
            RETURNING user_id
        """),
        {"activity_id": activity_id, "user_id": current_user_id},
    )
    if result.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_409_CONFLICT, "cannot_leave_activity", "Participant not found or organizer cannot leave")

    return await get_activity_or_404(connection, activity_id, current_user_id)


async def cancel_activity(connection: AsyncConnection, activity_id: UUID, current_user_id: UUID) -> ActivityDetail:
    result = await connection.execute(
        text("SELECT organizer_id, status FROM activities WHERE id = :activity_id AND deleted_at IS NULL"),
        {"activity_id": activity_id},
    )
    row = result.mappings().one_or_none()

    if row is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "activity_not_found", "Activity not found")

    if row["organizer_id"] != current_user_id:
        raise_api_error(status.HTTP_403_FORBIDDEN, "not_activity_organizer", "Only organizer can cancel activity")

    if row["status"] not in ("open", "confirmed", "full"):
        raise_api_error(status.HTTP_409_CONFLICT, "activity_not_cancellable", "Activity cannot be cancelled")

    await connection.execute(
        text("UPDATE activities SET status = 'cancelled', updated_at = now() WHERE id = :activity_id"),
        {"activity_id": activity_id},
    )

    return await get_activity_or_404(connection, activity_id, current_user_id)
