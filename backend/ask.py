"""
LLM-driven question answering — the first real (non-mock) "Ask" logic.

This grounds Claude's answer directly in the same live Open-Meteo data
/weather serves, by putting it straight into the prompt. That's a
deliberately simple first version of the Arbiter/Grounding Layer concept
from the project's architecture: with exactly one real data source right
now, "grounded" just means "did we actually have that source's data when
we answered." A real Arbiter — cross-checking multiple sources and
flagging conflicts — is worth building once there's a second live source
(e.g. IMD's own feed) to reconcile against.
"""

import anthropic

MODEL = "claude-opus-5"

SYSTEM_PROMPT = """You are WeatherGPT, a disaster-preparedness assistant for \
Indian citizens, built for a Ministry of Earth Sciences / IMD hackathon project.

Answer the user's question in 1-3 short, plain-language sentences, tailored to \
their stated role (e.g. a farmer cares about harvesting, a driver about road \
conditions).

Ground every specific claim (temperature, rain, wind, warnings) in the CURRENT \
CONDITIONS data given to you — never invent numbers or forecasts that aren't in \
that data. If no current-conditions data is provided, say plainly that live data \
isn't available right now, and give only general, non-specific safety guidance.

Always end with a short reminder that this is decision support, not an official \
instruction, and to follow IMD/government warnings first."""


class AskUnavailableError(Exception):
    """Raised when the Claude API call itself fails."""


async def answer_question(
    question: str,
    district: str,
    role: str,
    weather_summary: str | None,
) -> str:
    # No explicit api_key= — the SDK reads ANTHROPIC_API_KEY from the
    # environment (see .env.example / load_dotenv() in main.py).
    client = anthropic.AsyncAnthropic()

    conditions_text = (
        weather_summary
        if weather_summary
        else "Not available — live weather data could not be fetched for this district."
    )

    user_content = (
        f"District: {district}\n"
        f"Role: {role}\n\n"
        f"Current conditions:\n{conditions_text}\n\n"
        f"Question: {question}"
    )

    try:
        # effort "low": this is a short conversational answer, not a hard
        # reasoning task, so we trade away thinking depth for latency —
        # worth revisiting if answer quality turns out to need more.
        response = await client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            output_config={"effort": "low"},
            messages=[{"role": "user", "content": user_content}],
        )
    except anthropic.APIError as exc:
        raise AskUnavailableError(str(exc)) from exc

    return next((block.text for block in response.content if block.type == "text"), "")
