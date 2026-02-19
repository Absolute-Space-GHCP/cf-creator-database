# Testing & Deploy Plan — Deployed URL, Temp Testing UI, Feedback Loop

**Goal:** Deployed URL with an interface that supports the testing strategy; all connections verified; temp web UI for what needs to be tested and tweaked; thumbs up/down feedback into a monitored sheet (location TBD); testing data confirmed before Dan tests (Dan may provide data). Clarify external/cultural "live" data layer and how we fit.

---

## 1. Success criteria

- **Deployed URL** — Engine and temp testing UI live on Cloud Run (or agreed host), with all connections working.
- **Connections verified** — Firestore, Gemini/Vertex (or API key), health and match/categorize/semantic endpoints return expected behavior.
- **Temp testing UI** — Single page with:
  - **Match by brief** — Paste brief → POST /api/v1/match → show ranked creators.
  - **Thumbs up / thumbs down** — Per result or per response; feedback sent to monitored sheet (location TBD).
  - Optional: semantic search and list creators for sanity checks.
- **Feedback loop** — Thumbs up/down (and optional comment) → API → append row to Google Sheet when `FEEDBACK_SHEET_ID` is set (tab name TBD).
- **Testing data** — Confirm creators exist in Firestore before Dan tests; Dan may supply the test dataset.

---

## 2. Deploy

- **Target:** Cloud Run (project catchfire-app-2026), region us-central1.
- **Command:** `npm run deploy` (see package.json: `gcloud run deploy cf-matching-engine --source .`).
- **Before first deploy:** Ensure you're logged in and have access to the project:
  ```bash
  gcloud auth login
  gcloud auth application-default login
  gcloud config set project catchfire-app-2026
  ```
  Then from the repo root: `npm run deploy`.
- **Env in Cloud Run:** After first deploy, set env vars in the Cloud Run console (or `gcloud run services update`) for `GCP_PROJECT_ID`, `GCP_REGION`, `FIRESTORE_COLLECTION`, `GEMINI_MODEL`; optional: `FEEDBACK_SHEET_ID`, `FEEDBACK_TAB_NAME`. For Gemini without Vertex: `GEMINI_API_KEY` or `GOOGLE_API_KEY`.
- **Post-deploy checks:** Hit `https://<service-url>/health`, then `https://<service-url>/testing` for one match and one thumbs up/down.

---

## 3. Temp testing UI

- **URL:** `/testing` (serves `public/testing.html`).
- **Features:**
  - Text area for client brief + "Match" button → POST /api/v1/match → display ranked creators (name, craft, score, reasons).
  - For each result (or for the whole response): 👍 / 👎 buttons that call POST /api/v1/feedback with `rating: 'up'|'down'`, plus optional comment.
  - Optional: link to list creators and to semantic search for quick verification.
- **Purpose:** Enough functionality to run the testing strategy, verify match quality, and collect feedback for iteration.

---

## 4. Feedback → Sheet (location TBD)

- **API:** POST /api/v1/feedback  
  Body: `{ event, briefOrQuery, sessionId?, resultId?, creatorId?, rating: 'up'|'down', comment? }`.
- **Back end:** If `FEEDBACK_SHEET_ID` (and optionally `FEEDBACK_TAB_NAME`) is set, append one row per submission to that sheet via `src/feedback-sheet.js`. Columns: **timestamp**, **event**, **briefOrQuery**, **sessionId**, **resultId**, **creatorId**, **rating** (👍/👎), **comment**. Sheet must have at least 8 columns (A–H); header row optional (append appends to next row).
- **Sheet location:** TBD (e.g. shared CatchFire Google Sheet; tab name TBD). Once decided, set env in Cloud Run and document in README or SETUP.

---

## 5. Testing data

- **Before Dan tests:** Confirm Firestore `creators` has enough records for match and semantic to be meaningful (e.g. Golden Records import or manual adds).
- **Dan may provide data:** If Dan supplies a list or file, use POST /api/v1/creators/batch or Apify import path to load it, then run a quick match test.
- **Checklist:** [ ] Creators count > 0; [ ] At least one match returns results for a sample brief; [ ] Thumbs up/down writes to sheet when configured.

---

## 6. External layer for cultural / "live" data — how we fit

- **What we have today:**  
  - **Scraper / ingest** = our "external" layer: Apify, batch import, planned scraping from festivals, platforms, communities (PLAN §3). Data is ingested into Firestore; it is not real-time "live" in the sense of a streaming API.
  - **Analyzer** = LLM categorization and style/tags from bios and metadata (no separate cultural API).

- **"Cultural" or "live" in deck/docs:**  
  - Not explicitly named as a separate system in the deck digest or docx. Use case C ("topic expertise, POV, or mood" e.g. "authentic and attractive to Gen Z, particularly when it comes to cars") is about **matching** to those needs, not about a dedicated cultural data feed.
  - So today: **cultural/live** = whatever is already in creator records (subject matter, tone, platform fit, style) plus future tagging; we do not yet have a dedicated "cultural live data" API or real-time trend feed.

- **How we fit in the plan:**  
  - **Current:** External data enters via **Scraper/ingest** → Firestore → **Analyzer** (LLM) → **Search/match**. Any "cultural" or "live" signal would need to be either (a) part of scraped/imported creator content, or (b) a future integration (e.g. trend API, social listening, or curated "live" list) that feeds into ingest or into match filters.
  - **Recommendation:** Call out in PLAN or TASKS: "External/cultural live data layer: TBD. Options: (1) Enrich creator records from trend/cultural sources during ingest; (2) Add a separate live/trend feed that influences match or filters. Current scope: Scraper + Analyzer + Search; cultural/live is future unless Dan specifies."

---

## 7. Checklist before "Dan testing"

| Item | Owner | Status |
|------|--------|--------|
| Deploy to Cloud Run, URL stable | DevOps / eng | ✅ rev 00005-8vf, 2026-02-18 |
| Env vars set (GCP, Firestore, Gemini, optional Sheets) | DevOps / eng | ✅ All set except FEEDBACK_SHEET_ID |
| Health + match + categorize verified on deployed URL | Eng | ✅ 29/29 smoke tests passing |
| Temp testing UI at /testing live on deployed URL | Eng | ✅ With comment field + visual feedback |
| FEEDBACK_SHEET_ID + tab decided and set | PM / Dan | 📋 TBD — blocked on Dan |
| Thumbs up/down appends to sheet verified | Eng | ✅ API works, sheet append ready when ID set |
| Testing data in Firestore (or load Dan's data) | Eng / Dan | ✅ 15 creators, 11 Golden Records |
| External/cultural live data: confirm scope with Dan | PM | 📋 |

---

_CatchFire — Finding craft, not clout._
