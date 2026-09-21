"""
Shared pytest fixtures. `client` gives every test function its own
throwaway SQLite file (via monkeypatching db.DB_PATH before the app's
startup event runs init_db()) — so tests never touch the real
weathergpt.db and never see another test's rows.
"""

import db
import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
    with TestClient(main.app) as test_client:
        yield test_client


@pytest.fixture
def anyio_backend():
    # Pins the anyio pytest plugin (a transitive dep via FastAPI/Starlette
    # already, so no new requirement) to asyncio — the only backend this
    # project actually runs on, avoiding it also trying trio.
    return "asyncio"
