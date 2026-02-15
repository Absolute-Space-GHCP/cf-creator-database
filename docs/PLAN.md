> **Version:** 0.3.0 | **Date:** 2026-01-28 | **Repo:** cf-influencer-matching-engine

# CatchFire Matching Engine - Project Plan

**Version:** v0.4.0  
**Status:** ðŸš€ Active Development (Phase 2 Complete)  
**Priority:** High (Founder-level project)

---

## 1. Vision & Goals

### Mission

Build an **automated Creator Matching Engine** that recommends perfect creators for client briefs based on:

- **Style** â€” Content aesthetics, tone, format preferences
- **Passion** â€” Niche expertise, authentic interests
- **Location** â€” Geographic relevance for campaigns

### 3-Month Goal

> Feed a client brief into the system â†’ Get ranked creator recommendations

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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    CATCHFIRE MATCHING ENGINE                                 â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚  DATA SOURCES    â”‚    â”‚  MATCHING ENGINE â”‚    â”‚  API / OUTPUT          â”‚ â”‚
â”‚  â”‚                  â”‚    â”‚                  â”‚    â”‚                        â”‚ â”‚
â”‚  â”‚  â€¢ Festivals     â”‚â”€â”€â”€â–¶â”‚  â€¢ Firestore DB  â”‚â”€â”€â”€â–¶â”‚  POST /api/v1/match    â”‚ â”‚
â”‚  â”‚  â€¢ Platforms     â”‚    â”‚  â€¢ LLM Categorizeâ”‚    â”‚  GET  /api/v1/creators â”‚ â”‚
â”‚  â”‚  â€¢ Communities   â”‚    â”‚  â€¢ Scoring Algo  â”‚    â”‚  POST /api/v1/batch    â”‚ â”‚
â”‚  â”‚  â€¢ Apify Scraper â”‚    â”‚  â€¢ Embeddings    â”‚    â”‚  GET  /dashboard       â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                                              â”‚
â”‚  Integration: Catchfire MVP (Next.js) â†â”€â”€â”€â”€ REST API â”€â”€â”€â”€â†’ This Engine      â”‚
â”‚                                                                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Tech Stack

| Layer                  | Technology                 | Status       | Notes                                  |
| ---------------------- | -------------------------- | ------------ | -------------------------------------- |
| **Runtime**            | Node.js 24                 | âœ… Ready     | Built-in fetch, ES modules             |
| **Framework**          | Express 4.x â†’ 5.x          | â³ Upgrade   | Migrate when stable                    |
| **AI/LLM**             | @google/genai (Gemini 2.5) | â³ Migrate   | From deprecated @google-cloud/vertexai |
| **Database**           | Firestore 7.11+            | â³ Configure | Creator profiles collection            |
| **Scraping**           | Apify (external)           | ðŸ“‹ Planned   | $500 budget allocated                  |
| **Contact Enrichment** | Clay.com / Hunter.io       | ðŸ“‹ Planned   | $1,000 budget allocated                |
| **Deployment**         | Cloud Run                  | âœ… Exists    | catchfire-app-2026 project             |

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
| 0.1 | Clone golden master framework    | âœ… Done | From ai-agents-gmaster-build        |
| 0.2 | Set up GCP authentication        | âœ… Done | catchfire-app-2026 project          |
| 0.3 | Create .env configuration        | âœ… Done | Project ID, region, model           |
| 0.4 | Create URL_API_REFERENCE.md      | âœ… Done | All accounts documented             |
| 0.5 | Organize requestor context files | âœ… Done | docs/context/ folder                |
| 0.6 | Create comprehensive PLAN.md     | âœ… Done | This document                       |
| 0.7 | Install dependencies             | âœ… Done | 238 packages, 0 vulnerabilities     |
| 0.8 | Verify local server starts       | âœ… Done | New index.js, all endpoints working |
| 0.9 | Migrate to @google/genai SDK     | âœ… Done | Both SDKs installed (new + legacy)  |

### Phase 1: API Foundation (v0.2.0) âœ… COMPLETE

**Goal:** Working CRUD API for creators

| #   | Task                              | Status  | Notes                        |
| --- | --------------------------------- | ------- | ---------------------------- |
| 1.0 | Enable Firestore API & create DB  | âœ… Done | nam5 region                  |
| 1.1 | Implement creator schema (zod)    | âœ… Done | src/schemas.js               |
| 1.2 | Build GET /api/v1/creators        | âœ… Done | List/search/filter           |
| 1.3 | Build POST /api/v1/creators       | âœ… Done | With validation              |
| 1.4 | Build POST /api/v1/creators/batch | âœ… Done | With validation              |
| 1.5 | Build GET /api/v1/creators/:id    | âœ… Done | Get by ID                    |
| 1.6 | Implement scoring algorithm       | âœ… Done | src/scoring.js               |
| 1.7 | Build POST /api/v1/match          | âœ… Done | Keyword extraction + scoring |

### Phase 2: Intelligence Layer (v0.3.0) âœ… COMPLETE

**Goal:** LLM-powered categorization and style analysis

| #   | Task                                  | Status  | Notes                                    |
| --- | ------------------------------------- | ------- | ---------------------------------------- |
| 2.1 | Build POST /api/v1/categorize         | âœ… Done | Vertex AI + Gemini 2.5 Flash             |
| 2.2 | Implement style signature generation  | âœ… Done | POST /api/v1/style-signature             |
| 2.3 | Add positive/negative keyword scoring | âœ… Done | Auto-detect influencer noise + pro bonus |
| 2.4 | Create "Golden Records" import        | âœ… Done | 10 benchmark creators imported           |
| 2.5 | Build batch processing pipeline       | âœ… Done | POST /api/v1/import/apify with LLM       |

### Phase 3: Search & Discovery (v0.4.0)

**Goal:** Semantic search and automated discovery

| #   | Task                                    | Status     | Notes                    |
| --- | --------------------------------------- | ---------- | ------------------------ |
| 3.1 | Implement embeddings generation         | â³ Pending | Vertex AI text-embedding |
| 3.2 | Build semantic search endpoint          | â³ Pending | "Find similar to X"      |
| 3.3 | Train lookalike model on Golden Records | â³ Pending | 500+ vetted creators     |
| 3.4 | Set up weekly auto-scan                 | â³ Pending | Cloud Scheduler          |
| 3.5 | Integration with Catchfire MVP          | â³ Pending | REST API bridge          |

---

## 6. Budget Allocation ($5,000)

| Category            | Amount | Status      | Tools                                     |
| ------------------- | ------ | ----------- | ----------------------------------------- |
| **Scraping & Data** | $1,500 | ðŸ“‹ Planned  | Apify ($500), Clay.com/Hunter.io ($1,000) |
| **Infrastructure**  | $500   | ðŸ“‹ Planned  | Firestore, Cloud Run                      |
| **TBD Fund**        | $3,000 | ðŸ“‹ Reserved | Additional needs                          |

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
| Local server running         | Week 1  | â³     |
| CRUD API working             | Week 2  | â³     |
| First 50 creators imported   | Week 3  | â³     |
| LLM categorization working   | Week 4  | â³     |
| First match query successful | Week 5  | â³     |
| 500 vetted creators          | Month 2 | â³     |
| Lookalike model trained      | Month 2 | â³     |
| Auto-scan running            | Month 3 | â³     |

---

## 9. Open Questions

- [ ] Confirm Apify actor selection for each platform
- [ ] Define "Golden Records" criteria with Creative team
- [ ] Platform ToS review for scraping compliance
- [ ] Rate limiting strategy for API endpoints
- [ ] Catchfire MVP integration timeline
- [ ] **External / cultural â€œliveâ€ data layer:** Not a separate system in current scope. Today, external data enters via **Scraper/ingest** (Apify, festivals, platforms, communities) â†’ Firestore â†’ Analyzer (LLM) â†’ Search/match. A dedicated â€œcultural liveâ€ or real-time trend feed is TBD; options: (1) enrich creator records from trend/cultural sources during ingest, (2) add a live/trend API that influences match or filters. Confirm with Dan if a specific cultural/live data source is required.

---

## 10. Future Enhancements

- **End-user preference: links to specific work, refs, and sources**  
  Ask the end user (e.g. in match results or creator detail flows) whether they want to see links to:
  - **Specific work** â€” portfolio pieces, reels, selected projects per creator
  - **References** â€” festival entries, awards, editorial features
  - **Sources** â€” discovery source (festival, platform, community) and source URL  
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

_CatchFire â€” Finding craft, not clout._

---

Author: Charley Scholz, JLAI  
Co-authored: Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)  
Last Updated: 2026-01-28
