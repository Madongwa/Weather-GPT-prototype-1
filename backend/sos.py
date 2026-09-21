"""
SOS reports — persisted server-side. Real offline-queue delivery (a
service-worker background-sync retry) isn't implemented here; this only
handles the request once the device is actually online. See the
frontend SOS screen for the explicit TODO on that.
"""

import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_device_id
from db import get_connection
from ratelimit import rate_limit

router = APIRouter(prefix="/sos", tags=["sos"])


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "needs": json.loads(row["needs"]),
        "people_count": row["people_count"],
        "medical_needed": bool(row["medical_needed"]),
        "detail": row["detail"],
        "district": row["district"],
        "status": row["status"],
        "relay_status": row["relay_status"],
        "created_at": row["created_at"],
    }


class SosRequest(BaseModel):
    needs: list[str]
    people_count: int = 1
    medical_needed: bool = False
    detail: str = ""
    district: str | None = None


@router.get("")
def list_sos(device_id: str = Depends(get_device_id)):
    """Only this device's own SOS log — not everyone's, for privacy."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM sos_reports WHERE device_id = ? ORDER BY created_at DESC", (device_id,)
        ).fetchall()
    return [_row_to_dict(row) for row in rows]


@router.post("", dependencies=[Depends(rate_limit(max_requests=5, window_seconds=300))])
def send_sos(payload: SosRequest, device_id: str = Depends(get_device_id)):
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO sos_reports "
            "(device_id, needs, people_count, medical_needed, detail, district, status) "
            "VALUES (?, ?, ?, ?, ?, ?, 'Relayed')",
            (
                device_id,
                json.dumps(payload.needs),
                payload.people_count,
                int(payload.medical_needed),
                payload.detail,
                payload.district,
            ),
        )
        sos_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM sos_reports WHERE id = ?", (sos_id,)).fetchone()
    return _row_to_dict(row)


@router.post("/{sos_id}/relay")
def relay_sos(sos_id: int, device_id: str = Depends(get_device_id)):
    """
    Simulates one P2P relay hop for a message this device actually sent —
    the SOS screen's "Simulate relay" button, an interactive stand-in for
    real device-to-device mesh relay (see SosScreen.jsx's hop-path
    illustration for the honesty caveat: this is a concept demo, no real
    P2P transport). Scoped to `device_id` for the same privacy reason
    list_sos is: a device can only see and act on its own SOS log.
    """
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM sos_reports WHERE id = ? AND device_id = ?", (sos_id, device_id)
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="SOS report not found")
        conn.execute(
            "UPDATE sos_reports SET relay_status = 'Relayed (simulated)' WHERE id = ?", (sos_id,)
        )
        row = conn.execute("SELECT * FROM sos_reports WHERE id = ?", (sos_id,)).fetchone()
    return _row_to_dict(row)
