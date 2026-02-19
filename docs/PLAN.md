> **Version:** 0.7.0 | **Date:** 2026-02-19 | **Repo:** cf-influencer-matching-engine

# CatchFire Matching Engine - Project Plan

**Version:** v0.7.0  
**Status:** 🚀 Active Development (Phase 7 Complete)  
**Priority:** High (Founder-level project)

---

## 1. Vision & Goals

### Mission

Build an **automated Creator Matching Engine** that recommends perfect creators for client briefs based on:

- **Style** — Content aesthetics, tone, format preferences
- **Passion** — Niche expertise, authentic interests
- **Location** — Geographic relevance for campaigns

### 3-Month Goal

> Feed a client brief into the system → Get ranked creator recommendations

### Key Differentiator: Craft Over Clout

| Traditional Influencer Tools   | CatchFire Engine                            |
| ------------------------------ | ------------------------------------------- |
| Focus on follower counts       | Focus on craft and skill                    |
| Surface-level metrics          | Deep portfolio analysis                     |
| Influencer tags (#fyp, #viral) | Professional tags (#ArriAlexa, #Anamorphic) |
| Instagram/TikTok trending      | Festival winners, Vimeo Staff Picks         |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CATCHFIRE MATCHING ENGINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────────────┐ │
│  │  DATA SOURCES    │    │  MATCHING ENGINE │    │  API / OUTPUT          │ │
│  │                  │    │                  │    │                        │ │
│  │  • Festivals     │───▶│  • Firestore DB  │───▶│  POST /api/v1/match    │ │
│  │  • Platforms     │    │  • LLM Categorize│    │  GET  /api/v1/creators │ │
│  │  • Communities   │    │  • Scoring Algo  │    │  POST /api/v1/batch    │ │
│  │  • Apify Scraper │    │  • Embeddings    │    │  GET  /dashboard       │ │
│  └──────────────────┘    └──────────────────┘    └────────────────────────┘ │
│                                                                              │
│  Integration: Catchfire MVP (Next.js) ←──── REST API ────→ This Engine      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer                  | Technology                 | Status       | Notes                                  |
| ---------------------- | -------------------------- | ------------ | -------------------------------------- |
| **Runtime**            | Node.js 24                 | ✅ Ready     | Built-in fetch, ES modules             |
| **Framework**          | Express 4.x → 5.x          | ⏳ Upgrade   | Migrate when stable                    |
| **AI/LLM**             | @google/genai (Gemini 2.5) | ⏳ Migrate   | From deprecated @google-cloud/vertexai |
| **Database**           | Firestore 7.11+            | ⏳ Configure | Creator profiles collection            |
| **Scraping**           | Apify (external)           | 📋 Planned   | $500 budget allocated                  |
| **Contact Enrichment** | Clay.com / Hunter.io       | 📋 Planned   | $1,000 budget allocated                |
| **Deployment**         | Cloud Run                  | ✅ Exists    | catchfire-app-2026 project             |

---

## 3. Data Sources (The "Iceberg" Strategy)

> Scrape the bottom 90% where professionals work, not the top 10% where influencers trend.

### Festivals (Craft Focus)

| Festival             | Focus              | Priority Sections                             |
| -------------------- | ------------------ | --------------------------------------------- |
| **Camerimage**       | Cinematography     | Golden Frog nominees, Music Video Competition |
| **Annecy**           | Animation          | Short Films, Graduation Films                 |
| **Ciclope Festival** | Advertising Craft  | Winners Gallery, Shortlist                    |
| **NFFTY**            | Youth Talent (<24) | Jury Awards, Audience Awards                  |
| **UKMVA**            | Music Videos       | Best Technical Achievement                    |

### Platforms

| Platform           | Focus                     | Filters                         |
| ------------------ | ------------------------- | ------------------------------- |
| **Behance**        | Motion Graphics           | Curated Galleries, Featured     |
| **Vimeo**          | Short Film & Experimental | Staff Picks, Best of Month/Year |
| **ArtStation**     | VFX & 3D                  | Trending, Picks                 |
| **The Rookies**    | Emerging VFX/Game Dev     | Rookie Awards finalists         |
| **Motionographer** | Motion Design             | Quickies, Features              |

### Communities

- r/cinematography (flair: breakdown, lighting)
- r/vfx (flair: showreel)
- r/motiondesign
- r/colorists
- r/editors

### Keywords

**Positive (Craft Indicators):**

```
#ArriAlexa, #SonyVenice, #BMPCC6K, #Anamorphic, #CookeLenses,
#HoudiniFX, #NukeX, #Redshift3D, #UnrealEngine5, #DaVinciResolve,
#StopMotion, #PracticalEffects, #MattePainting, #VirtualProduction
```

**Negative (Influencer Noise):**

```
#fyp, #foryoupage, #viral, #trending, #lifestyle, #ootd, #grwm,
#vlog, #influencer, #contentcreator, #canonm50
```

---

## 4. Creator Schema

```javascript
{
  id: string,                    // Auto-generated
  name: string,                  // "Alex Chen"
  handle: string,                // "@alexchen_dp"
  platform: string,              // "vimeo" | "behance" | "instagram"

  source: {
    type: string,                // "festival" | "platform" | "community"
    name: string,                // "Camerimage" | "r/cinematography"
    url: string,                 // Discovery URL
    discoveredAt: timestamp
  },

  craft: {
    primary: string,             // "cinematographer" | "motion_designer"
    secondary: string[],         // ["colorist", "editor"]
    styleSignature: string,      // LLM-generated style description
    technicalTags: string[]      // ["#ArriAlexa", "#Anamorphic"]
  },

  matching: {
    positiveKeywords: string[],  // Professional indicators
    negativeKeywords: string[],  // Exclusion tags
    qualityScore: number,        // 0-100
    isGoldenRecord: boolean,     // Benchmark creator
    lastVerified: timestamp
  },

  contact: {
    email: string,
    portfolio_url: string,
    location: string,
    locationConstraints: string, // "digital_only" | "on_site" | "flexible"
    rateRange: string,
    isHireable: boolean
  }
}
```

---

## 5. Phased Implementation

### Phase 0: Foundation (Current Sprint)

**Goal:** Get the engine running locally with basic API endpoints

| #   | Task                             | Status  | Notes                               |
| --- | -------------------------------- | ------- | ----------------------------------- |
| 0.1 | Clone golden master framework    | ✅ Done | From ai-agents-gmaster-build        |
| 0.2 | Set up GCP authentication        | ✅ Done | catchfire-app-2026 project          |
| 0.3 | Create .env configuration        | ✅ Done | Project ID, region, model           |
| 0.4 | Create URL_API_REFERENCE.md      | ✅ Done | All accounts documented             |
| 0.5 | Organize requestor context files | ✅ Done | docs/context/ folder                |
| 0.6 | Create comprehensive PLAN.md     | ✅ Done | This document                       |
| 0.7 | Install dependencies             | ✅ Done | 238 packages, 0 vulnerabilities     |
| 0.8 | Verify local server starts       | ✅ Done | New index.js, all endpoints working |
| 0.9 | Migrate to @google/genai SDK     | ✅ Done | Both SDKs installed (new + legacy)  |

### Phase 1: API Foundation (v0.2.0) ✅ COMPLETE

**Goal:** Working CRUD API for creators

| #   | Task                              | Status  | Notes                        |
| --- | --------------------------------- | ------- | ---------------------------- |
| 1.0 | Enable Firestore API & create DB  | ✅ Done | nam5 region                  |
| 1.1 | Implement creator schema (zod)    | ✅ Done | src/schemas.js               |
| 1.2 | Build GET /api/v1/creators        | ✅ Done | List/search/filter           |
| 1.3 | Build POST /api/v1/creators       | ✅ Done | With validation              |
| 1.4 | Build POST /api/v1/creators/batch | ✅ Done | With validation              |
| 1.5 | Build GET /api/v1/creators/:id    | ✅ Done | Get by ID                    |
| 1.6 | Implement scoring algorithm       | ✅ Done | src/scoring.js               |
| 1.7 | Build POST /api/v1/match          | ✅ Done | Keyword extraction + scoring |

### Phase 2: Intelligence Layer (v0.3.0) ✅ COMPLETE

**Goal:** LLM-powered categorization and style analysis

| #   | Task                                  | Status  | Notes                                    |
| --- | ------------------------------------- | ------- | ---------------------------------------- |
| 2.1 | Build POST /api/v1/categorize         | ✅ Done | Vertex AI + Gemini 2.5 Flash             |
| 2.2 | Implement style signature generation  | ✅ Done | POST /api/v1/style-signature             |
| 2.3 | Add positive/negative keyword scoring | ✅ Done | Auto-detect influencer noise + pro bonus |
| 2.4 | Create "Golden Records" import        | ✅ Done | 10 benchmark creators imported           |
| 2.5 | Build batch processing pipeline       | ✅ Done | POST /api/v1/import/apify with LLM       |

### Phase 3: Search & Discovery (v0.4.0)

**Goal:** Semantic search and automated discovery

| #   | Task                                    | Status     | Notes                    |
| --- | --------------------------------------- | ---------- | ------------------------ |
| 3.1 | Implement embeddings generation         | ⏳ Pending | Vertex AI text-embedding |
| 3.2 | Build semantic search endpoint          | ⏳ Pending | "Find similar to X"      |
| 3.3 | Train lookalike model on Golden Records | ⏳ Pending | 500+ vetted creators     |
| 3.4 | Set up weekly auto-scan                 | ⏳ Pending | Cloud Scheduler          |
| 3.5 | Integration with Catchfire MVP          | ⏳ Pending | REST API bridge          |

---

## 6. Budget Allocation ($5,000)

| Category            | Amount | Status      | Tools                                     |
| ------------------- | ------ | ----------- | ----------------------------------------- |
| **Scraping & Data** | $1,500 | 📋 Planned  | Apify ($500), Clay.com/Hunter.io ($1,000) |
| **Infrastructure**  | $500   | 📋 Planned  | Firestore, Cloud Run                      |
| **TBD Fund**        | $3,000 | 📋 Reserved | Additional needs                          |

---

## 7. Squad Roles Reference

| Role             | Department      | Responsibility                    |
| ---------------- | --------------- | --------------------------------- |
| **Hunters**      | Social Strategy | Define source list, find craft    |
| **Architects**   | IT/Technology   | Build scraping & ML pipeline      |
| **Taste Makers** | Creative/Design | Quality control, "Golden Records" |
| **Realists**     | Production      | Verify hireability, contact info  |
| **Conductor**    | PM              | Budget, timeline, coordination    |

---

## 8. Success Metrics

| Milestone                    | Target  | Status |
| ---------------------------- | ------- | ------ |
| Local server running         | Week 1  | ⏳     |
| CRUD API working             | Week 2  | ⏳     |
| First 50 creators imported   | Week 3  | ⏳     |
| LLM categorization working   | Week 4  | ⏳     |
| First match query successful | Week 5  | ⏳     |
| 500 vetted creators          | Month 2 | ⏳     |
| Lookalike model trained      | Month 2 | ⏳     |
| Auto-scan running            | Month 3 | ⏳     |

---

## 9. Open Questions

- [ ] Confirm Apify actor selection for each platform
- [ ] Define "Golden Records" criteria with Creative team
- [ ] Platform ToS review for scraping compliance
- [ ] Rate limiting strategy for API endpoints
- [ ] Catchfire MVP integration timeline
- [ ] **External / cultural "live" data layer:** Not a separate system in current scope. Today, external data enters via **Scraper/ingest** (Apify, festivals, platforms, communities) → Firestore → Analyzer (LLM) → Search/match. A dedicated "cultural live" or real-time trend feed is TBD; options: (1) enrich creator records from trend/cultural sources during ingest, (2) add a live/trend API that influences match or filters. Confirm with Dan if a specific cultural/live data source is required.

---

## 10. Future Enhancements

- **End-user preference: links to specific work, refs, and sources**  
  Ask the end user (e.g. in match results or creator detail flows) whether they want to see links to:
  - **Specific work** — portfolio pieces, reels, selected projects per creator
  - **References** — festival entries, awards, editorial features
  - **Sources** — discovery source (festival, platform, community) and source URL  
  Respect this preference in API responses and in the Catchfire MVP UI (e.g. optional `includeWorkLinks`, `includeSourceLinks` or a single `includeLinks` flag). Store per-creator work/source URLs in the creator schema where not already present.

---

## 11. Change Log

| Date       | Version | Changes                                                          |
| ---------- | ------- | ---------------------------------------------------------------- |
| 2026-01-28 | 0.4.0   | Phase 2 complete: LLM categorization, style signatures, Apify    |
| 2026-01-28 | 0.3.0   | Phase 1 complete: CRUD API, zod validation, scoring algorithm    |
| 2026-01-28 | 0.2.0   | Comprehensive plan from requestor context; Phase 0 tasks defined |
| 2026-01-28 | 0.1.0   | Initial project setup from golden master                         |

---

_CatchFire — Finding craft, not clout._

---

Author: Charley Scholz  
Co-authored: Claude Opus 4.6, Cursor (IDE)  
Last Updated: 2026-02-19
