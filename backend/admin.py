"""Admin login — the one password check in this app. See auth.py for why."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from auth import ADMIN_PASSWORD, create_admin_session

router = APIRouter(prefix="/admin", tags=["admin"])


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
def login(payload: LoginRequest):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"token": create_admin_session()}
