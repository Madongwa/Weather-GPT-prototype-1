"""
Covers ask.py's gather_advisories helper (falls back to an empty list
when Tavily is unavailable rather than raising) and the /ask route's
two outcomes: grounded (weather and/or web search succeeded) and
ungrounded (unknown district, no advisories found). The route no
longer calls an LLM itself — see ask.py's module docstring — so there
is no "LLM unavailable" case to test here anymore.
"""

import ask
import main
from search import SearchUnavailableError


async def test_gather_advisories_returns_results(monkeypatch):
    async def fake_search(district, question):
        return [{"title": "IMD", "url": "https://imd.gov.in", "content": "..."}]

    monkeypatch.setattr(ask, "search_weather_advisories", fake_search)

    result = await ask.gather_advisories("Hyderabad", "Is it raining?")

    assert result[0]["title"] == "IMD"


async def test_gather_advisories_falls_back_to_empty_list_when_unavailable(monkeypatch):
    async def fake_search(district, question):
        raise SearchUnavailableError("TAVILY_API_KEY is not configured.")

    monkeypatch.setattr(ask, "search_weather_advisories", fake_search)

    assert await ask.gather_advisories("Hyderabad", "Is it raining?") == []


def test_ask_route_grounded(client, monkeypatch):
    async def fake_fetch(lat, lon):
        return {
            "condition": "Slight rain",
            "temperature_c": 28.0,
            "precipitation_mm": 1.2,
            "wind_speed_kmh": 10.0,
            "fetched_at": "2026-09-21T12:00",
        }

    async def fake_gather_advisories(district, question):
        return [{"title": "IMD", "url": "https://imd.gov.in", "content": "..."}]

    monkeypatch.setattr(main, "fetch_current_conditions", fake_fetch)
    monkeypatch.setattr(main, "gather_advisories", fake_gather_advisories)

    response = client.post(
        "/ask", json={"question": "Is it raining?", "district": "Hyderabad", "role": "General citizen"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["grounded"] is True
    assert "Open-Meteo" in body["source_label"]
    assert "web search" in body["source_label"]
    assert body["weather_summary"].startswith("Slight rain")
    assert body["sources"][0]["title"] == "IMD"


def test_ask_route_ungrounded_unknown_district(client, monkeypatch):
    async def fake_gather_advisories(district, question):
        return []

    monkeypatch.setattr(main, "gather_advisories", fake_gather_advisories)

    response = client.post(
        "/ask", json={"question": "Is it raining?", "district": "Nowhereville", "role": "General citizen"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["grounded"] is False
    assert body["weather_summary"] is None
    assert body["source_label"] == "No live data available"
