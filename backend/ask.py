"""
LLM-driven question answering — the Grounding Layer -> Arbiter -> LLM
phrasing pipeline described on the About screen, now with a real second
live source: Open-Meteo (current conditions, see weather.py) and
Tavily-sourced web results biased toward IMD/NDMA (see search.py). The
"Arbiter" step here is still simple — both sources just get handed to
the LLM together rather than being algorithmically cross-checked — but
it's no longer the single-source stand-in the project started with.

Phrasing runs on Groq (an OpenAI-compatible chat completions API
hosting open models — a fast-inference platform, not to be confused
with xAI's similarly-named Grok, which was the original ask here but
requires paid credits with no free tier; see .env.example) rather than
Claude. `MODEL` below is a reasoning model (gpt-oss-120b);
`reasoning_effort: "low"` keeps it fast for a short conversational
answer instead of spending its token budget on visible chain-of-thought.
"""

import os

import httpx

from search import SearchUnavailableError, search_weather_advisories

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are WeatherGPT, a disaster-preparedness assistant for \
Indian citizens, built for a Ministry of Earth Sciences / IMD hackathon project.

Answer the user's question in 1-3 short, plain-language sentences, tailored to \
their stated role (e.g. a farmer cares about harvesting, a driver about road \
conditions).

Ground every specific claim (temperature, rain, wind, warnings) in the CURRENT \
CONDITIONS and WEB ADVISORIES data given to you — never invent numbers or \
forecasts that aren't in that data. If neither is available, say plainly that \
live data isn't available right now, and give only general, non-specific safety \
guidance.

Stick to facts — what the weather is and is forecast to be. Don't give step-by-step \
action plans, checklists, or "you should do X" instructions here; if the user is \
really asking what to do, answer the factual part and point them to the app's \
"My Advice" section for role-specific guidance instead of improvising a plan.

Always end with a short reminder that this is decision support, not an official \
instruction, and to follow IMD/government warnings first."""


class AskUnavailableError(Exception):
    """Raised when the phrasing LLM call itself fails."""


def _format_advisories(advisories: list[dict]) -> str:
    if not advisories:
        return "No additional web advisories found."
    return "\n\n".join(f"- {a['title']} ({a['url']}): {a['content'][:400]}" for a in advisories)


async def answer_question(
    question: str,
    district: str,
    role: str,
    weather_summary: str | None,
) -> tuple[str, list[dict]]:
    # Checked up front rather than left to raise from inside the SDK/
    # HTTP call — an unhandled exception here would escape FastAPI's
    # own exception handling (Starlette's ServerErrorMiddleware sits
    # outside CORSMiddleware), producing a raw response with no CORS
    # headers instead of a clean 503. See main.py's /ask route, which
    # catches AskUnavailableError and turns it into one.
    if not os.environ.get("GROQ_API_KEY"):
        raise AskUnavailableError("GROQ_API_KEY is not configured.")

    # The web-search source is allowed to fail independently — losing
    # it degrades to Open-Meteo-only grounding (the original single-
    # source behavior) rather than failing the whole question.
    try:
        advisories = await search_weather_advisories(district, question)
    except SearchUnavailableError:
        advisories = []

    conditions_text = (
        weather_summary
        if weather_summary
        else "Not available — live weather data could not be fetched for this district."
    )

    user_content = (
        f"District: {district}\n"
        f"Role: {role}\n\n"
        f"Current conditions:\n{conditions_text}\n\n"
        f"Web advisories:\n{_format_advisories(advisories)}\n\n"
        f"Question: {question}"
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    "max_tokens": 400,
                    "reasoning_effort": "low",
                },
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise AskUnavailableError(str(exc)) from exc

    answer = data["choices"][0]["message"]["content"]
    return answer, advisories
