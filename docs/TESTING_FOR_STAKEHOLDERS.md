# Testing the CatchFire Matching Engine — For Dan & Stakeholders

**Purpose:** What’s done, how to run it, and how to test (including POST /match) so Dan (or others) can try the engine.

---

## What’s the interface?

- **REST API** — Primary interface. All capabilities (match, list creators, categorize, etc.) are HTTP endpoints.
- **Beta Control Center** — Web UI at **`/`** (root): health, **Semantic Search** (description → similar creators), API links, service status. Uses `POST /api/v1/search/semantic`.
- **Dashboard** — Monitoring UI at **`/dashboard`**: stats and service status.
- **Catchfire MVP** (Next.js) — Not part of this repo. The deck describes it as the future client-facing app; this engine is the backend it would call.

**Note:** The core “brief in → ranked creators out” flow is **POST /api/v1/match**. The Beta Control Center currently only wires **Semantic Search** (POST /api/v1/search/semantic). To test **match by brief** you can use curl/Postman (see below) or we can add a “Match by brief” section to the Control Center.

---

## What you need to run and test

1. **Environment**
   - Node.js 20+ (22+ preferred).
   - `.env` from `.env.example`: at least `GCP_PROJECT_ID`, `GCP_REGION`, `FIRESTORE_COLLECTION=creators`, `GEMINI_MODEL=gemini-2.5-flash`.
   - GCP auth: Application Default Credentials (`gcloud auth application-default login`) **or** `GEMINI_API_KEY` / `GOOGLE_API_KEY` for Gemini.

2. **Data**
   - Firestore collection `creators` with some creator documents (e.g. Golden Records import or manual adds). Without data, GET /creators and POST /match will return empty or minimal results.

3. **Start the server**
   ```bash
   npm install
   npm start
   ```
   Server runs at **http://localhost:8090** (or `PORT` in `.env`).

4. **Quick checks**
   - **Health:** Open http://localhost:8090/health (JSON).
   - **UI:** Open http://localhost:8090 (Beta Control Center) and http://localhost:8090/dashboard.
   - **List creators:** GET http://localhost:8090/api/v1/creators (optional: `?craft=cinematographer&limit=5`).
   - **Match by brief:** See “Testing POST /api/v1/match” below.
   - **Semantic search (UI):** On the Control Center, type a description and click Search.

---

## Testing POST /api/v1/match (brief → ranked creators)

This is the main “client brief in, ranked creators out” endpoint. No UI for it yet; use **curl** or **Postman**.

**Request:**
```bash
curl -X POST http://localhost:8090/api/v1/match \
  -H "Content-Type: application/json" \
  -d '{"brief": "Need a cinematographer for a moody fashion film, ARRI experience, NYC or LA.", "filters": {"limit": 5}}'
```

**Optional filters (same body):**
- `filters.craft` — e.g. `"cinematographer"`
- `filters.location` — e.g. `"New York"`
- `filters.subjectMatter` — e.g. `"fashion"` or `["fashion","beauty"]`
- `filters.primaryMedium` — `"still"` | `"video"` | `"audio"`
- `filters.budgetTier` — `"emerging"` | `"mid-tier"` | `"established"`
- `filters.minQualityScore` — number 0–100
- `filters.goldenRecordsOnly` — true/false

**Response:** `{ success, brief, extractedKeywords, matchCount, matches[] }` with ranked creators and match reasons.

---

## What remains to enable Dan to test

| Item | Status | Notes |
|------|--------|--------|
| Server runs locally | ✅ | `npm start` after `.env` + GCP auth or API key |
| Firestore has creators | ⚠️ | Needs at least a few records (e.g. Golden Records) for match/semantic to be meaningful |
| Health + UI (Control Center + Dashboard) | ✅ | Use for smoke test and semantic search |
| POST /match testable without UI | ✅ | curl/Postman; see above |
| “Match by brief” in Control Center | 📋 Optional | Would let Dan paste a brief and see ranked creators in the browser |
| Deployed URL (e.g. Cloud Run) | 📋 Optional | If Dan can’t run locally; `npm run deploy` or CI/CD |

**Recommendation:** Ensure Firestore has a small set of creators (e.g. run Golden Records import or add a few via POST /api/v1/creators). Then Dan can run `npm start`, open the Control Center, try Semantic Search, and use curl/Postman for POST /api/v1/match. Adding a “Match by brief” panel to the Control Center would make match testing easier without leaving the browser.

---

**Temp testing UI:** Use **/testing** for match-by-brief and 👍/👎 feedback; see **docs/TESTING_AND_DEPLOY_PLAN.md** for deploy goal, feedback sheet (location TBD), and external/cultural data layer note.

_CatchFire — Finding craft, not clout._
