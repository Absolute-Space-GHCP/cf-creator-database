> **Version:** 0.7.0 | **Date:** 2026-02-19 | **Repo:** cf-influencer-matching-engine

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.7.0] - 2026-02-19 - Visual Polish & Features

### Added

- Animated "How It Works" page at `/app/how-it-works` (6-step pipeline walkthrough)
- Download CSV and Email List buttons for search results
- Active/selected state for hint chips (gold fill on click)
- Multi-chip AND-logic search logged as future enhancement (8.7)
- "How It Works" link in navigation (both HTML and React)

### Changed

- Switched serif font from Instrument Serif/Playfair Display to Nixie One across all pages
- Removed all "legacy" terminology from code and CSS comments
- Updated branding: removed "Johannes Leonardo", replaced with "CF - Influencer Matching Engine"
- Updated footer authorship to "Author: Charley Scholz · Co-authored by: Claude Opus 4.6, Cursor (IDE)"

### Fixed

- Repaired mojibake encoding across 26 files (emoji, box-drawing, em-dashes, smart quotes)
- Fixed garbled card icons (🔍⚡🔗📊⭐) on Beta Control Center
- Added L010 to LEARN.md documenting the ftfy-based encoding fix

---

## [0.6.0] - 2026-02-18 - Hybrid UI Rebuild

### Added

- React SPA served at `/app/*` (Browse Creators, Creator Profile, Admin, Status)
- Beta Control Center at root `/` as primary dashboard
- Platform filter on `GET /api/v1/creators`
- 404 catch-all route

### Changed

- Restructured routing: HTML pages at root, React app at `/app/*`
- Updated Vite config with `/app/` base path

---

## [0.5.0] - 2026-02-17 - Dependencies & Testing

### Added

- 79 unit tests (vitest: schemas + scoring)
- 31 smoke tests (API, auth, services, database)
- 13 integration tests (full pipeline)
- GitHub Actions CI/CD
- LEARN.md with 8 documented lessons
- Status report and PDF generation

### Changed

- Upgraded Express 4 → 5, Firestore 7.1 → 8.3, @google/genai 1.38 → 1.41
- Migrated fully from @google-cloud/vertexai to @google/genai
- Committed package-lock.json for reproducible builds

---

## [0.1.0] - 2026-01-28 - Initial Project Setup

### Added

- Project scaffolding from ai-agents-gmaster-build (clean version)
- CatchFire-specific CLAUDE.md with project context
- Creator database schema definition
- API endpoint structure
- Source list configuration (`config/source-list.json`)
- Keyword configuration (`config/keywords.json`)
  - Positive keywords (cameras, lenses, software, techniques)
  - Negative keywords (influencer noise, consumer gear)
  - Craft categories
- Project README with CatchFire mission and roadmap

### Foundation (from ai-agents-gmaster-build)

- Express.js server framework
- Firestore integration with caching
- Vertex AI / Gemini integration
- Matching algorithm base (employee matching → creator matching)
- Phonetic matching (Soundex)
- Analytics tracking

### Planned

- Creator matching algorithm adaptation
- REST API implementation
- LLM-based categorization
- Batch import endpoint for Apify
- Semantic search capability

---

## Roadmap

### v0.2.0 - API Foundation — ✅ Complete

- [x] Implement `/api/v1/creators` CRUD
- [x] Implement `/api/v1/match` endpoint
- [x] Adapt scoring algorithm for creators

### v0.3.0 - Intelligence Layer — ✅ Complete

- [x] LLM categorization pipeline
- [x] Style signature generation
- [x] Batch import from scrapers

### v0.4.0 - Search & Discovery (Current)

- [ ] Semantic search with embeddings
- [ ] Lookalike model training
- [ ] Auto-scan scheduling

### Future (v0.5.0+)

- [ ] **End-user option: links to specific work, refs, and sources** — Prompt or preference (e.g. in match results or creator detail) to include links to: specific work (portfolio/reel URLs), references (festivals, awards), and discovery sources (source name + URL). API support (e.g. `includeWorkLinks` / `includeSourceLinks`) and schema fields for per-creator work and source URLs.

---

_CatchFire - Finding craft, not clout._
