# CatchFire Matching Engine -- TASKS

**Version:** 1.6.0  
**Last Updated:** 2026-02-26
**Project:** cf-influencer-matching-engine

> **Migrated from:** `docs/TASKS.md` on 2026-02-23. This is now the canonical location per the `task-management.mdc` global rule.

---

## Task Status Legend

| Status | Meaning |
|--------|---------|
| not_started | Not yet begun |
| in_progress | Currently being worked on |
| blocked | Waiting on dependency or decision |
| completed | Done and verified |
| cancelled | No longer needed |

---

## Completed Phases

### Phase 0: Foundation -- Complete
All tasks completed 2026-01-28.

### Phase 1: API Foundation -- Complete
All tasks completed 2026-01-28.

### Phase 2: Intelligence Layer -- Complete
All tasks completed 2026-01-28.

### Phase 3: Search and Discovery -- Complete
All tasks completed 2026-01-28.

---

## Phase 4: Scraper Integration

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 4.1 | Run first batch scrape (Ciclope, The Rookies, Motionographer) | completed | High | IT | Python scrapers in cf-creator-database | Ciclope: 8 records, Motionographer: 9 records. The Rookies: blocked (403) |
| 4.2 | Test Python scraper -> Matching Engine sync flow | completed | High | IT | 4.1 | Sync script transforms 3-tier schema to batch API format |
| 4.3 | Verify auto-embedding on batch import | completed | High | IT | 4.2 | Batch embedding endpoint generates 768d vectors |
| 4.4 | Create "Golden Records Ask" one-pager for Creative team | completed | Medium | IT/Strategy | Dan's approval | Sent to Dan 2026-02-13 |
| 4.5 | Add scraping cadence scheduler | completed | Medium | IT | 4.1-4.3 | Deployed 2026-03-05: 3 Cloud Scheduler jobs (daily Vimeo, daily Behance, weekly all-platforms) |
| 4.6 | Build deduplication logic | completed | Medium | IT | 4.1-4.3 | Name-normalized matching, merge strategy for tags/keywords/scores |

---

## Phase 5: Production Hardening

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 5.1 | Add rate limiting to public API endpoints | completed | High | IT | -- | express-rate-limit active in index.js |
| 5.2 | Add Helmet security headers | completed | High | IT | -- | helmet active in index.js |
| 5.3 | Set up Cloud Monitoring alerts | completed | Medium | IT | -- | Deployed 2026-03-05: uptime check, error-rate alert, latency alert to catchfire-app-2026 |
| 5.4 | Create staging environment | completed | Medium | IT | -- | Deployed 2026-03-05: cf-matching-staging in us-east1, Firestore creators-staging, no public access |
| 5.5 | Build admin dashboard for scraper status | not_started | Low | IT | 4.1-4.3 | Show last run, success rate |

---

## Phase 6: Testing & QA

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 6.1 | Vitest unit test suite (schemas + scoring) | completed | High | IT | -- | 79 tests passing (Feb 17 session) |
| 6.2 | Create smoke test suite | completed | High | IT | -- | 31 tests, local + production, `npm run smoke` |
| 6.3 | Build health check dashboard | not_started | Medium | IT | 6.2 | Visual service status |
| 6.4 | Add integration test workflow | completed | High | IT | 6.1-6.2 | 13 tests: batch import -> embedding -> search -> feedback -> lookalikes |
| 6.5 | Create E2E test for semantic search | completed | Medium | IT | 6.1-6.2 | tests/e2e-semantic.test.ts: full pipeline tests (Feb 23 session) |
| 6.6 | Set up CI/CD pipeline | completed | Medium | IT | 6.1-6.5 | GitHub Actions: unit tests + type check + build + smoke tests |
| 6.7 | Create test data fixtures | completed | Low | IT | -- | tests/fixtures/: 12 mock creators, 768-dim embeddings, golden records (Feb 23 session) |

### Test Coverage Details

**Vitest Suite (Task 6.1) -- 119 Unit + E2E Tests:**
- `tests/schemas.test.ts` -- Schema validation tests (38)
- `tests/scoring.test.ts` -- Scoring algorithm tests (41)
- `tests/e2e-semantic.test.ts` -- E2E semantic search pipeline tests (40)
- Config: `vitest.config.ts`

**Test Fixtures (Task 6.7):**
- `tests/fixtures/creators.ts` -- 12 mock creator profiles
- `tests/fixtures/embeddings.ts` -- Deterministic 768-dim vectors (Mulberry32 PRNG)
- `tests/fixtures/goldenRecords.ts` -- 3 golden records, helper functions
- `tests/fixtures/index.ts` -- Barrel export

**Integration Suite (Task 6.4) -- 13 Tests:**
- `tests/integration.test.ts` -- Full pipeline: health -> batch import -> embedding -> semantic search -> feedback -> lookalikes
- Requires running server at localhost:8090 (or `TEST_BASE_URL` env var)

**Smoke Test Suite (Task 6.2) -- 31 Tests:**
- [x] **API Endpoints**: Health, stats, search, CRUD, match, LLM, embeddings, lookalikes
- [x] **Authentication**: GCP ADC, Gemini API key, Firestore credentials
- [x] **External Services**: Cloud Run, Firestore, Gemini AI, Embeddings API
- [x] **Database**: Connection, read/write operations, Golden Records model
- [x] **Integration**: Matching Engine <-> Creator Database project check
- **Implementation:** `scripts/smoke-tests.sh` | `npm run smoke` | `npm run smoke:prod`

---

## Phase 7: Web Application

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 7.1 | Design full web application UI | completed | High | IT | frontend-design skill | Dark editorial luxury aesthetic (Playfair Display + Sora, gold on black) |
| 7.2 | Build creator search interface | completed | High | IT | 7.1 | Semantic search with suggestions, creator browse with filters (craft, platform, location) |
| 7.3 | Build creator profile cards | completed | High | IT | 7.1 | Golden Record badges, craft tags, quality score bars, style signatures |
| 7.4 | Build brief submission form | completed | High | IT | 7.1 | Client brief -> ranked match results with per-creator feedback (thumbs up/down) |
| 7.5 | Add admin panel for Golden Records | completed | Medium | IT | 7.1 | Toggle Golden Record status, refresh lookalike model, sortable table |
| 7.6 | Deploy to Cloud Run with custom domain | completed | Medium | IT | 7.1-7.5 | Live at production URL, multi-stage Dockerfile, single container |
| 7.7 | Add user authentication | completed | High | IT | 7.6 | IAP + HTTPS LB deployed 2026-02-26. Google SSO for @johannesleonardo.com domain. 3 users authorized. |

### Web Application Details (Phase 7)

**Stack:** React 19 + Vite 7 + TypeScript, served from Express backend in single Cloud Run container.

**Design:**
- Dark editorial luxury aesthetic (full dark mode)
- Playfair Display (headings) + Sora (body) typography
- Warm gold accent (#c9a227) on deep black (#0d0d0d)
- Glass-morphism header, noise texture overlay, stagger animations

**Pages (7):**
- Home: hero search, live stats, quick actions, craft distribution
- Creator Browse: sidebar filters (craft, platform, location), card grid
- Creator Profile: details, style signature, quality score, similar creators
- Brief Match: textarea brief input, ranked results, thumbs feedback
- Semantic Search: AI-powered meaning-based search results
- Admin: Golden Records table, toggle switches, lookalike model management
- Status: service health checks, database statistics

**Known Remaining Work:**
- Error state handling: ErrorBoundary + Toast wired in App.tsx, but only CreatorProfile and ScraperDashboard use ApiError/Toast. Admin, Status, Login, CreatorBrowse still swallow errors silently.
- ~~User authentication (7.7)~~ Completed 2026-02-26 (IAP + HTTPS LB)
- CSS token cleanup: Token system in tokens.css created, but 5 files still have hardcoded 10px and 5 files have raw rgba() values outside tokens.

---

## Phase 8: Future Enhancements

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 8.1 | Image Analysis (Gemini Vision) | not_started | High | IT | -- | Auto-tag visual style from portfolios |
| 8.2 | Contact Enrichment (Clay.com/Hunter.io) | not_started | Medium | IT | Budget approval | $1,000 budget allocated |
| 8.3 | Brief Templates | completed | High | IT | -- | 10 templates, 5 categories. Live in Beta Control Center; React component exists but unwired (Feb 23 session) |
| 8.4 | Slack Integration | not_started | Medium | IT | -- | `/catchfire find` slash command |
| 8.5 | Auto-Categorize Improvements | not_started | Medium | IT | Review feedback | Fine-tune LLM prompts |
| 8.6 | Multi-Model Support | not_started | Low | IT | -- | Gemini Pro for complex briefs |
| 8.7 | Multi-Chip Search (AND logic) | not_started | Medium | IT | -- | Click multiple hint chips to narrow search scope (e.g. "Moody DP" + "Colorist") |
| 8.8 | Animated "How It Works" page | completed | Medium | IT | -- | /app/how-it-works -- 6-step pipeline, expandable details, flow diagram |
| 8.9 | Search Results Export (CSV + Email) | completed | Medium | IT | -- | Download CSV and email list buttons on Beta Control Center |
| 8.10 | Upgrade dotenv to v17 | completed | Low | IT | -- | Upgraded 2026-03-05, no breaking changes for require('dotenv').config() usage |
| 8.11 | Upgrade vitest to v4 | completed | Low | IT | -- | Upgraded 2026-03-05, 119/119 unit tests pass, fully compatible |

---

## Blocked / Waiting on Decision

| ID | Task | Blocked By | Resolution Needed |
|----|------|------------|-------------------|
| -- | Golden Records expansion | Creative team input | Task 4.4 one-pager to unblock |
| -- | Feedback sheet location | PM / Dan decision | Need FEEDBACK_SHEET_ID and tab name |
| -- | External/cultural live data scope | Dan confirmation | Trend API needed or scraper+LLM sufficient? |
| -- | Apify actor selection | Budget and ToS review | Which platforms to scrape first |

---

## Recently Completed

| ID | Task | Completed | Notes |
|----|------|-----------|-------|
| 7.7 | IAP authentication + HTTPS Load Balancer | 2026-02-26 | Google SSO for JL domain, 3 users authorized, allUsers removed |
| 7.1-7.6 | Full React web application (7 pages, dark mode, deployed) | 2026-02-18 | React 19 + Vite 7, multi-stage Docker, live on Cloud Run |
| -- | Platform filter added to GET /api/v1/creators | 2026-02-19 | Backend now supports ?platform= query param |
| -- | 404 catch-all route added | 2026-02-19 | NotFound page for unknown URLs |
| -- | Dark mode UI redesign (fixed index.css import bug) | 2026-02-18 | Root cause: index.css never imported in build chain |
| -- | WEBUI_LOGS.md created | 2026-02-18 | Tracks web UI errors and design decisions |
| -- | Dependency upgrades (Express 5, Firestore 8, genai 1.41) | 2026-02-17 | All deps current, 0 vulnerabilities |
| -- | Migrate from @google-cloud/vertexai to @google/genai | 2026-02-17 | Unified SDK for API key and Vertex AI |
| -- | Automated test suite (vitest, 79 tests) | 2026-02-17 | schemas.test.ts (38) + scoring.test.ts (41) |
| -- | LEARN.md (9 lessons learned) | 2026-02-17 | Adapted from leo-participation-translator |
| -- | Status report PDF generation (jsPDF) | 2026-02-17 | scripts/generate-status-pdf.mjs |
| 5.1 | Rate limiting active | 2026-02-17 | Already wired in index.js, confirmed |
| 5.2 | Helmet security headers active | 2026-02-17 | Already wired in index.js, confirmed |
| 4.4 | Create Golden Records one-pager | 2026-02-13 | Sent to Dan for Creative team |
| -- | Create matching-engine.ts integration service | 2026-02-12 | In cf-creator-database |
| -- | Document schema mapping (INTEGRATION.md) | 2026-02-12 | Full field mapping |
| -- | Push cf-creator-database to GitHub | 2026-02-12 | Absolute-Space-GHCP org |
| -- | Test batch import endpoint | 2026-02-12 | Integration verified |
| 3.1 | Implement embeddings generation | 2026-01-28 | gemini-embedding-001 |
| 3.2 | Build semantic search endpoint | 2026-01-28 | POST /api/v1/search/semantic |
| 3.3 | Train lookalike model on Golden Records | 2026-01-28 | 11 benchmark creators |
| -- | Deploy Beta Control Center | 2026-01-28 | Live at Cloud Run URL |

---

## Quick Reference

### Current Sprint Focus
- Phase 7: Web Application polish (error handling, auth, CSS cleanup)
- Phase 8: Future Enhancements (Brief Templates, Image Analysis)

### Cross-Repo Tasks

| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| X.1 | Create standardized authorship footer template for all work repos | not_started | Medium | Unified format across ~/Projects/ repos (JS, TS, CSS, HTML, MD, Python, Shell) |

### Key URLs
- **Production (IAP-secured):** https://cf-matching-engine.34.54.144.178.nip.io (Google SSO required)
- **Cloud Run (direct, locked):** https://cf-matching-engine-34240596768.us-central1.run.app (403 to public)
- **GitHub (Matching Engine):** https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine
- **GitHub (Creator Database):** https://github.com/Absolute-Space-GHCP/cf-creator-database

### Key Contacts
- **Strategy (CSO):** Dan
- **Budget Approval:** Paula
- **Creative Team:** TBD (need contact for Golden Records ask)

---

**Author:** Charley Scholz  
**Co-authored:** Claude Opus 4.6, Cursor (IDE)  
**Last Updated:** 2026-02-23
