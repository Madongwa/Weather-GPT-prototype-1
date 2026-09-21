"""
Notifications — a persisted (server-side, not just localStorage) history
of alerts/messages per device.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_device_id
from db import get_connection

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "body": row["body"],
        "level": row["level"],
        "read": bool(row["read"]),
        "created_at": row["created_at"],
    }


@router.get("")
def list_notifications(device_id: str = Depends(get_device_id)):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM notifications WHERE device_id IS NULL OR device_id = ? ORDER BY created_at DESC",
            (device_id,),
        ).fetchall()
    return [_row_to_dict(row) for row in rows]


class CreateNotificationRequest(BaseModel):
    title: str
    body: str
    level: str = "info"


@router.post("")
def create_notification(payload: CreateNotificationRequest, device_id: str = Depends(get_device_id)):
    """Lets the frontend log its own client-side events (e.g. a scenario
    simulator firing) into the same persisted history."""
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO notifications (device_id, title, body, level) VALUES (?, ?, ?, ?)",
            (device_id, payload.title, payload.body, payload.level),
        )
        notification_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM notifications WHERE id = ?", (notification_id,)).fetchone()
    return _row_to_dict(row)


@router.post("/{notification_id}/read")
def mark_read(notification_id: int, device_id: str = Depends(get_device_id)):
    with get_connection() as conn:
        row = conn.execute("SELECT id FROM notifications WHERE id = ?", (notification_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        conn.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notification_id,))
    return {"ok": True}


@router.post("/read-all")
def mark_all_read(device_id: str = Depends(get_device_id)):
    with get_connection() as conn:
        conn.execute(
            "UPDATE notifications SET read = 1 WHERE device_id IS NULL OR device_id = ?", (device_id,)
        )
    return {"ok": True}
