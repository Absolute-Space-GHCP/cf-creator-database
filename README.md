> **Version:** 0.8.0 | **Date:** 2026-03-05 | **Repo:** cf-influencer-matching-engine

# CatchFire Influencer Matching Engine

[![Version](https://img.shields.io/badge/version-0.8.0-blue.svg)](./CHANGELOG.md)
[![Platform](https://img.shields.io/badge/platform-Cloud%20Run-orange.svg)](https://cloud.google.com/run)
[![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-green.svg)](https://ai.google.dev/)
[![Node](https://img.shields.io/badge/node-22%2B-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-132%20passing-success.svg)](#testing)

**AI-powered creator discovery and matching based on craft storytelling skills.**

---

## Overview

CatchFire's mission is to build a proprietary database of the world's best up-and-coming storytellers -- with a specific focus on **craft storytelling skills** over audience size.

Feed a client brief into the system and receive recommendations for perfect creators based on:

- **Style** - Visual aesthetic and creative approach
- **Passion** - Subject matter expertise and enthusiasm
- **Location** - Geographic availability and constraints

### Key Differentiators

| Traditional Influencer Tools   | CatchFire Engine                            |
| ------------------------------ | ------------------------------------------- |
| Focus on follower counts       | Focus on craft and skill                    |
| Surface-level metrics          | Deep portfolio analysis                     |
| Influencer tags (#fyp, #viral) | Professional tags (#ArriAlexa, #Anamorphic) |
| Instagram/TikTok trending      | Festival winners, Vimeo Staff Picks         |

---

## Tech Stack

| Component     | Technology                          |
| ------------- | ----------------------------------- |
| **Runtime**   | Node.js 22+ (current: v24.11.1)    |
| **Framework** | Express 5.x                         |
| **LLM SDK**   | @google/genai (Gemini 2.5 Flash)   |
| **Database**  | Firestore (37 creators, 11 Golden Records) |
| **Frontend**  | React 19 + Vite 7 + TypeScript     |
| **Testing**   | Vitest 4 (119 unit + 13 integration tests) |
| **Cloud**     | GCP Cloud Run (production + staging) |
| **Security**  | IAP + HTTPS Load Balancer (Google SSO) |

---

## Features

### Creator Matching

- **Multi-factor scoring**: Style, craft category, location, technical tags, subject matter
- **LLM-powered categorization**: Automatically classify creators from bio/portfolio
- **Semantic search**: Vector-based similarity search across the creator database
- **Golden Record lookalikes**: Find creators similar to benchmark profiles
- **Negative keyword filtering**: Exclude influencer noise

### Data Sources

- **Festivals**: Camerimage, Annecy, Ciclope, NFFTY, UKMVA
- **Platforms**: Behance, Vimeo, ArtStation, The Rookies
- **Communities**: Reddit cinematography, VFX, motion design subs
- **Scraper pipeline**: 14 platform-specific Python scrapers with configurable cadence

### React Frontend

Seven-page SPA at `/app/*`: Home, Creator Browse, Creator Profile, Brief Match, Admin, Status, and Scraper Dashboard.

### API (24+ Endpoints)

```
GET  /health                          - Health check
GET  /dashboard                       - Legacy monitoring dashboard
GET  /testing                         - Testing UI
GET  /api/v1/creators                 - Search/filter creators
GET  /api/v1/creators/:id             - Get creator details
POST /api/v1/creators                 - Add single creator
POST /api/v1/creators/batch           - Bulk import from scraper
PATCH /api/v1/creators/:id            - Update creator
POST /api/v1/import/apify             - Apify scraper import
POST /api/v1/match                    - Match creators to a brief
POST /api/v1/feedback                 - Thumbs up/down feedback
POST /api/v1/categorize               - LLM-categorize a bio
POST /api/v1/style-signature          - Generate style signature
GET  /api/v1/llm/test                 - Test LLM connectivity
GET  /api/v1/embeddings/test          - Test embeddings
POST /api/v1/embeddings/generate/:id  - Generate creator embedding
POST /api/v1/embeddings/batch         - Batch generate embeddings
GET  /api/v1/similar/:id              - Find similar creators
POST /api/v1/search/semantic          - Semantic search
GET  /api/v1/lookalikes               - Golden Record lookalikes
GET  /api/v1/lookalikes/model         - Lookalike model info
GET  /api/v1/lookalikes/score/:id     - Score creator vs Golden Records
POST /api/v1/lookalikes/refresh       - Refresh lookalike model
POST /api/v1/scraper/trigger          - Trigger scraper run
GET  /api/v1/stats                    - Database statistics
/app/*                                - React SPA (7 pages)
```

---

## Quick Start

### Prerequisites

- Node.js 22+
- Google Cloud Project with Firestore and Vertex AI enabled
- GCP authentication (`gcloud auth application-default login`)

### Installation

```bash
git clone https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine.git
cd cf-influencer-matching-engine
npm install
cd web && npm install && cd ..
cp .env.example .env   # Edit with your GCP project details
npm run build          # Compile TypeScript
npm start              # Build and start server at localhost:8090
```

### Environment Variables

```env
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-east1
GEMINI_MODEL=gemini-2.5-flash
FIRESTORE_COLLECTION=creators
PORT=8090
```

---

## Testing

```bash
npm test              # All tests (119 unit + 13 integration)
npm run test:unit     # Unit tests only (always pass standalone)
npm run smoke         # 31 smoke tests (local server)
npm run smoke:prod    # Production smoke tests
```

The test suite includes:
- **38** schema validation tests
- **41** scoring algorithm tests
- **40** E2E semantic search tests
- **13** integration tests (require running server at localhost:8090)
- **31** smoke tests (shell-based endpoint checks)

---

## Project Structure

```
cf-influencer-matching-engine/
├── src/
│   ├── index.js              # Main Express server (24+ API endpoints)
│   ├── schemas.ts            # Zod schemas and TypeScript types
│   ├── scoring.ts            # Scoring algorithm with typed creator/brief matching
│   ├── llm.js                # Gemini LLM integration (compiled from llm.ts)
│   └── sync_firestore.js     # Data sync utilities
├── web/                      # React 19 SPA (Vite 7 + TypeScript)
│   ├── src/
│   │   ├── pages/            # 7 pages: Home, CreatorBrowse, CreatorProfile,
│   │   │                     #   BriefMatch, Admin, Status, ScraperDashboard
│   │   ├── components/       # Header, Footer, ErrorBoundary, Toast, Cards, etc.
│   │   ├── api/client.ts     # Typed API client
│   │   └── theme/tokens.css  # Design token system
│   └── package.json
├── scraper/                  # Python scraper pipeline (14 scrapers)
│   ├── main.py               # CLI entry point
│   ├── config.py             # Source configuration with cadence
│   └── scrapers/             # Platform-specific scrapers
├── tests/
│   ├── schemas.test.ts       # Schema validation (38 tests)
│   ├── scoring.test.ts       # Scoring algorithm (41 tests)
│   ├── e2e-semantic.test.ts  # E2E semantic search (40 tests)
│   ├── integration.test.ts   # Integration tests (13, require running server)
│   └── fixtures/             # 12 mock creators, deterministic embeddings
├── scripts/
│   ├── monitoring/           # Cloud Monitoring alert configs (deployed)
│   ├── deploy-monitoring.ps1 # Monitoring deploy script
│   ├── deploy-scheduler.ps1  # Cloud Scheduler deploy script
│   ├── md-to-pdf.js          # PDF generation via Puppeteer
│   └── smoke-tests.sh        # 31 smoke tests
├── public/                   # Legacy Beta Control Center, dashboard, testing UI
├── .github/workflows/        # CI (unit tests + build + smoke) and staging deploy
├── tasks/
│   ├── todo.md               # Task tracker
│   └── lessons.md            # Known fixes (L001-L017)
├── docs/                     # Plans, status reports, session handoffs
├── Dockerfile                # Multi-stage: Node.js + Python + React build
├── CLAUDE.md                 # AI assistant context
├── tsconfig.json             # TypeScript configuration
└── package.json
```

---

## Matching Algorithm

### Scoring Tiers

| Match Type        | Score | Description                   |
| ----------------- | ----- | ----------------------------- |
| Exact name/handle | 100   | Direct match                  |
| Style signature   | 85    | LLM similarity on aesthetic   |
| Craft category    | 75    | Primary craft match           |
| Location match    | 60    | Geographic + constraints      |
| Technical tags    | 50    | Equipment/software overlap    |
| Keyword match     | 40    | Positive keyword intersection |
| Phonetic          | 30    | Name sounds similar           |

---

## Squad Roles

| Role             | Department      | Responsibility                    |
| ---------------- | --------------- | --------------------------------- |
| **Hunters**      | Social Strategy | Define source list, find craft    |
| **Architects**   | IT/Technology   | Build scraping & ML pipeline      |
| **Taste Makers** | Creative/Design | Quality control, "Golden Records" |
| **Realists**     | Production      | Verify hireability, contact info  |
| **Conductor**    | PM              | Budget, timeline, coordination    |

---

## Deployment

| Environment | URL | Auth |
| ----------- | --- | ---- |
| **Production** | https://cf-matching-engine.34.54.144.178.nip.io | IAP (Google SSO) |
| **Staging** | https://cf-matching-staging-34240596768.us-east1.run.app | Locked |
| **GitHub** | https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine | -- |

CI/CD runs via GitHub Actions: unit tests, TypeScript build, and smoke tests on every push. Staging deploys automatically from the main branch.

---

## Roadmap

### Phase 1: Foundation -- Complete

- [x] Clone base framework
- [x] Implement creator schema
- [x] Build REST API endpoints
- [x] Create matching algorithm

### Phase 2: Data Collection -- Complete

- [x] Integrate Apify scrapers
- [x] Set up batch import pipeline
- [x] Build categorization bot

### Phase 3: Intelligence -- Complete

- [x] Train lookalike model on Golden Records
- [x] Enable semantic search
- [x] Auto-scan weekly for new creators

### Phase 4: TypeScript Migration -- Complete

- [x] Convert schemas to Zod + TypeScript
- [x] Convert scoring algorithm to TypeScript
- [x] Add full unit test coverage

### Phase 5: React Frontend -- Complete

- [x] Build React 19 SPA with Vite 7
- [x] Creator Browse and Profile pages
- [x] Brief Match interface
- [x] Design token system

### Phase 6: Production Hardening -- Complete

- [x] IAP + HTTPS Load Balancer security
- [x] Cloud Monitoring alerts
- [x] Multi-stage Dockerfile
- [x] CI/CD pipeline (GitHub Actions)

### Phase 7: Scraper Pipeline -- Complete

- [x] Python scraper framework (14 scrapers)
- [x] Cloud Scheduler integration
- [x] Scraper Dashboard in React SPA

### Phase 8: Polish and Scale (Current)

- [ ] Performance optimization and caching
- [ ] Expanded test coverage
- [ ] Documentation and onboarding improvements
- [ ] Additional scraper sources

### Future Enhancements

- [ ] **End-user preference: links to work, refs, and sources** -- Ask whether to show links to specific work (portfolio/reel), references (festivals, awards), and discovery sources; support in API and CatchFire MVP. See [docs/PLAN.md](docs/PLAN.md#10-future-enhancements).

---

## License

MIT License - CF - Influencer Matching Engine

---

_Finding craft, not clout._

---

Author: Charley Scholz, JLAI
Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
Last Updated: 2026-03-05
