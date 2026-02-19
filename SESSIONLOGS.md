# Session Logs — CatchFire Matching Engine

Running log of development sessions: progress, failures, successes, and notable changes.  
Format inspired by other JL project session docs (e.g. jlai-ongoing-rsrcs-and-mntc-costs-monitor).

---

## Session 2026-02-11 (Review, bug fixes, deploy to Cloud Run)

**Focus:** True-up review of all prior changes; fix bugs found; deploy to Cloud Run; verify all endpoints live.

### Progress

| Item | Status |
|------|--------|
| Full code review (schemas, scoring, llm, index, testing UI, Dockerfile) | ✅ Done |
| Bug fix: `buildCreatorEmbeddingText` read `technicalTags` from `matching` (wrong); moved to `craft` | ✅ Done |
| Bug fix: embedding text now includes subjectMatterTags, primaryMedium, classification | ✅ Done |
| Bug fix: `.gitignore` excluded `tsconfig.json` via `*.json` rule — deploy would fail | ✅ Done |
| Bug fix: inconsistent cache clearing in embeddings routes (null → clearCreatorCache) | ✅ Done |
| Commit and deploy to Cloud Run | ✅ Done |
| Verify health, creators API (14 records), match, testing UI, feedback endpoint | ✅ Done |

### Successes

- **Deploy live:** `https://cf-matching-engine-34240596768.us-central1.run.app`
- All endpoints verified: `/health` (200), `/testing` (200), `/api/v1/creators` (14 creators), `/api/v1/match` (ranked results with keyword extraction), `/api/v1/feedback` (records feedback, `sheetAppended: false` until `FEEDBACK_SHEET_ID` set).
- Embedding quality improved: technical tags + taxonomy fields now included in embedding text.

### Failures / Notes

- `FEEDBACK_SHEET_ID` still TBD — feedback logs to console but doesn't append to Google Sheet yet.
- `package.json` version is `0.1.0` but actual progress is ~v0.4 (Phase 3 complete). Not blocking.
- `express` still at `^4.18.2` (CLAUDE.md targets 5.x). Not blocking.
- `@google-cloud/vertexai` still in dependencies (deprecated May 2026). Migration is a TASKS item.

### Files changed

- **Modified:** `.gitignore` (!tsconfig.json), `CLAUDE.md` (gcloud auth one-liner), `src/index.js` (cache clearing), `src/llm.ts` (embedding text bug fix + taxonomy fields)
- **Tracked:** `tsconfig.json` (was gitignored, now tracked)

---

## Session 2026-02-11 (Deploy goal, temp testing UI, feedback loop)

**Focus:** Deployed URL with interface for testing strategy; temp web UI; thumbs up/down → monitored sheet (location TBD); testing data confirmation; external/cultural live data layer clarified.

### Progress

| Item | Status |
|------|--------|
| docs/TESTING_AND_DEPLOY_PLAN.md | ✅ Done |
| POST /api/v1/feedback + feedback-sheet.js (Google Sheet append) | ✅ Done |
| GET /testing + public/testing.html (match by brief + 👍/👎) | ✅ Done |
| PLAN.md: external/cultural live data layer note | ✅ Done |
| .env.example: FEEDBACK_SHEET_ID note | ✅ Done |
| Deploy to Cloud Run (run npm run deploy) | ✅ Done (later session) |
| FEEDBACK_SHEET_ID + tab (location TBD) | 📋 TBD |

### Successes

- Temp testing UI at `/testing`: brief textarea → Match → ranked results with per-result and overall 👍/👎; feedback API appends to Sheet when configured.
- Single plan doc for: deploy goal, testing UI, feedback sheet (TBD), testing data, and how we fit re. external/cultural "live" data (Scraper/ingest = our external layer; dedicated cultural/live feed TBD).

### Files changed

- **New:** docs/TESTING_AND_DEPLOY_PLAN.md, src/feedback-sheet.js, public/testing.html
- **Modified:** src/index.js (route /testing, POST /api/v1/feedback), docs/PLAN.md (Open Questions re. cultural live data), .env.example, docs/TESTING_FOR_STAKEHOLDERS.md, SESSIONLOGS.md

---

## Session 2026-02-11 (Security + Taxonomy + 6.1 prep)

**Focus:** Security middleware, tsconfig for build, next steps (6.1/6.2 schema + scoring + API), SESSIONLOGS, 6.1 ingest/categorize.

### Progress

| Item | Status |
|------|--------|
| Security middleware (helmet, cors, express-rate-limit) | ✅ Done |
| tsconfig.json for npm run build (TS → src/*.js) | ✅ Done |
| 6.1 Schema: subjectMatterTags, subjectSubcategoryTags | ✅ Done |
| 6.2 Schema: primaryMedium, classification, budgetTier, lastActiveDate | ✅ Done |
| config/subject-taxonomy.json + .gitignore exception | ✅ Done |
| Scoring: subject/subcategory/primaryMedium weights + extraction | ✅ Done |
| GET /creators & POST /match filters (subject, subcategory, medium, budgetTier) | ✅ Done |
| CLAUDE.md Creator Schema + API list | ✅ Done |
| SESSIONLOGS.md (this file) | ✅ Done |
| 6.1 Ingest: LLM categorize returns subjectMatterTags, subjectSubcategoryTags, primaryMedium | ✅ Done |

### Successes

- **Security:** `helmet`, `cors`, `express-rate-limit` wired in `src/index.js`; optional env in `.env.example`. TASKS §5.1 marked Done.
- **Build:** Single `tsconfig.json` compiles `src/**/*.ts` into `src/*.js`; `npm run build` and `npm start` run end-to-end.
- **Taxonomy:** Creator schema and match filters support deck/docx alignment (subject matter, subcategory, primary medium, budget tier, last active). Scoring uses new weights and brief-derived subject/medium hints.
- **API:** GET /api/v1/creators and POST /api/v1/match accept and apply filters; match response includes `subjects` and `primaryMediumHint` in extractedKeywords.

### Failures / Notes

- None. Earlier session had docx extraction via Python when document.xml was too large for a single read.

### 6.1 Ingest (this session)

- **llm.ts:** `CategorizationResult.craft` extended with `subjectMatterTags`, `subjectSubcategoryTags`, `primaryMedium`, `classification`. Prompt updated with SUBJECT MATTER, SUBJECT SUBCATEGORIES, PRIMARY OUTPUT MEDIUM, CLASSIFICATION. Response normalized to canonical tags only (max 10 subject, max 5 subcategory).
- **index.js:** Batch import (Apify) and POST /api/v1/categorize apply new fields to `creator.craft`. Fallback categorization populates `subjectMatterTags` from `keywords.subjects` and `primaryMedium` from `keywords.primaryMediumHint`.

### Files changed (this session)

- **New:** `SESSIONLOGS.md`, `config/subject-taxonomy.json`, `tsconfig.json`
- **Modified:** `src/schemas.ts`, `src/scoring.ts`, `src/index.js`, `src/llm.ts`, `.env.example`, `.gitignore`, `CLAUDE.md`, `TASKS.md`, `docs/ACCOMPLISHMENTS_AND_NEXT_STEPS.md` (prior session)

---

## Session 2026-02-11 (earlier — Docx, deck, tasks)

**Focus:** Docx prototype bundle ingestion, analysis, security middleware, next-steps implementation.

### Progress

- Ingested **Project FKA Catchfire_ JL Creator Database Prototype.docx**; extracted text to `docs/reference/07_DOCX_PROTOTYPE_BUNDLE_2026-02.txt`.
- Wrote **08_DOCX_ANALYSIS_AND_USE.md**: duplicate vs new, how docx improves validity/confidence/accuracy.
- Added **TASKS §9** (Docx-derived): Synonym Normalization, Luminaries, Query translation, Confidence scoring.
- Implemented **security middleware** (helmet, cors, express-rate-limit).
- Implemented **6.1/6.2** schema, taxonomy config, scoring, API filters, CLAUDE.md.

### Successes

- Docx stored in `docs/reference/`; analysis doc and TASKS §9 give clear next steps for engine quality.
- Security and taxonomy work completed without blocking issues.

---

## Session (pre-2026-02-11 — consolidated from handoff)

**Focus:** Deck ingestion, TASKS consolidation, README/CHANGELOG roadmap, 6.1/6.2 subtask expansion.

### Progress

- Deck **Project FKA Catchfire Creator Database_ Update 2026.02.11.pptx** ingested; digest `05_DECK_DIGEST`, comparison `06_DECK_VS_BUILD_COMPARISON`.
- All TODO/loose items consolidated into **TASKS.md**; deck-derived work ordered by value (§6.1–6.6); deck build progress vs our progress (§7).
- README and CHANGELOG updated: Phase 1–2 / v0.2–v0.3 complete, Phase 3 / v0.4 current.
- TASKS §6.1 and §6.2 expanded with concrete subtasks and schema field lists.

### Successes

- Single source of truth for tasks; docx and deck reference materials in one place.

### Failures / Notes

- Deck "Build progress" slide content not fully captured in digest.
- pptx slide text in `<a:t>`; docx required Python extraction for large document.xml.

---

_CatchFire — Finding craft, not clout._
