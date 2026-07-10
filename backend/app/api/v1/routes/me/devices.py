from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection

from app.api.errors import raise_api_error
from app.api.v1.dependencies import get_current_user_id
from app.api.v1.schemas import Device, DeviceRegister
from app.db import get_connection

router = APIRouter()


def device_from_row(row: dict) -> Device:
    return Device(
        id=row["id"],
        platform=row["platform"],
        device_name=row["device_name"],
        app_version=row["app_version"],
        last_seen_at=row["last_seen_at"],
        created_at=row["created_at"],
    )


@router.get("", response_model=list[Device])
async def list_devices(
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[Device]:
    result = await connection.execute(
        text(
            """
            SELECT id,
                   platform,
                   device_name,
                   app_version,
                   last_seen_at,
                   created_at
            FROM user_devices
            WHERE user_id = :user_id
              AND deleted_at IS NULL
            ORDER BY last_seen_at DESC, id DESC
            """
        ),
        {"user_id": current_user_id},
    )

    return [device_from_row(row) for row in result.mappings()]


@router.post("", response_model=Device, status_code=status.HTTP_201_CREATED)
async def register_device(
    payload: DeviceRegister,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> Device:
    result = await connection.execute(
        text(
            """
            INSERT INTO user_devices (
                user_id,
                platform,
                push_token,
                device_name,
                app_version
            )
            VALUES (
                :user_id,
                :platform,
                :push_token,
                :device_name,
                :app_version
            )
            ON CONFLICT (push_token) WHERE deleted_at IS NULL
            DO UPDATE SET user_id = EXCLUDED.user_id,
                          platform = EXCLUDED.platform,
                          device_name = EXCLUDED.device_name,
                          app_version = EXCLUDED.app_version,
                          last_seen_at = now(),
                          updated_at = now()
            RETURNING id,
                      platform,
                      device_name,
                      app_version,
                      last_seen_at,
                      created_at
            """
        ),
        {
            "user_id": current_user_id,
            "platform": payload.platform,
            "push_token": payload.push_token,
            "device_name": payload.device_name,
            "app_version": payload.app_version,
        },
    )

    return device_from_row(result.mappings().one())


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: UUID,
    connection: Annotated[AsyncConnection, Depends(get_connection)],
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    result = await connection.execute(
        text(
            """
            UPDATE user_devices
            SET deleted_at = now(),
                updated_at = now()
            WHERE id = :device_id
              AND user_id = :user_id
              AND deleted_at IS NULL
            RETURNING id
            """
        ),
        {"device_id": device_id, "user_id": current_user_id},
    )

    if result.scalar_one_or_none() is None:
        raise_api_error(status.HTTP_404_NOT_FOUND, "device_not_found", "Device not found")
