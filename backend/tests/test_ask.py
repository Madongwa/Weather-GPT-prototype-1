"""
Covers ask.py's own rule-based answer validator (a pure function, no
network) and the /ask route's three outcomes: grounded (weather + LLM
both succeed), ungrounded (unknown district, LLM still answers), and
unavailable (the LLM call itself fails).
"""

import ask
import main
from ask import AskUnavailableError


def test_validate_answer_leaves_unrelated_text_unchanged():
    answer = "Expect light rain this afternoon in Hyderabad."
    assert ask._validate_answer(answer, "light rain expected, IMD advisory: no warning") == answer


def test_validate_answer_leaves_supported_severity_term_unchanged():
    answer = "IMD has issued a red alert for this district."
    grounding = "IMD advisory: a red alert is in effect for heavy rainfall."
    assert ask._validate_answer(answer, grounding) == answer


def test_validate_answer_flags_unsupported_severity_term():
    answer = "This is a red alert situation — take shelter immediately."
    grounding = "Current conditions: light rain, 26C. No advisories found."

    result = ask._validate_answer(answer, grounding)

    assert result != answer
    assert result.startswith(answer)
    assert "not found in the current data" in result


def test_ask_route_grounded(client, monkeypatch):
    async def fake_fetch(lat, lon):
        return {
            "condition": "Slight rain",
            "temperature_c": 28.0,
            "precipitation_mm": 1.2,
            "wind_speed_kmh": 10.0,
            "fetched_at": "2026-09-21T12:00",
        }

    async def fake_answer_question(*, question, district, role, weather_summary):
        assert weather_summary is not None
        return "It's lightly raining right now.", [{"title": "IMD", "url": "https://imd.gov.in", "content": "..."}]

    monkeypatch.setattr(main, "fetch_current_conditions", fake_fetch)
    monkeypatch.setattr(main, "answer_question", fake_answer_question)

    response = client.post(
        "/ask", json={"question": "Is it raining?", "district": "Hyderabad", "role": "General citizen"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["grounded"] is True
    assert "Open-Meteo" in body["source_label"]
    assert "web search" in body["source_label"]
    assert body["sources"][0]["title"] == "IMD"


def test_ask_route_ungrounded_unknown_district(client, monkeypatch):
    async def fake_answer_question(*, question, district, role, weather_summary):
        assert weather_summary is None
        return "Live data isn't available for this district right now.", []

    monkeypatch.setattr(main, "answer_question", fake_answer_question)

    response = client.post(
        "/ask", json={"question": "Is it raining?", "district": "Nowhereville", "role": "General citizen"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["grounded"] is False
    assert body["source_label"] == "No live data available"


def test_ask_route_llm_unavailable_returns_503(client, monkeypatch):
    async def fake_answer_question(*, question, district, role, weather_summary):
        raise AskUnavailableError("GROQ_API_KEY is not configured.")

    monkeypatch.setattr(main, "answer_question", fake_answer_question)

    # An unknown district so the route skips its own fetch_current_conditions
    # call entirely (no coordinates) — this test is only about the LLM
    # call failing, not weather grounding.
    response = client.post(
        "/ask", json={"question": "Is it raining?", "district": "Nowhereville", "role": "General citizen"}
    )

    assert response.status_code == 503
