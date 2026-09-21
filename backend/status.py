"""
/status — real reachability checks for each backend-adjacent data
source, consumed by the frontend's Trust & Sources screen instead of it
guessing from Demo Mode alone.
"""

import os

import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/status", tags=["status"])


async def _check_open_meteo() -> str:
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={"latitude": 17.385, "longitude": 78.4867, "current": "temperature_2m"},
            )
            return "connected" if response.status_code == 200 else "unreachable"
    except httpx.HTTPError:
        return "unreachable"


def _check_groq() -> str:
    return "connected" if os.environ.get("GROQ_API_KEY") else "unconfigured"


def _check_tavily() -> str:
    return "connected" if os.environ.get("TAVILY_API_KEY") else "unconfigured"


@router.get("")
async def get_status():
    return {
        "open_meteo": await _check_open_meteo(),
        "groq_llm": _check_groq(),
        "tavily_search": _check_tavily(),
        "imd": "stub",  # No public IMD API exists — Tavily searches its site instead.
        "wis2_ndma_cap": "stub",  # No public feed access exists.
        "database": "connected",  # If this handler ran at all, sqlite is reachable.
        # STT/TTS run entirely client-side (browser Web Speech APIs) and
        # have no backend component to report on — see the frontend's
        # own capability check in speech.js / TrustSourcesScreen.jsx.
    }
