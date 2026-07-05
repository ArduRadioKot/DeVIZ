import base64
import json
from datetime import datetime
from uuid import UUID


def encode_activity_cursor(starts_at: datetime, activity_id: UUID) -> str:
    payload = {"starts_at": starts_at.isoformat(), "id": str(activity_id)}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()


def decode_activity_cursor(cursor: str) -> tuple[datetime, UUID]:
    payload = json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
    return datetime.fromisoformat(payload["starts_at"]), UUID(payload["id"])
