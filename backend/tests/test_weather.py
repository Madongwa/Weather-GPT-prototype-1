"""
Covers weather.py's own parsing/normalization logic (via a fake HTTP
transport, so no real Open-Meteo call happens) and the /weather route's
three outcomes: grounded (success), unavailable (Open-Meteo failed), and
unknown district (no coordinates configured).
"""

import httpx
import main
import pytest
import weather

OPEN_METEO_PAYLOAD = {
    "current": {
        "time": "2026-09-21T12:00",
        "temperature_2m": 31.2,
        "apparent_temperature": 34.0,
        "precipitation": 0.4,
        "weather_code": 61,
        "wind_speed_10m": 12.5,
        "relative_humidity_2m": 68,
    },
    "daily": {
        "time": ["2026-09-21", "2026-09-22", "2026-09-23"],
        "weather_code": [61, 3, 95],
        "temperature_2m_max": [33.0, 30.0, 29.0],
        "temperature_2m_min": [24.0, 23.0, 22.0],
        "precipitation_probability_max": [60, 20, 75],
    },
    "hourly": {
        "time": ["2026-09-21T11:00", "2026-09-21T12:00", "2026-09-21T13:00"],
        "temperature_2m": [30.5, 31.2, 31.8],
        "precipitation_probability": [55, 60, 62],
        "weather_code": [61, 61, 63],
    },
}


def test_describe_weather_code_known_and_unknown():
    assert weather.describe_weather_code(0) == "Clear sky"
    assert weather.describe_weather_code(61) == "Slight rain"
    assert weather.describe_weather_code(-1) == "Unknown conditions"


@pytest.mark.anyio
async def test_fetch_current_conditions_normalizes_open_meteo_response(monkeypatch):
    def handler(request):
        return httpx.Response(200, json=OPEN_METEO_PAYLOAD)

    real_async_client = httpx.AsyncClient
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *args, **kwargs: real_async_client(transport=httpx.MockTransport(handler)),
    )

    conditions = await weather.fetch_current_conditions(17.385, 78.4867)

    assert conditions["temperature_c"] == 31.2
    assert conditions["condition"] == "Slight rain"
    # forecast skips today (index 0), so it starts from tomorrow.
    assert conditions["forecast"][0]["date"] == "2026-09-22"
    assert len(conditions["forecast"]) == 2
    assert conditions["high_c"] == 33.0
    assert conditions["hourly"][0]["time"] == "2026-09-21T12:00"


@pytest.mark.anyio
async def test_fetch_current_conditions_raises_on_http_error(monkeypatch):
    def handler(request):
        return httpx.Response(500)

    real_async_client = httpx.AsyncClient
    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *args, **kwargs: real_async_client(transport=httpx.MockTransport(handler)),
    )

    with pytest.raises(weather.WeatherUnavailableError):
        await weather.fetch_current_conditions(17.385, 78.4867)


def test_weather_route_grounded(client, monkeypatch):
    async def fake_fetch(lat, lon):
        return {
            "fetched_at": "2026-09-21T12:00",
            "temperature_c": 31.2,
            "feels_like_c": 34.0,
            "precipitation_mm": 0.4,
            "humidity_percent": 68,
            "wind_speed_kmh": 12.5,
            "condition": "Slight rain",
            "forecast": [],
            "hourly": [],
            "high_c": 33.0,
            "low_c": 24.0,
            "rain_chance_percent": 60,
        }

    monkeypatch.setattr(main, "fetch_current_conditions", fake_fetch)

    response = client.get("/weather", params={"district": "Hyderabad"})

    assert response.status_code == 200
    body = response.json()
    assert body["district"] == "Hyderabad"
    assert body["source"] == "open-meteo"
    assert body["condition"] == "Slight rain"


def test_weather_route_unavailable_returns_503(client, monkeypatch):
    async def fake_fetch(lat, lon):
        raise weather.WeatherUnavailableError("boom")

    monkeypatch.setattr(main, "fetch_current_conditions", fake_fetch)

    response = client.get("/weather", params={"district": "Hyderabad"})

    assert response.status_code == 503


def test_weather_route_unknown_district_returns_404(client):
    response = client.get("/weather", params={"district": "Nowhereville"})

    assert response.status_code == 404
