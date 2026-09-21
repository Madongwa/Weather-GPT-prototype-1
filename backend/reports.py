"""
People's Reports — community-submitted hazard reports, persisted
server-side and kept visually separate from official alerts throughout
the frontend so nobody confuses the two.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import get_device_id
from db import get_connection
from ratelimit import rate_limit

router = APIRouter(prefix="/reports", tags=["reports"])


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "report_type": row["report_type"],
        "description": row["description"],
        "location_text": row["location_text"],
        "district": row["district"],
        "created_at": row["created_at"],
    }


class ReportRequest(BaseModel):
    report_type: str
    description: str = ""
    location_text: str = ""
    district: str | None = None


@router.get("")
def list_reports(district: str | None = None):
    with get_connection() as conn:
        if district:
            rows = conn.execute(
                "SELECT * FROM people_reports WHERE district = ? ORDER BY created_at DESC", (district,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM people_reports ORDER BY created_at DESC LIMIT 100"
            ).fetchall()
    return [_row_to_dict(row) for row in rows]


@router.post("", dependencies=[Depends(rate_limit(max_requests=10, window_seconds=300))])
def create_report(payload: ReportRequest, device_id: str = Depends(get_device_id)):
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO people_reports (device_id, report_type, description, location_text, district) "
            "VALUES (?, ?, ?, ?, ?)",
            (device_id, payload.report_type, payload.description, payload.location_text, payload.district),
        )
        report_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM people_reports WHERE id = ?", (report_id,)).fetchone()
    return _row_to_dict(row)
