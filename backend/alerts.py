"""
Official alerts — persisted server-side, including the severity/
lifecycle model and the scenario-simulator injection used by Trust &
Sources' "trigger a demo moment" buttons.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import require_admin
from db import get_connection

router = APIRouter(prefix="/alerts", tags=["alerts"])

SEVERITIES = {"Be aware", "Be prepared", "Be careful"}
STATUSES = ["Detected", "Issued", "Live", "Resolved"]

SCENARIOS = {
    "thunderstorm": {
        "hazard_type": "Thunderstorm",
        "severity": "Be prepared",
        "description": "Simulated: a thunderstorm cell is approaching from the west with lightning risk.",
    },
    "heat_wave": {
        "hazard_type": "Heat wave",
        "severity": "Be careful",
        "description": "Simulated: daytime temperatures are forecast well above seasonal norms.",
    },
    "heavy_rain": {
        "hazard_type": "Heavy rain",
        "severity": "Be prepared",
        "description": "Simulated: sustained heavy rainfall is expected, with localized flooding risk.",
    },
    "cyclone": {
        "hazard_type": "Cyclone",
        "severity": "Be careful",
        "description": "Simulated: a cyclonic system is being tracked offshore.",
    },
}


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "hazard_type": row["hazard_type"],
        "severity": row["severity"],
        "status": row["status"],
        "description": row["description"],
        "district": row["district"],
        "is_simulated": bool(row["is_simulated"]),
        "expires_at": row["expires_at"],
        "created_at": row["created_at"],
    }


@router.get("")
def list_alerts(district: str | None = None):
    """Active alerts — expired simulated ones are swept first."""
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM alerts WHERE is_simulated = 1 AND expires_at IS NOT NULL AND expires_at < ?",
            (datetime.utcnow().isoformat(),),
        )
        if district:
            rows = conn.execute(
                "SELECT * FROM alerts WHERE district = ? ORDER BY created_at DESC", (district,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM alerts ORDER BY created_at DESC").fetchall()
    return [_row_to_dict(row) for row in rows]


@router.get("/{alert_id}")
def get_alert(alert_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _row_to_dict(row)


class IssueAlertRequest(BaseModel):
    hazard_type: str
    severity: str
    description: str
    district: str | None = None


@router.post("", dependencies=[Depends(require_admin)])
def issue_alert(payload: IssueAlertRequest):
    """Admin-only: a real Emergency official issuing a real alert."""
    if payload.severity not in SEVERITIES:
        raise HTTPException(status_code=400, detail=f"severity must be one of {sorted(SEVERITIES)}")

    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO alerts (hazard_type, severity, status, description, district) "
            "VALUES (?, ?, 'Issued', ?, ?)",
            (payload.hazard_type, payload.severity, payload.description, payload.district),
        )
        alert_id = cursor.lastrowid
    return get_alert(alert_id)


@router.post("/{alert_id}/advance", dependencies=[Depends(require_admin)])
def advance_alert(alert_id: int):
    """Admin-only: move an alert to the next lifecycle stage."""
    with get_connection() as conn:
        row = conn.execute("SELECT status FROM alerts WHERE id = ?", (alert_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Alert not found")
        current_index = STATUSES.index(row["status"])
        if current_index >= len(STATUSES) - 1:
            raise HTTPException(status_code=400, detail="Alert is already Resolved")
        conn.execute(
            "UPDATE alerts SET status = ? WHERE id = ?",
            (STATUSES[current_index + 1], alert_id),
        )
    return get_alert(alert_id)


@router.post("/simulate/{scenario}")
def simulate_alert(scenario: str, district: str | None = None):
    """
    Trust & Sources' scenario simulators: injects a mock alert for a few
    minutes so there's an on-demand "live demo moment" for judges. No
    admin auth needed — this only ever creates alerts flagged
    is_simulated, and the frontend labels every simulated alert
    accordingly so it's never confused with a real one.
    """
    scenario_data = SCENARIOS.get(scenario)
    if scenario_data is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario '{scenario}'")

    expires_at = (datetime.utcnow() + timedelta(minutes=5)).isoformat()

    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO alerts "
            "(hazard_type, severity, status, description, district, is_simulated, expires_at) "
            "VALUES (?, ?, 'Live', ?, ?, 1, ?)",
            (
                scenario_data["hazard_type"],
                scenario_data["severity"],
                scenario_data["description"],
                district,
                expires_at,
            ),
        )
        alert_id = cursor.lastrowid
    return get_alert(alert_id)
