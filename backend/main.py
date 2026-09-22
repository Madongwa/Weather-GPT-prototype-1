"""
WeatherGPT backend — FastAPI app.

/health is a liveness check the frontend polls to drive the connectivity
dot. /weather and /ask are the two real (non-mock) data routes — Open-
Meteo, and live grounding data (that same weather plus a Tavily web
search, see ask.py / search.py) for the app's on-device LLM to phrase
into an answer (see frontend/src/llm/) — no LLM call happens on the
backend itself. Everything else
(alerts, sos, reports, notifications, checkins, geofence, status,
admin) is real, persisted (SQLite via db.py) app functionality, not
mock data — see each module's own docstring for what's still a stand-in
(e.g. geofence.py's simplified district polygons) versus fully real.
"""

import os

from dotenv import load_dotenv

# Must run before search.py's TAVILY_API_KEY check happens (per-request,
# but the env var needs to already be set by then) — loads backend/.env
# into the process environment. See .env.example.
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
from ask import gather_advisories
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
    # The packaged Android app (see frontend/android/) isn't a normal web
    # origin — Capacitor's WebView serves the bundled app from this fixed
    # origin by default (see frontend/capacitor.config.json — no
    # `server.hostname` override), regardless of what machine or emulator
    # it's running on. Without this, every fetch from the app fails CORS
    # before even reaching a route (confirmed via logcat: requests were
    # sent, but the browser blocked the response client-side).
    "https://localhost",
]

# The deployed frontend's origin (e.g. https://weather-gpt-....vercel.app)
# isn't known until that deploy exists, so it comes from an env var rather
# than being hardcoded here.
if extra_origin := os.environ.get("FRONTEND_ORIGIN"):
    origins.append(extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app" if os.environ.get("VERCEL") else None,
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


class AskContextRequest(BaseModel):
    question: str
    district: str
    role: str = "General citizen"


@app.post("/ask")
async def post_ask(payload: AskContextRequest):
    """
    Grounding-only route: fetches live weather for the district (if
    known) plus a live web search biased toward IMD/NDMA (see
    search.py), and hands both back as-is. `grounded` reflects whether
    at least one of those live fetches actually succeeded. The app's
    on-device LLM (see frontend/src/llm/) turns this into the actual
    answer — no LLM call happens here.
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
            pass  # Fall through and let the on-device LLM answer without weather grounding.

    advisories = await gather_advisories(payload.district, payload.question)
    if advisories:
        grounded = True

    source_parts = []
    if weather_summary:
        source_parts.append("Open-Meteo")
    if advisories:
        source_parts.append("web search")
    source_label = f"{' + '.join(source_parts)} · live" if source_parts else "No live data available"

    return {
        "weather_summary": weather_summary,
        "grounded": grounded,
        "source_label": source_label,
        "sources": advisories,
    }
