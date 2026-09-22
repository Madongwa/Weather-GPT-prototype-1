"""
Grounding Layer data-gathering for the Ask pipeline described on the
About screen. Live weather (see weather.py, called directly from
main.py) and a Tavily-sourced web search biased toward IMD/NDMA (see
search.py) are gathered here and handed back to the frontend as-is.

The "LLM phrasing" step that used to live in this file (a Groq call)
now runs entirely on-device in the app instead — see
frontend/src/llm/. No LLM call happens on the backend anymore; this
module is just the live-data half of what used to be the whole /ask
pipeline.
"""

from search import SearchUnavailableError, search_weather_advisories


async def gather_advisories(district: str, question: str) -> list[dict]:
    """
    Web search is allowed to fail independently of weather grounding —
    losing it degrades to Open-Meteo-only grounding rather than failing
    the whole question.
    """
    try:
        return await search_weather_advisories(district, question)
    except SearchUnavailableError:
        return []
