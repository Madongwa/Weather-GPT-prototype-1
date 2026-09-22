"""
Regression tests for the persisted, non-network endpoints (alerts, sos,
reports, notifications, checkins, geofence, admin). /weather and /ask
aren't covered here since they call real external services (Open-Meteo,
Tavily) — testing those would need network mocking this pass doesn't
add yet (see test_ask.py for /ask's own mocked-network tests).

Run with `pytest` from the backend/ directory, after:
    pip install -r requirements.txt -r requirements-dev.txt

NOTE: written without a Python interpreter available in the dev
environment that produced this file — run it and fix anything that
doesn't pass; treat this file as reviewed-but-unexecuted.
"""

import admin
import db
import main
from fastapi.testclient import TestClient


def make_client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
    return TestClient(main.app)


def test_health(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    with client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_alerts_simulate_and_list(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    with client:
        simulate = client.post("/alerts/simulate/cyclone", params={"district": "Warangal"})
        assert simulate.status_code == 200
        alert = simulate.json()
        assert alert["hazard_type"] == "Cyclone"
        assert alert["is_simulated"] is True

        listed = client.get("/alerts", params={"district": "Warangal"})
        assert listed.status_code == 200
        assert any(a["id"] == alert["id"] for a in listed.json())


def test_alerts_unknown_scenario(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    with client:
        response = client.post("/alerts/simulate/not-a-real-scenario")
    assert response.status_code == 404


def test_admin_login_and_issue_alert(tmp_path, monkeypatch):
    # admin.py does `from auth import ADMIN_PASSWORD`, copying the value
    # into its own namespace at import time — setting the env var here
    # has no effect on that already-bound name, and neither would
    # patching auth.ADMIN_PASSWORD (a separate binding by now). Patch
    # the name actually used inside admin.py's login() route.
    monkeypatch.setattr(admin, "ADMIN_PASSWORD", "test-password")
    client = make_client(tmp_path, monkeypatch)
    with client:
        bad_login = client.post("/admin/login", json={"password": "wrong"})
        assert bad_login.status_code == 401

        good_login = client.post("/admin/login", json={"password": "test-password"})
        assert good_login.status_code == 200
        token = good_login.json()["token"]

        issued = client.post(
            "/alerts",
            json={"hazard_type": "Flood", "severity": "Be careful", "description": "Test alert"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert issued.status_code == 200
        assert issued.json()["status"] == "Issued"

        # An invalid token (rather than a missing header) exercises
        # require_admin's own 401 logic — a completely absent
        # Authorization header is rejected earlier, by FastAPI's own
        # required-header validation (422), the same behavior already
        # covered by test_sos_requires_device_id below.
        unauthorized = client.post(
            "/alerts",
            json={"hazard_type": "Flood", "severity": "Be careful", "description": "Test alert"},
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert unauthorized.status_code == 401


def test_sos_requires_device_id(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    with client:
        missing_header = client.post("/sos", json={"needs": ["Water"]})
        assert missing_header.status_code == 422  # FastAPI's required-header validation error

        sent = client.post(
            "/sos",
            json={"needs": ["Water", "I am here"], "people_count": 2},
            headers={"X-Device-Id": "device-1"},
        )
        assert sent.status_code == 200
        assert sent.json()["needs"] == ["Water", "I am here"]

        listed = client.get("/sos", headers={"X-Device-Id": "device-1"})
        assert listed.status_code == 200
        assert len(listed.json()) == 1


def test_reports_create_and_list(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    with client:
        created = client.post(
            "/reports",
            json={"report_type": "Flooding", "description": "Ankle-deep water", "district": "Guntur"},
            headers={"X-Device-Id": "device-2"},
        )
        assert created.status_code == 200

        listed = client.get("/reports", params={"district": "Guntur"})
        assert listed.status_code == 200
        assert len(listed.json()) == 1


def test_notifications_flow(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    headers = {"X-Device-Id": "device-3"}
    with client:
        created = client.post("/notifications", json={"title": "Test", "body": "Body text"}, headers=headers)
        notification_id = created.json()["id"]

        marked = client.post(f"/notifications/{notification_id}/read", headers=headers)
        assert marked.status_code == 200

        listed = client.get("/notifications", headers=headers)
        assert listed.json()[0]["read"] is True


def test_checkins_flow(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    headers = {"X-Device-Id": "device-4"}
    with client:
        created = client.post("/checkins", json={"status": "safe", "district": "Hyderabad"}, headers=headers)
        assert created.status_code == 200

        latest = client.get("/checkins/latest", headers=headers)
        assert latest.json()["status"] == "safe"


def test_geofence_check(tmp_path, monkeypatch):
    client = make_client(tmp_path, monkeypatch)
    with client:
        inside = client.get(
            "/geofence/check",
            params={"latitude": 17.385, "longitude": 78.4867, "district": "Hyderabad"},
        )
        assert inside.status_code == 200
        assert inside.json()["in_zone"] is True

        far_away = client.get(
            "/geofence/check",
            params={"latitude": 28.6139, "longitude": 77.2090, "district": "Hyderabad"},  # Delhi
        )
        assert far_away.json()["in_zone"] is False
        assert far_away.json()["distance_km"] > 1000
