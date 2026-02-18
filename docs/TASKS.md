# CatchFire Matching Engine -- TASKS

**Version:** 1.2.0  
**Last Updated:** 2026-02-18
**Project:** cf-influencer-matching-engine

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
| 4.1 | Run first batch scrape (Ciclope, The Rookies, Motionographer) | not_started | High | IT | Python scrapers in cf-creator-database | Start with 3 highest-priority sources |
| 4.2 | Test Python scraper -> Matching Engine sync flow | not_started | High | IT | 4.1 | Verify matching-engine.ts integration service works |
| 4.3 | Verify auto-embedding on batch import | not_started | High | IT | 4.2 | Embeddings should generate automatically |
| 4.4 | Create "Golden Records Ask" one-pager for Creative team | completed | Medium | IT/Strategy | Dan's approval | Sent to Dan 2026-02-13 |
| 4.5 | Add scraping cadence scheduler | not_started | Medium | IT | 4.1-4.3 | Festivals=annual, portfolios=quarterly |
| 4.6 | Build deduplication logic | not_started | Medium | IT | 4.1-4.3 | Same person may appear across sources |

---

## Phase 5: Production Hardening

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 5.1 | Add rate limiting to public API endpoints | completed | High | IT | -- | express-rate-limit active in index.js |
| 5.2 | Add Helmet security headers | completed | High | IT | -- | helmet active in index.js |
| 5.3 | Set up Cloud Monitoring alerts | not_started | Medium | IT | -- | Error rate, latency, uptime |
| 5.4 | Create staging environment | not_started | Medium | IT | -- | Separate from production |
| 5.5 | Build admin dashboard for scraper status | not_started | Low | IT | 4.1-4.3 | Show last run, success rate |

---

## Phase 6: Testing & QA

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 6.1 | Vitest unit test suite (schemas + scoring) | 🟢 completed | High | IT | — | 79 tests passing (Feb 17 session) |
| 6.2 | Create smoke test suite | 🟢 completed | High | IT | — | 31 tests, local + production, `npm run smoke` |
| 6.3 | Build health check dashboard | 🔴 not_started | Medium | IT | 6.2 | Visual service status |
| 6.4 | Add integration test workflow | 🔴 not_started | High | IT | 6.1-6.2 | Scraper → API → Firestore → Embeddings |
| 6.5 | Create E2E test for semantic search | 🔴 not_started | Medium | IT | 6.1-6.2 | Brief → Match → Results validation |
| 6.6 | Set up CI/CD pipeline | 🔴 not_started | Medium | IT | 6.1-6.5 | GitHub Actions with test gates |
| 6.7 | Create test data fixtures | 🔴 not_started | Low | IT | — | Mock creators for consistent testing |

### Test Coverage Details

**Vitest Suite (Task 6.1) — 79 Tests:**
- `tests/schemas.test.ts` — Schema validation tests
- `tests/scoring.test.ts` — Scoring algorithm tests
- Config: `vitest.config.ts`

**Smoke Test Suite (Task 6.2) — 31 Tests:**
- [x] **API Endpoints**: Health, stats, search, CRUD, match, LLM, embeddings, lookalikes
- [x] **Authentication**: GCP ADC, Gemini API key, Firestore credentials
- [x] **External Services**: Cloud Run, Firestore, Gemini AI, Embeddings API
- [x] **Database**: Connection, read/write operations, Golden Records model
- [x] **Integration**: Matching Engine ↔ Creator Database project check
- **Implementation:** `scripts/smoke-tests.sh` | `npm run smoke` | `npm run smoke:prod`

---

## Phase 7: Web Application

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 7.1 | Design full web application UI | 🟡 in_progress | High | IT | frontend-design skill | Bright, cheery, professional |
| 7.2 | Build creator search interface | 🔴 not_started | High | IT | 7.1 | Semantic search + filters |
| 7.3 | Build creator profile cards | 🔴 not_started | High | IT | 7.1 | Golden Record badges, craft tags |
| 7.4 | Build brief submission form | 🔴 not_started | High | IT | 7.1 | Client brief → match results |
| 7.5 | Add admin panel for Golden Records | 🔴 not_started | Medium | IT | 7.1 | Mark/unmark benchmark creators |
| 7.6 | Deploy to Cloud Run with custom domain | 🔴 not_started | Medium | IT | 7.1-7.5 | Free hosting on GCP |
| 7.7 | Add user authentication | 🔴 not_started | Low | IT | 7.6 | JL employees only |

### Web Application Requirements (Phase 7)

**Design Direction:**
- Bright, cheery, professional UI (not dark/cinematic)
- Premium editorial aesthetic with creative touches
- Mobile-responsive design
- Fast, fluid interactions

**Core Features:**
- Semantic search with query suggestions
- Creator cards with portfolio previews
- Golden Record highlighting
- Brief input → match results workflow
- Craft distribution visualization

---

## Phase 8: Future Enhancements

| ID | Task | Status | Priority | Owner | Dependencies | Notes |
|----|------|--------|----------|-------|--------------|-------|
| 8.1 | Image Analysis (Gemini Vision) | 🔴 not_started | High | IT | — | Auto-tag visual style from portfolios |
| 8.2 | Contact Enrichment (Clay.com/Hunter.io) | 🔴 not_started | Medium | IT | Budget approval | $1,000 budget allocated |
| 8.3 | Brief Templates | 🔴 not_started | High | IT | — | Pre-built search queries |
| 8.4 | Slack Integration | 🔴 not_started | Medium | IT | — | `/catchfire find` slash command |
| 8.5 | Auto-Categorize Improvements | 🔴 not_started | Medium | IT | Review feedback | Fine-tune LLM prompts |
| 8.6 | Multi-Model Support | 🔴 not_started | Low | IT | — | Gemini Pro for complex briefs |

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
- Phase 4: Scraper Integration (Tasks 4.1-4.6)
- Phase 6: Testing & QA (Task 6.1 - Smoke Tests)
- Phase 7: Web Application (Task 7.1 - UI Design)

### Key URLs
- **Production:** https://cf-matching-engine-34240596768.us-central1.run.app
- **GitHub (Matching Engine):** https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine
- **GitHub (Creator Database):** https://github.com/Absolute-Space-GHCP/cf-creator-database

### Key Contacts
- **Strategy (CSO):** Dan
- **Budget Approval:** Paula
- **Creative Team:** TBD (need contact for Golden Records ask)

---

**Author:** Charley Scholz, JLAI  
**Co-authored:** Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)  
**Last Updated:** 2026-02-18
