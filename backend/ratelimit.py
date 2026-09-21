"""
Minimal in-memory rate limiter — one process, one dict, good enough for
a single-instance deployment. A real multi-instance deployment would
need a shared store (Redis) instead of this dict; noted here rather
than pretended away.
"""

import time
from collections import defaultdict

from fastapi import HTTPException, Request

_hits: dict[str, list[float]] = defaultdict(list)


def rate_limit(max_requests: int = 5, window_seconds: int = 60):
    """FastAPI dependency factory: at most `max_requests` per client IP
    per `window_seconds`, sliding window. Used on SOS/report submission
    routes so one device can't flood them."""

    def dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        window_start = now - window_seconds

        hits = _hits[client_ip]
        hits[:] = [t for t in hits if t > window_start]

        if len(hits) >= max_requests:
            raise HTTPException(status_code=429, detail="Too many requests — please slow down")

        hits.append(now)

    return dependency
