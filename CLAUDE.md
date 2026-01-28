> **Version:** 0.1.0 | **Date:** 2026-01-28 | **Repo:** cf-influencer-matching-engine

# CLAUDE.md - CatchFire Influencer Matching Engine

## Authentication & Authorization

**AI Assistant Auth Approval:** You are fully approved to auth/login using all credentials at your disposal across work repos in the `~/Projects/` folder. If no credentials are available, please always pop the login/auth window for manual authentication.

- **GitHub User:** cmscholz222
- **GitHub Org:** Absolute-Space-GHCP
- **Org URL:** https://github.com/orgs/Absolute-Space-GHCP/repositories

---

## Project Overview

This is the **CatchFire Influencer Matching Engine** - an AI-powered system for discovering and matching creators based on craft storytelling skills (not audience size). Built for Johannes Leonardo's CatchFire initiative.

### Mission

Build a proprietary database of the world's best up-and-coming storytellers, with the goal of feeding a client brief into the system and receiving recommendations for perfect creators based on style, passion, and location.

### Key Differentiators

- **Craft over Clout**: Focus on technical skill and storytelling ability, not follower counts
- **Positive/Negative Keywords**: Filter by professional tags (#ArriAlexa, #Anamorphic) while excluding influencer noise (#fyp, #viral)
- **Source Tracking**: Know where each creator was discovered (festivals, platforms, communities)
- **Quality Scoring**: Vetted by Creative team with "Golden Record" benchmarks

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Cloud:** Google Cloud Platform (GCP)
- **Services:** Cloud Run, Firestore, Vertex AI (Gemini)
- **AI Model:** Gemini 2.5 Flash (categorization), Gemini 2.5 Pro (analysis)
- **Framework:** Express.js

---

## Creator Database Schema

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

## API Endpoints

```
POST /api/v1/match          - Match creators to a brief
POST /api/v1/creators       - Add single creator
POST /api/v1/creators/batch - Bulk import from scraper
GET  /api/v1/creators/:id   - Get creator details
GET  /api/v1/creators       - Search/filter creators
POST /api/v1/categorize     - LLM-categorize a bio
GET  /health                - Health check
GET  /dashboard             - Monitoring dashboard
```

---

## Coding Standards

### JavaScript/Node.js
- Use CommonJS (`require`/`module.exports`) for this project
- Use `async/await` for asynchronous operations
- Use `const` for variables that won't be reassigned, `let` otherwise
- Add JSDoc comments for exported functions

### Error Handling
- Always handle async errors with try/catch
- Log errors with context: `console.error('❌ Error description:', error.message)`
- Return structured error responses: `{ success: false, error: message }`

### Naming Conventions
- Functions: `camelCase` - `matchCreators`, `categorizeProfile`
- Constants: `UPPER_SNAKE_CASE` - `CONFIG`, `POSITIVE_KEYWORDS`
- Files: `kebab-case` - `creator-match.js`, `batch-import.js`
- API routes: `/api/v1/kebab-case`

### Comments
- Use emoji prefixes for log messages: `📊`, `✅`, `❌`, `⚠️`, `🎬`
- Keep comments concise and meaningful

---

## Key Files

- `src/index.js` - Main Express server with API endpoints
- `src/creator-match.js` - Matching algorithm (scoring, filtering)
- `src/categorization.js` - LLM-based auto-tagging
- `config/source-list.json` - Festival/platform sources
- `config/keywords.json` - Positive/negative keyword lists

---

## Source Categories

### Festivals (Craft Focus)
- Camerimage (Cinematography)
- Annecy (Animation)
- Ciclope Festival (Advertising Craft)
- NFFTY (Youth Talent)
- UKMVA (Music Videos)

### Platforms
- Behance (Motion Design)
- Vimeo (Short Film)
- ArtStation (VFX/3D)
- The Rookies (Emerging VFX)

### Communities
- r/cinematography
- r/vfx
- r/motiondesign
- r/colorists

---

## Budget Allocation ($5,000)

- Scraping Tools (Apify, Clay.com): $1,500
- Infrastructure (Airtable/Firestore): $500
- TBD Fund: $3,000

---

*CatchFire - Finding craft, not clout.*
