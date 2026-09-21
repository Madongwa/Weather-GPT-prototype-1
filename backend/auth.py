"""
Auth/session model — deliberately minimal.

Two different trust levels exist in this app, and they don't need the
same mechanism:

1. Ordinary citizens never log in. The app has to work for someone in a
   hurry during a disaster, so requiring an account would be actively
   harmful. Instead, the frontend generates a random UUID once
   (localStorage) and sends it as `X-Device-Id` on requests that need to
   attribute something to "whoever sent this" (an SOS, a report) without
   asking who they are. `get_device_id` below just upserts a row so we
   have somewhere to hang that attribution — it is identity-lite, not
   authentication.

2. Issuing an official alert is a real trust boundary — only someone
   acting as "Emergency official" should be able to do it. For that we
   use a genuine (if simple) password check against an env var, handing
   back a random bearer token that's checked on every admin-only route.
   This is intentionally not OAuth/JWT — one shared password for the one
   admin capability this app has is proportionate to the actual risk
   here, not a security shortcut taken to save time.
"""

import os
import secrets

from fastapi import Header, HTTPException

from db import get_connection

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme-admin")


def get_device_id(x_device_id: str = Header(...)) -> str:
    """FastAPI dependency: requires the frontend's X-Device-Id header and
    makes sure a matching `devices` row exists."""
    with get_connection() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO devices (device_id) VALUES (?)",
            (x_device_id,),
        )
    return x_device_id


def create_admin_session() -> str:
    token = secrets.token_urlsafe(32)
    with get_connection() as conn:
        conn.execute("INSERT INTO admin_sessions (token) VALUES (?)", (token,))
    return token


def require_admin(authorization: str = Header(...)) -> None:
    """FastAPI dependency for admin-only routes. Expects `Authorization:
    Bearer <token>` from a prior successful /admin/login."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ")

    with get_connection() as conn:
        row = conn.execute(
            "SELECT token FROM admin_sessions WHERE token = ?", (token,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid or expired admin session")
