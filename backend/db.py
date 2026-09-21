"""
Lightweight SQLite persistence layer.

Plain sqlite3 rather than an ORM — this app has half a dozen simple
tables and no complex relational queries, so an ORM would be more
machinery than the problem needs. init_db() creates every table if it
doesn't already exist; the .db file itself is gitignored.
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent / "weathergpt.db"


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS devices (
                device_id TEXT PRIMARY KEY,
                role TEXT,
                district TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hazard_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Issued',
                description TEXT NOT NULL,
                district TEXT,
                is_simulated INTEGER NOT NULL DEFAULT 0,
                expires_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS sos_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                needs TEXT NOT NULL,
                people_count INTEGER NOT NULL DEFAULT 1,
                medical_needed INTEGER NOT NULL DEFAULT 0,
                detail TEXT,
                district TEXT,
                status TEXT NOT NULL DEFAULT 'Sending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS people_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                report_type TEXT NOT NULL,
                description TEXT,
                location_text TEXT,
                district TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                level TEXT NOT NULL DEFAULT 'info',
                read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS safe_checkins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                status TEXT NOT NULL,
                note TEXT,
                district TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            -- Emergency-official sessions. Citizens never authenticate (the
            -- app is meant to work for anonymous people in a hurry); the
            -- only real trust boundary is "can issue an official alert",
            -- which is what this table gates. See auth.py.
            CREATE TABLE IF NOT EXISTS admin_sessions (
                token TEXT PRIMARY KEY,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
