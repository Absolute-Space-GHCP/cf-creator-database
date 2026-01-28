> **Version:** 0.1.0 | **Date:** 2026-01-28 | **Repo:** cf-influencer-matching-engine

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### v0.2.0 - API Foundation

- [ ] Implement `/api/v1/creators` CRUD
- [ ] Implement `/api/v1/match` endpoint
- [ ] Adapt scoring algorithm for creators

### v0.3.0 - Intelligence Layer

- [ ] LLM categorization pipeline
- [ ] Style signature generation
- [ ] Batch import from scrapers

### v0.4.0 - Search & Discovery

- [ ] Semantic search with embeddings
- [ ] Lookalike model training
- [ ] Auto-scan scheduling

---

_CatchFire - Finding craft, not clout._
