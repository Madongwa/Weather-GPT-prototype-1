# WeatherGPT

Smart India Hackathon — Problem Statement 26068: *"WeatherGPT: Conversational
AI for Weather Forecasting, Alerts, and Climate Information"* (Ministry of
Earth Sciences / India Meteorological Department, Disaster Management theme).
Built by team **Parallax**.

A disaster-preparedness assistant for Indian citizens: ask it a weather
question by text or voice and it answers in plain language, grounded only in
live data — never a model's guess.

## How it's grounded

Every answer is built from two live sources, nothing else:

- **Open-Meteo** — real current conditions (temperature, precipitation, wind)
  for the selected district.
- **IMD / NDMA** — a live web search (via Tavily) restricted to
  `imd.gov.in`, `mausam.imd.gov.in`, `ndma.gov.in`, and state disaster
  management sites, so real government advisories reach the answer even
  without a direct public API from either.

A small LLM then turns that data into a short, plain-language sentence — and
runs **entirely on-device** (llama.cpp compiled to WebAssembly, via
[wllama](https://github.com/ngxson/wllama)), both in the browser and inside
the packaged Android app. No cloud LLM call, no API key, nothing leaves the
device for that step. A rule-based check on the output catches two failure
modes small on-device models are prone to (a repeated-token loop, or
incoherent symbol-noise output) and falls back to a plain sentence built
directly from the weather data if either happens, so the user is never shown
something inaccurate or nonsensical.

## What's in the app

- **Ask** — chat and voice Q&A (native Android speech recognition + browser
  text-to-speech), grounded and cited as above.
- **Home** — at-a-glance hazard status for the selected district, plus the
  same ask flow in a hero card.
- **Forecast** — live Open-Meteo forecast.
- **Alerts** — real alert lifecycle (detected → issued → advancing), backed
  by SQLite, with scenario simulators for demoing without waiting for real
  weather.
- **SOS / Community Reports / Check-ins** — persisted, real endpoints (not
  mock data) for field reporting.
- **My Advice** — role-specific guidance (farmer, driver, general citizen,
  emergency official) driven by current conditions.
- **Trust & Sources** — a live status board showing exactly which data
  sources are real vs. stubbed right now, plus a Demo Mode switch (Demo /
  IMD-only / Hybrid) so the app is always honest about what's real during a
  demo instead of quietly mixing in mock data.
- **Notifications, Geofencing, Admin** — real backend functionality; see each
  module's own docstring in `backend/` for what's still a deliberate stand-in
  (e.g. simplified rectangular district boundaries) vs. fully real.

## Architecture

```
weathergpt/
  frontend/   React (Vite) app — the UI, on-device LLM (src/llm/), Capacitor
              Android wrapper (android/)
  backend/    FastAPI app — Open-Meteo + IMD/NDMA grounding, alerts, SOS,
              reports, admin (SQLite via db.py)
```

The backend is grounding-only — it fetches live weather and web-search data
and hands it back as-is. The frontend's on-device LLM does all the phrasing.
See `backend/main.py` and `frontend/src/llm/localLLM.js` for the full
data flow.

Deployed on Vercel: backend and frontend as separate projects, communicating
over HTTPS (see `frontend/src/api/client.js`'s `VITE_API_BASE`). The Android
app is built with [Capacitor](https://capacitorjs.com/) from the same
frontend codebase.

## Running it locally

You need two terminals: one for the backend, one for the frontend — they're
independent processes that talk to each other over HTTP.

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env           # fill in TAVILY_API_KEY (optional — falls
                                # back to Open-Meteo-only grounding without it)
uvicorn main:app --reload
```

API runs at `http://127.0.0.1:8000` — visit `/health` for a liveness check,
`/docs` for interactive API docs. Run the test suite with `pytest`.

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run model:fetch   # downloads the on-device LLM's GGUF weights (~250MB) —
                       # not committed to git, only needed once
npm run dev
```

Vite prints a local URL (normally `http://localhost:5173`). Run tests with
`npm test`.

### Android app

```bash
cd frontend
npm run model:fetch   # if not already done
npm run build
npx cap sync android
cd android
./gradlew assembleDebug   # outputs app/build/outputs/apk/debug/app-debug.apk
```

Requires the Android SDK and a JDK on `JAVA_HOME`. Set `VITE_API_BASE` to
the deployed backend URL before `npm run build` so the packaged app talks to
production instead of `http://127.0.0.1:8000`.

## Why two separate dev servers, and what CORS has to do with it

During local development, the frontend (`localhost:5173`) and backend
(`localhost:8000`) are on different ports, and browsers treat different
ports as different "origins" — by default a browser blocks JavaScript on
one origin from reading a response from another (the Same-Origin Policy).
CORS (Cross-Origin Resource Sharing) is how a server opts back in:
`backend/main.py` sets this up via `CORSMiddleware`, explicitly allowing the
Vite dev ports, the packaged Android app's origin, and (in production) any
`*.vercel.app` origin.
