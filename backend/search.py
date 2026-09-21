"""
Live web search via Tavily — the second real grounding source alongside
Open-Meteo (see weather.py). Built specifically for feeding an LLM's
answer, not for a human to click through: each result comes back as
title + URL + an already-extracted text snippet.

Biased toward IMD's own site via `include_domains` so a search for
"weather warning <district>" actually surfaces IMD's real
subdivision-wise warning pages when they're relevant, not just generic
weather-app SEO content — this is what makes the Arbiter's second
source meaningfully different from Open-Meteo rather than a duplicate
of it.
"""

import os

import httpx

TAVILY_URL = "https://api.tavily.com/search"

TRUSTED_DOMAINS = [
    "mausam.imd.gov.in",
    "imd.gov.in",
    "ndma.gov.in",
    "sdma.telangana.gov.in",
]


class SearchUnavailableError(Exception):
    """Raised when Tavily itself can't be reached or isn't configured."""


async def search_weather_advisories(district: str, question: str) -> list[dict]:
    """
    Searches for live weather/hazard advisories relevant to a district
    and question, biased toward trusted government sources. Returns a
    list of {title, url, content} — content is Tavily's own extracted
    snippet, already plain text, ready to hand to an LLM.
    """
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        raise SearchUnavailableError("TAVILY_API_KEY is not configured.")

    query = f"{district} India weather warning advisory {question}"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                TAVILY_URL,
                json={
                    "api_key": api_key,
                    "query": query,
                    "search_depth": "basic",
                    "max_results": 4,
                    "include_domains": TRUSTED_DOMAINS,
                },
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise SearchUnavailableError(str(exc)) from exc

    return [
        {"title": r["title"], "url": r["url"], "content": r["content"]}
        for r in data.get("results", [])
    ]
