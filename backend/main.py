"""
WeatherGPT backend — FastAPI app.

/health is a liveness check the frontend polls to drive the connectivity
dot. /weather and /ask are the two real (non-mock) data routes — Open-
Meteo and a Claude call grounded in that same weather data. Everything
else (alerts, sos, reports, notifications, checkins, geofence, status,
admin) is real, persisted (SQLite via db.py) app functionality, not
mock data — see each module's own docstring for what's still a stand-in
(e.g. geofence.py's simplified district polygons) versus fully real.
"""

from dotenv import load_dotenv

# Must run before ask.py's AsyncAnthropic() client is constructed (which
# happens per-request, but the env var needs to already be set by then) —
# loads backend/.env into the process environment. See .env.example.
load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import admin
import alerts
import checkins
import geofence
import notifications
import reports
import sos
import status as status_router
from ask import AskUnavailableError, answer_question
from db import init_db
from districts import DISTRICT_COORDINATES
from weather import WeatherUnavailableError, fetch_current_conditions

app = FastAPI(title="WeatherGPT API")

for router_module in (admin, alerts, checkins, geofence, notifications, reports, sos, status_router):
    app.include_router(router_module.router)


@app.on_event("startup")
def on_startup():
    # A startup event (not a bare module-level call) so tests can
    # monkeypatch db.DB_PATH to a temp file before the schema is created —
    # see tests/test_main.py.
    init_db()

# --- CORS ---------------------------------------------------------------
# The frontend (Vite dev server) and this backend run on different ports
# during local development (e.g. http://localhost:5173 vs
# http://localhost:8000). Browsers block cross-origin requests by default
# unless the SERVER explicitly says "this origin is allowed" via CORS
# (Cross-Origin Resource Sharing) response headers. CORSMiddleware adds
# those headers for us. In production, if frontend and backend end up
# served from the same origin, this can be tightened or removed.
origins = [
    # Vite's default dev port is 5173, but it auto-increments (5174, 5175, ...)
    # if that port is already taken on your machine, so we allow a small range.
    *(f"http://localhost:{port}" for port in range(5173, 5178)),
    *(f"http://127.0.0.1:{port}" for port in range(5173, 5178)),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Simple liveness check the frontend uses to drive the connectivity dot."""
    return {"status": "ok"}


@app.get("/weather")
async def get_weather(district: str = Query(..., description="One of the sample districts")):
    """
    Real current-conditions data for a district, sourced live from
    Open-Meteo — nothing here is mocked. The frontend only calls this
    outside Demo Mode (see useWeather.js / HomeScreen.jsx); Demo Mode
    shows static sample text instead so it never depends on this route
    actually succeeding.
    """
    coordinates = DISTRICT_COORDINATES.get(district)
    if coordinates is None:
        raise HTTPException(status_code=404, detail=f"No coordinates configured for district '{district}'")

    try:
        conditions = await fetch_current_conditions(*coordinates)
    except WeatherUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Open-Meteo is unreachable right now") from exc

    return {
        "district": district,
        "source": "open-meteo",
        **conditions,
    }


class AskRequest(BaseModel):
    question: str
    district: str
    role: str = "General citizen"


@app.post("/ask")
async def post_ask(payload: AskRequest):
    """
    LLM-driven Q&A. Tries to fetch live weather for the district first and
    hands that to Claude as grounding context; `grounded` in the response
    reflects whether that fetch actually succeeded, not whether Claude
    merely sounds confident — see ask.py's docstring for why this is a
    deliberately simple first cut of the Arbiter/Grounding concept.
    """
    coordinates = DISTRICT_COORDINATES.get(payload.district)
    weather_summary: str | None = None
    grounded = False

    if coordinates is not None:
        try:
            conditions = await fetch_current_conditions(*coordinates)
            weather_summary = (
                f"{conditions['condition']}, {conditions['temperature_c']}°C, "
                f"{conditions['precipitation_mm']}mm precipitation, "
                f"wind {conditions['wind_speed_kmh']} km/h "
                f"(as of {conditions['fetched_at']})"
            )
            grounded = True
        except WeatherUnavailableError:
            pass  # Fall through and let Claude answer without live grounding.

    try:
        answer = await answer_question(
            question=payload.question,
            district=payload.district,
            role=payload.role,
            weather_summary=weather_summary,
        )
    except AskUnavailableError as exc:
        raise HTTPException(status_code=503, detail="The LLM service is unreachable right now") from exc

    return {
        "answer": answer,
        "grounded": grounded,
        "source_label": "Open-Meteo · live" if grounded else "No live data available",
        "model": "claude-opus-5",
    }
