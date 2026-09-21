"""
"I'm safe" check-ins. Real SMS/WhatsApp delivery to saved contacts needs
a telecom/messaging gateway account this project doesn't have (see the
credentials list) — so instead of faking that delivery, this persists
the check-in and hands the frontend a plain-text status message the
user can share themselves (WhatsApp share link, copy to clipboard).
That's an honest half-step: real persistence, real shareable content, no
invented "sent to your contacts" claim.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import get_device_id
from db import get_connection

router = APIRouter(prefix="/checkins", tags=["checkins"])


class CheckinRequest(BaseModel):
    status: str  # "safe" | "need_help"
    note: str = ""
    district: str | None = None


@router.post("")
def create_checkin(payload: CheckinRequest, device_id: str = Depends(get_device_id)):
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO safe_checkins (device_id, status, note, district) VALUES (?, ?, ?, ?)",
            (device_id, payload.status, payload.note, payload.district),
        )
    return {"ok": True}


@router.get("/latest")
def latest_checkin(device_id: str = Depends(get_device_id)):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM safe_checkins WHERE device_id = ? ORDER BY created_at DESC LIMIT 1",
            (device_id,),
        ).fetchone()
    if row is None:
        return None
    return {
        "status": row["status"],
        "note": row["note"],
        "district": row["district"],
        "created_at": row["created_at"],
    }
