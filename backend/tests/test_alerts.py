"""
Covers the lazy-advancement lifecycle (backend/alerts.py's newest
logic): a simulated alert starts at Detected and self-advances through
Issued -> Live -> Resolved as GET /alerts is polled, without any manual
/advance call — and a broadcast notification is logged at each step.
Rather than sleeping for real (STAGE_DURATIONS is 10-20s per stage,
too slow for a test suite), each test rewrites next_stage_at into the
past directly in the DB to simulate "time has passed", then re-polls.
"""

from datetime import datetime, timedelta

import db


def _force_due(district: str = "Hyderabad") -> None:
    """Makes the most recently created alert's next_stage_at due now,
    so the next GET /alerts advances it immediately instead of waiting
    out the real STAGE_DURATIONS."""
    past = (datetime.utcnow() - timedelta(seconds=1)).isoformat()
    with db.get_connection() as conn:
        conn.execute(
            "UPDATE alerts SET next_stage_at = ? WHERE id = (SELECT id FROM alerts ORDER BY id DESC LIMIT 1)",
            (past,),
        )


def test_simulated_alert_starts_at_detected(client):
    response = client.post("/alerts/simulate/thunderstorm", params={"district": "Hyderabad"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "Detected"
    assert body["is_simulated"] is True


def test_simulated_alert_advances_through_full_lifecycle(client):
    client.post("/alerts/simulate/thunderstorm", params={"district": "Hyderabad"})

    for expected_status in ("Issued", "Live", "Resolved"):
        _force_due()
        alerts = client.get("/alerts", params={"district": "Hyderabad"}).json()
        assert alerts[0]["status"] == expected_status

    # Resolved is terminal — forcing it due again and polling once more
    # should not raise or move it any further.
    _force_due()
    alerts = client.get("/alerts", params={"district": "Hyderabad"}).json()
    assert alerts[0]["status"] == "Resolved"


def test_lifecycle_advance_logs_a_broadcast_notification(client):
    client.post("/alerts/simulate/heat_wave", params={"district": "Hyderabad"})
    _force_due()
    client.get("/alerts", params={"district": "Hyderabad"})

    notifications = client.get("/notifications", headers={"X-Device-Id": "test-device"}).json()

    assert any("Heat wave" in n["title"] and "Issued" in n["title"] for n in notifications)


def test_admin_issued_alert_does_not_auto_advance(client):
    login = client.post("/admin/login", json={"password": "changeme-admin"})
    token = login.json()["token"]

    issued = client.post(
        "/alerts",
        json={"hazard_type": "Flood", "severity": "Be careful", "description": "Real flood warning."},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert issued.status_code == 200
    alert_id = issued.json()["id"]

    # A real admin-issued alert never gets a next_stage_at in the first
    # place (unlike simulate_alert) — that's the actual mechanism that
    # keeps it under manual control, not something list_alerts checks
    # per-request. Deliberately not using _force_due() here, since doing
    # so would fabricate a state issue_alert's own code never produces.
    with db.get_connection() as conn:
        row = conn.execute("SELECT next_stage_at FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    assert row["next_stage_at"] is None

    alerts = client.get("/alerts").json()
    matching = next(a for a in alerts if a["id"] == alert_id)
    assert matching["status"] == "Issued"
