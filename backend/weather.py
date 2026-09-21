"""
Open-Meteo adapter — the one real (non-mock) data source this backend
talks to so far. No API key needed; it's a free public forecast API.

Kept separate from main.py so the HTTP-route wiring and the "how do we
talk to Open-Meteo" logic don't get tangled together.
"""

import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather codes (the `weather_code` field Open-Meteo returns) mapped
# to short human-readable labels. Not every code 0-99 is listed — only
# the ones Open-Meteo's docs actually use — but describe_weather_code()
# below falls back gracefully for anything missing.
_WEATHER_CODE_LABELS: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def describe_weather_code(code: int) -> str:
    return _WEATHER_CODE_LABELS.get(code, "Unknown conditions")


class WeatherUnavailableError(Exception):
    """Raised when Open-Meteo can't be reached or returns something unusable."""


async def fetch_current_conditions(latitude: float, longitude: float) -> dict:
    """
    Calls Open-Meteo's forecast endpoint for the given coordinates and
    returns a small, already-normalized dict — callers shouldn't need to
    know anything about Open-Meteo's own response shape.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "temperature_2m,apparent_temperature,precipitation,weather_code,"
            "wind_speed_10m,relative_humidity_2m"
        ),
        # Daily forecast for the next few days — same free, keyless
        # endpoint, just asking for more fields.
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "forecast_days": 4,
        # Next 12 hours — powers the Home dashboard's "Next hours" strip.
        "hourly": "temperature_2m,precipitation_probability,weather_code",
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(OPEN_METEO_URL, params=params)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise WeatherUnavailableError(str(exc)) from exc

    try:
        payload = response.json()
        current = payload["current"]
        daily = payload["daily"]
        hourly = payload["hourly"]
    except (KeyError, ValueError) as exc:
        raise WeatherUnavailableError("Open-Meteo returned an unexpected response") from exc

    # Daily arrays are parallel (same index = same day) — zip them into
    # one object per day instead of making callers juggle four lists.
    # Skip index 0 (today, already covered by `current`).
    forecast = [
        {
            "date": daily["time"][i],
            "condition": describe_weather_code(daily["weather_code"][i]),
            "high_c": daily["temperature_2m_max"][i],
            "low_c": daily["temperature_2m_min"][i],
            "precipitation_probability_percent": daily["precipitation_probability_max"][i],
        }
        for i in range(1, len(daily.get("time", [])))
    ]

    # Hourly arrays cover the whole forecast window starting at today's
    # midnight — find the first entry at or after "now" (ISO 8601
    # strings sort lexicographically, so a plain string comparison
    # works) and take the next 12 from there.
    hourly_times = hourly.get("time", [])
    start_index = next((i for i, t in enumerate(hourly_times) if t >= current["time"]), 0)
    hourly_forecast = [
        {
            "time": hourly_times[i],
            "temperature_c": hourly["temperature_2m"][i],
            "precipitation_probability_percent": hourly["precipitation_probability"][i],
            "condition": describe_weather_code(hourly["weather_code"][i]),
        }
        for i in range(start_index, min(start_index + 12, len(hourly_times)))
    ]

    return {
        "fetched_at": current["time"],
        "temperature_c": current["temperature_2m"],
        "feels_like_c": current["apparent_temperature"],
        "precipitation_mm": current["precipitation"],
        "humidity_percent": current["relative_humidity_2m"],
        "wind_speed_kmh": current["wind_speed_10m"],
        "condition": describe_weather_code(current["weather_code"]),
        "forecast": forecast,
        "hourly": hourly_forecast,
        # Today's high/low come from the first daily entry (index 0),
        # which the `forecast` list above deliberately skips (it starts
        # today already coming from `current`).
        "high_c": daily["temperature_2m_max"][0] if daily.get("temperature_2m_max") else None,
        "low_c": daily["temperature_2m_min"][0] if daily.get("temperature_2m_min") else None,
        "rain_chance_percent": (
            daily["precipitation_probability_max"][0]
            if daily.get("precipitation_probability_max")
            else None
        ),
    }
