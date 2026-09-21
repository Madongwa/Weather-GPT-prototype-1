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
from notifications import insert_notification

router = APIRouter(prefix="/alerts", tags=["alerts"])

SEVERITIES = {"Be aware", "Be prepared", "Be careful"}
STATUSES = ["Detected", "Issued", "Live", "Resolved"]

# How long a *simulated* alert stays in each status before automatically
# advancing to the next one — the self-advancing lifecycle SAARTHI's
# comparison flagged as missing. Vercel serverless has no persistent
# background process for a real timer, so this is "lazy advancement on
# read" instead: list_alerts (called every time any screen polls alerts)
# checks whether an alert's next_stage_at has passed and advances it
# right there, the same pattern already used just below it to sweep
# expired alerts. No entry for "Resolved" — that's the terminal state,
# nothing auto-advances out of it.
#
# Real admin-issued alerts (issue_alert) never get a next_stage_at, so
# they're unaffected — they stay under the issuing official's manual
# control via POST /alerts/{id}/advance. Only simulated demo alerts
# progress on their own; that's a deliberate trust-boundary choice, not
# an oversight.
STAGE_DURATIONS = {
    "Detected": timedelta(seconds=10),
    "Issued": timedelta(seconds=20),
    "Live": timedelta(seconds=20),
}

# Once a simulated alert reaches Resolved, it's kept around this long
# (so a UI polling right after the transition still sees it) before the
# existing expiry sweep below removes it — otherwise resolved demo
# alerts would accumulate in the table for the life of the warm
# serverless instance.
RESOLVED_RETENTION = timedelta(minutes=2)

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


def _advance_due_alerts(conn, now: datetime) -> None:
    """Lazy advancement on read — see STAGE_DURATIONS' docstring above."""
    due = conn.execute(
        "SELECT * FROM alerts WHERE next_stage_at IS NOT NULL AND next_stage_at < ?", (now.isoformat(),)
    ).fetchall()
    for row in due:
        next_status = STATUSES[STATUSES.index(row["status"]) + 1]
        next_duration = STAGE_DURATIONS.get(next_status)
        next_stage_at = (now + next_duration).isoformat() if next_duration else None
        expires_at = row["expires_at"]
        if next_status == "Resolved":
            expires_at = (now + RESOLVED_RETENTION).isoformat()
        conn.execute(
            "UPDATE alerts SET status = ?, next_stage_at = ?, expires_at = ? WHERE id = ?",
            (next_status, next_stage_at, expires_at, row["id"]),
        )
        insert_notification(
            conn,
            device_id=None,
            title=f"{row['hazard_type']}: now {next_status}",
            body=row["description"],
            level="warning" if next_status != "Resolved" else "info",
        )


@router.get("")
def list_alerts(district: str | None = None):
    """Active alerts — due simulated alerts are auto-advanced, then
    expired ones swept, before the list is read."""
    now = datetime.utcnow()
    with get_connection() as conn:
        _advance_due_alerts(conn, now)
        conn.execute(
            "DELETE FROM alerts WHERE is_simulated = 1 AND expires_at IS NOT NULL AND expires_at < ?",
            (now.isoformat(),),
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
    Trust & Sources' scenario simulators: injects a mock alert and starts
    it at the beginning of the real lifecycle (Detected), not straight at
    Live, so there's an on-demand "live demo moment" for judges of the
    whole Detected -> Issued -> Live -> Resolved progression, not just a
    single static state. No admin auth needed — this only ever creates
    alerts flagged is_simulated, and the frontend labels every simulated
    alert accordingly so it's never confused with a real one.
    """
    scenario_data = SCENARIOS.get(scenario)
    if scenario_data is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario '{scenario}'")

    now = datetime.utcnow()
    next_stage_at = (now + STAGE_DURATIONS["Detected"]).isoformat()

    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO alerts "
            "(hazard_type, severity, status, description, district, is_simulated, next_stage_at) "
            "VALUES (?, ?, 'Detected', ?, ?, 1, ?)",
            (
                scenario_data["hazard_type"],
                scenario_data["severity"],
                scenario_data["description"],
                district,
                next_stage_at,
            ),
        )
        alert_id = cursor.lastrowid
    return get_alert(alert_id)
