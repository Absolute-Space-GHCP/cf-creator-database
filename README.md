> **Version:** 0.1.0 | **Date:** 2026-01-28 | **Repo:** cf-influencer-matching-engine

# CatchFire Influencer Matching Engine

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](./CHANGELOG.md)
[![Platform](https://img.shields.io/badge/platform-Cloud%20Run-orange.svg)](https://cloud.google.com/run)
[![AI](https://img.shields.io/badge/AI-Gemini%202.5-green.svg)](https://cloud.google.com/vertex-ai)

**AI-powered creator discovery and matching based on craft storytelling skills.**

---

## Overview

CatchFire's mission is to build a proprietary database of the world's best up-and-coming storytellers—with a specific focus on **craft storytelling skills** over audience size.

### The Vision

In 3 months, feed a client brief into the system and receive recommendations for perfect creators based on:

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

## Features

### Creator Matching

- **Multi-factor scoring**: Style, craft category, location, technical tags
- **LLM-powered categorization**: Automatically classify creators from bio/portfolio
- **Negative keyword filtering**: Exclude influencer noise

### Data Sources

- **Festivals**: Camerimage, Annecy, Ciclope, NFFTY, UKMVA
- **Platforms**: Behance, Vimeo, ArtStation, The Rookies
- **Communities**: Reddit cinematography, VFX, motion design subs

### API-First Design

```
POST /api/v1/match          - Match creators to client brief
POST /api/v1/creators       - Add creator to database
POST /api/v1/creators/batch - Bulk import from Apify scraper
GET  /api/v1/creators       - Search/filter creators
POST /api/v1/categorize     - Auto-categorize from bio
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Google Cloud Project with Firestore enabled
- Vertex AI API enabled

### Installation

```bash
# Clone the repo
git clone https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine.git
cd cf-influencer-matching-engine

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your GCP project details

# Start the server
npm start
```

### Environment Variables

```env
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GEMINI_MODEL=gemini-2.5-flash
FIRESTORE_COLLECTION=creators
PORT=8090
```

---

## Project Structure

```
cf-influencer-matching-engine/
├── src/
│   ├── index.js              # Main Express server
│   ├── creator-match.js      # Matching algorithm (TODO)
│   ├── categorization.js     # LLM auto-tagging (TODO)
│   └── sync_firestore.js     # Data sync utilities
├── config/
│   ├── source-list.json      # Festival/platform sources
│   └── keywords.json         # Positive/negative keywords
├── docs/
│   ├── SETUP.md              # Deployment guide
│   ├── SCHEMA.md             # Database schema
│   └── API.md                # API documentation
├── public/
│   └── dashboard.html        # Monitoring dashboard
├── CLAUDE.md                 # AI assistant context
├── package.json
└── .env.example
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

## Roadmap

### Phase 1: Foundation — ✅ Complete

- [x] Clone base framework
- [x] Implement creator schema
- [x] Build REST API endpoints
- [x] Create matching algorithm

### Phase 2: Data Collection — ✅ Complete

- [x] Integrate Apify scrapers
- [x] Set up batch import pipeline
- [x] Build categorization bot

### Phase 3: Intelligence (Current)

- [ ] Train lookalike model on Golden Records
- [ ] Enable semantic search
- [ ] Auto-scan weekly for new creators

### Future enhancements

- [ ] **End-user preference: links to work, refs, and sources** — Ask whether to show links to specific work (portfolio/reel), references (festivals, awards), and discovery sources; support in API and Catchfire MVP. See [docs/PLAN.md](docs/PLAN.md#10-future-enhancements).

---

## License

MIT License - CF - Influencer Matching Engine

---

_Finding craft, not clout._
