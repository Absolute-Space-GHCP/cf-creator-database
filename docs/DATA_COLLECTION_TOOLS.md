# Data Collection Tools & APIs Reference

> Comprehensive inventory of all tools, APIs, and services used to discover, collect, enrich, and process influencer/creator data.

**Last Updated:** 2026-03-09

---

## 1. Python Scrapers (14 Sources)

All scrapers use **Python `requests` + BeautifulSoup** (no headless browser). They inherit from `BaseScraper` in `scraper/base_scraper.py` with 2-second rate limiting between requests.

| # | Scraper | Target | Data Collected | Status |
|---|---------|--------|----------------|--------|
| 1 | Camerimage | camerimage.pl | Cinematographers, DPs, colorists, gaffers from Golden Frog nominees | Active |
| 2 | Annecy | annecy.org | Animation directors and studios from Mifa market | Active |
| 3 | Ars Electronica | ars.electronica.art | Creative tech, interactive art, projection mapping artists | Active |
| 4 | SXSW Title Design | sxsw.com | Title designers, animators, compositors | Active |
| 5 | Ciclope Festival | ciclopefestival.com | Directors, DPs, colorists, VFX, editors (Behind the Craft) | Active |
| 6 | UKMVA | ukmva.com | Music video directors and production companies | Active |
| 7 | Promax | promax.org | Broadcast design, motion graphics, promo design | Active |
| 8 | Sitges | sitgesfilmfestival.com | Fantasy/horror, practical effects artists | Active |
| 9 | Fantastic Fest | fantasticfest.com | Genre filmmakers, practical effects | Active |
| 10 | The Rookies | therookies.co | Emerging VFX, 3D, game dev, motion design talent | Active (403 blocked) |
| 11 | ShotDeck | shotdeck.com | DPs from featured shot credits | Active (subscription-gated) |
| 12 | Director's Notes | directorsnotes.com | Directors from interviews | Active |
| 13 | Motionographer | motionographer.com | Motion designers, studios, featured work | Active |
| 14 | Stash Media | stashmedia.tv | Motion design & VFX featured work | Active (subscription-gated) |

### Key Files

| File | Purpose |
|------|---------|
| `scraper/base_scraper.py` | Shared base class with rate limiting, error handling |
| `scraper/config.py` | Scraper registry, output paths, settings |
| `scraper/pipeline.py` | Orchestrator: scrape → quality filter → dedupe → export |
| `scraper/main.py` | Entry point for the Python pipeline |
| `scraper/models.py` | `CreatorRecord` data model |
| `scraper/normalization.py` | Name and field normalization |
| `scraper/credit_mapping.py` | Maps festival credit roles to craft types |
| `scraper/requirements.txt` | Python dependencies (requests, beautifulsoup4) |

### Pipeline Flow

```
Cloud Scheduler → POST /api/v1/scraper/trigger
  → runPythonScraper() execs scraper/main.py (child_process.execFile)
  → pipeline.run() iterates SCRAPER_REGISTRY
  → transformScraperRecords() (src/services/scraper-transform.js)
  → POST /api/v1/creators/batch → Firestore
```

---

## 2. Google Gemini AI (`@google/genai` SDK)

All AI features use Gemini via the `@google/genai` SDK. Auth via `GEMINI_API_KEY` environment variable or GCP Application Default Credentials.

| Capability | Model | What It Does | Endpoint | File |
|------------|-------|--------------|----------|------|
| LLM Categorization | Gemini 2.5 Flash | Auto-tags craft, subject matter, technical tags from bios | `POST /api/v1/categorize` | `src/llm.ts` |
| Style Signature | Gemini 2.5 Flash | Generates narrative style descriptions | `POST /api/v1/style-signature` | `src/llm.ts` |
| Image Analysis | Gemini 2.5 Flash (vision) | Extracts tags, style, subject, color palette from images | `POST /api/v1/analyze-image` | `src/llm.ts` |
| Embeddings | gemini-embedding-001 | 768-dim vectors for semantic search and lookalike models | `POST /api/v1/embed` | `src/llm.ts` |
| Brief Matching | Gemini 2.5 Flash | Keyword extraction from natural language briefs | `POST /api/v1/match` | `src/scoring.ts` |

---

## 3. Third-Party Data Services

| Service | Purpose | Status | Budget | Endpoint |
|---------|---------|--------|--------|----------|
| **Apify** | External scraper actors (Behance, Vimeo, ArtStation) | Scaffolded — import endpoint exists, no actors purchased | $500 allocated | `POST /api/v1/import/apify` |
| **Clay.com** | Contact/email enrichment | Scaffolded — endpoint exists, no API calls wired | $1,000 (shared) | `POST /api/v1/enrichment/enrich/:id` |
| **Hunter.io** | Email lookup by domain | Scaffolded — same as Clay | $1,000 (shared) | Same as above |
| **Google Sheets** | Feedback collection (thumbs up/down on match results) | Scaffolded — `FEEDBACK_SHEET_ID` not set | Free | `POST /api/v1/feedback` |

### Relevant Environment Variables

| Variable | Service | Required |
|----------|---------|----------|
| `GEMINI_API_KEY` | Gemini AI (all LLM + embeddings) | Yes (or ADC) |
| `SCRAPER_API_KEY` | Bearer token for scraper trigger | Optional |
| `CLAY_API_KEY` | Clay.com enrichment | Not yet |
| `HUNTER_API_KEY` | Hunter.io enrichment | Not yet |
| `FEEDBACK_SHEET_ID` | Google Sheets feedback | Not yet |
| `GCP_PROJECT_ID` | Firestore, Vertex AI | Yes |

---

## 4. Infrastructure & Storage

| Service | Technology | Purpose | Status |
|---------|------------|---------|--------|
| **Firestore** | `@google-cloud/firestore` | Creator profiles (38 docs), scraper run history, embeddings | Active |
| **Cloud Run** | GCP | Hosts Express server + Python scrapers in single container | Active |
| **Cloud Scheduler** | GCP | Automated scraper triggers (daily/weekly) | Configs exist, not yet deployed |
| **Cloud Monitoring** | GCP | Uptime checks, error rate alerts, latency alerts | Active |
| **IAP** | GCP Identity-Aware Proxy | Restricts UI access to 4 authorized users | Active |

---

## 5. API Endpoints for Data Collection

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/v1/scraper/trigger` | POST | Run Python scraper pipeline | Cloud Scheduler header or `SCRAPER_API_KEY` |
| `/api/v1/scraper/status` | GET | Last scraper run from Firestore | Same |
| `/api/v1/scraper/reports` | GET | Last 10 scraper runs | Same |
| `/api/v1/import/apify` | POST | Import Apify actor output with LLM categorization | Bearer token |
| `/api/v1/creators/batch` | POST | Bulk import with name-based deduplication | Bearer token |
| `/api/v1/creators` | POST | Add single creator | Bearer token |
| `/api/v1/categorize` | POST | LLM-categorize a creator bio | Bearer token |
| `/api/v1/style-signature` | POST | Generate style signature | Bearer token |
| `/api/v1/analyze-image` | POST | Gemini Vision image analysis | Bearer token |
| `/api/v1/embed` | POST | Generate embedding for text | Bearer token |
| `/api/v1/embed/batch` | POST | Batch embedding generation | Bearer token |
| `/api/v1/enrichment/status` | GET | Check enrichment service availability | Bearer token |
| `/api/v1/enrichment/enrich/:id` | POST | Enrich a creator's contact info | Bearer token |

---

## 6. Planned but Not Yet Connected

| Source | Category | Notes |
|--------|----------|-------|
| Behance | Platform | Waiting on Apify actor purchase |
| Vimeo | Platform | Waiting on Apify actor purchase |
| ArtStation | Platform | Waiting on Apify actor purchase |
| NFFTY | Festival | Youth filmmaker festival; no scraper written |
| r/cinematography | Community | Reddit scraping planned |
| r/vfx | Community | Reddit scraping planned |
| r/motiondesign | Community | Reddit scraping planned |
| r/colorists | Community | Reddit scraping planned |

---

## 7. Budget Summary

| Category | Allocated | Spent | Notes |
|----------|-----------|-------|-------|
| Scraping tools (Apify actors) | $500 | $0 | No actors purchased yet |
| Enrichment (Clay.com, Hunter.io) | $1,000 | $0 | Not implemented |
| Infrastructure (Firestore, Cloud Run) | $500 | ~$50 | GCP free tier covers most |
| TBD Fund | $3,000 | $0 | Reserved |
| **Total** | **$5,000** | **~$50** | |

---

## Quick Reference

```bash
# Trigger a scraper run (local)
curl -X POST http://localhost:8090/api/v1/scraper/trigger \
  -H "X-CloudScheduler-JobName: manual" \
  -H "Content-Type: application/json" \
  -d '{"platforms":["ciclope","motionographer"],"dryRun":true}'

# Check scraper status
curl http://localhost:8090/api/v1/scraper/status

# Import from Apify (when ready)
curl -X POST http://localhost:8090/api/v1/import/apify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"records":[...],"source":"behance"}'
```

---

Author: Charley Scholz, JLAI
Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
Last Updated: 2026-03-09
