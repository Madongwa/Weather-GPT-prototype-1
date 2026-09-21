# WeatherGPT

Smart India Hackathon 2026 — Problem Statement 26068 (Ministry of Earth
Sciences / IMD).

This is the project skeleton: a React frontend and a FastAPI backend that
can talk to each other locally. No real weather logic yet — just the main
screen UI and a health-check connection between the two.

```
weathergpt/
  frontend/   React (Vite) app — the UI
  backend/    FastAPI app — the API
```

You need two terminals open at the same time: one running the backend,
one running the frontend. They're independent processes that just happen
to talk to each other over HTTP on your machine.

## Backend (FastAPI)

**Prerequisite: Python must be installed first.** Running `python` in a
terminal on Windows sometimes opens the Microsoft Store instead of
actually running Python — that means it isn't really installed yet. Get
it from https://www.python.org/downloads/ (check "Add Python to PATH"
during install) or the Microsoft Store's official Python listing, then
open a **new** terminal so it picks up the change.

From the `backend/` folder:

```bash
cd backend

# Create a virtual environment — an isolated folder holding just this
# project's Python packages, so they don't clash with anything else on
# your machine. You only need to do this once.
python -m venv venv

# Activate it (do this every time you open a new terminal to work on the
# backend). Your prompt should show a (venv) prefix once it's active.
venv\Scripts\activate          # Windows (cmd or PowerShell)
source venv/bin/activate       # macOS/Linux

# Install the packages listed in requirements.txt (FastAPI itself, and
# uvicorn, the server that actually runs it).
pip install -r requirements.txt

# Start the server with auto-reload (it restarts itself whenever you
# save a change to a .py file).
uvicorn main:app --reload
```

The API is now running at `http://127.0.0.1:8000`. Visit
`http://127.0.0.1:8000/health` in a browser — you should see
`{"status":"ok"}`. FastAPI also gives you free interactive API docs at
`http://127.0.0.1:8000/docs`.

## Frontend (React + Vite)

From the `frontend/` folder, in a separate terminal:

```bash
cd frontend

# Downloads and installs every package listed in package.json
# (React itself, Vite, etc.) into a node_modules folder. You need to
# re-run this whenever package.json changes, but not every time you
# start working.
npm install

# Starts the Vite dev server with hot-reload (saving a file updates the
# browser instantly, without a full page reload).
npm run dev
```

Vite will print a local URL, normally `http://localhost:5173` (it picks
the next free port if that one's busy, e.g. `5174`). Open it in a
browser.

If the backend is running, the small dot in the top-right of the screen
should be teal ("online"). If the backend isn't running (or crashed),
it turns amber and shows "Offline" — that's the frontend's `/health`
check from `useHealthCheck.js` failing.

## Why two separate dev servers, and what CORS has to do with it

During local development, the frontend (`localhost:5173`) and backend
(`localhost:8000`) are on different ports, and browsers treat different
ports as different "origins." By default, a browser blocks JavaScript
on one origin from reading a response from another — that's a security
feature called the Same-Origin Policy, meant to stop a malicious site
from silently reading data off another site you're logged into.

CORS (Cross-Origin Resource Sharing) is how a server opts back in: it
adds a response header saying "requests from this specific origin are
allowed." `backend/main.py` sets this up via `CORSMiddleware`, listing
`http://localhost:5173` (and a couple of nearby ports, in case Vite
picks a different one) as allowed origins. Without it, the frontend's
`fetch('http://127.0.0.1:8000/health')` call would fail in the browser
console with a CORS error, even though the backend is running fine.

## What's built so far

- Main chat screen: header (menu icon + connectivity dot), the central
  "Tap to speak" bubble, a sample answer card, and the bottom message
  input bar.
- The connectivity dot is real — it reflects an actual `/health` check
  against the backend.
- The mic bubble's "Listening…" toggle is UI-only for now (no real
  speech recognition yet).

## What's deliberately not built yet

Real weather data (IMD/Open-Meteo), the grounding/arbiter layer, actual
voice recognition, multilingual support, the PWA manifest/service
worker, and the hamburger menu's contents. The frontend is structured
(plain component folders under `src/components/`, no build config
tying us to a specific PWA setup) so a manifest + service worker can be
added later without reshuffling folders.
