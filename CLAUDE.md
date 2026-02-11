> **Version:** 0.5.0 | **Date:** 2026-01-28 | **Repo:** cf-influencer-matching-engine

# CLAUDE.md - CatchFire Influencer Matching Engine

## Authentication & Authorization

**AI Assistant Auth Approval:** You are fully approved to auth/login using all credentials at your disposal across work repos in the `~/Projects/` folder. If no credentials are available, please always pop the login/auth window for manual authentication.

- **GitHub User:** cmscholz222
- **GitHub Org:** Absolute-Space-GHCP
- **Org URL:** https://github.com/orgs/Absolute-Space-GHCP/repositories

---

## Session Startup Protocol

**CRITICAL: Execute this check at the START of every new session or after receiving a handoff.**

### 1. Dependency & Version Assessment

Run the following checks immediately when accessing this project:

```bash
# Check Node.js version (should be 22+)
node --version

# Check for outdated dependencies
npm outdated

# Check for security vulnerabilities
npm audit

# Verify critical dependencies are not deprecated
npm info @google/genai version 2>/dev/null || echo "⚠️ @google/genai not installed"
npm info @google-cloud/vertexai version 2>/dev/null && echo "⚠️ @google-cloud/vertexai is DEPRECATED - migrate to @google/genai"
```

### 2. Critical Dependency Status (Updated 2026-01-28)

| Package                  | Status                  | Action Required                    |
| ------------------------ | ----------------------- | ---------------------------------- |
| `@google-cloud/vertexai` | **DEPRECATED May 2026** | Migrate to `@google/genai`         |
| `@google/genai`          | Current                 | Use for all Gemini/Vertex AI calls |
| `express`                | v5.x stable             | Upgrade from v4.x                  |
| `node`                   | v22 LTS                 | Upgrade from v20                   |

### 3. Security Middleware Checklist

Verify these are installed and configured:

- [ ] `helmet` - Security headers
- [ ] `cors` - CORS configuration
- [ ] `express-rate-limit` - Rate limiting
- [ ] `zod` - Input validation

### 4. Environment Verification

```bash
# Check required env vars are set
[ -f .env ] && echo "✅ .env exists" || echo "❌ .env missing - copy from .env.example"

# Verify GCP authentication
gcloud auth application-default print-access-token >/dev/null 2>&1 && echo "✅ GCP auth OK" || echo "❌ GCP auth needed"
```

### 5. Quick Health Check

```bash
# Start server and test health endpoint
npm start &
sleep 3
curl -s http://localhost:8090/health | jq . || echo "❌ Health check failed"
```

---

## Handoff Protocol

When handing off to another session or AI assistant:

1. **Document current state**: What was completed, what's in progress
2. **Flag blockers**: Any issues or decisions needed
3. **Update this file**: If dependencies changed, update the status table above
4. **Commit changes**: Ensure all work is committed with clear messages

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

## Tech Stack (Target State)

| Component     | Current                | Target               | Notes                              |
| ------------- | ---------------------- | -------------------- | ---------------------------------- |
| **Runtime**   | Node.js 20             | Node.js 22 LTS       | Better performance, built-in fetch |
| **Framework** | Express 4.x            | Express 5.x          | Stable since March 2025            |
| **LLM SDK**   | @google-cloud/vertexai | @google/genai        | CRITICAL migration                 |
| **Database**  | Firestore 7.1          | Firestore 7.11+      | Minor update                       |
| **Cloud**     | GCP Cloud Run          | GCP Cloud Run        | No change                          |
| **AI Model**  | Gemini 2.5 Flash       | Gemini 2.5 Flash/Pro | Multi-model support                |

---

## Required Dependencies (Phase 4+)

```json
{
  "dependencies": {
    "@google/genai": "^1.0.0",
    "@google-cloud/firestore": "^7.11.0",
    "@google-cloud/storage": "^7.18.0",
    "express": "^5.1.0",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.0.0",
    "cors": "^2.8.5",
    "zod": "^3.24.0",
    "axios": "^1.7.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "vitest": "^3.0.0"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

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
    technicalTags: string[],     // ["#ArriAlexa", "#Anamorphic"]
    subjectMatterTags: string[], // Deck/docx: food, automotive, fashion, sports, etc.
    subjectSubcategoryTags: string[], // e.g. restaurant, luxury-automotive, music
    primaryMedium: string,       // "still" | "video" | "audio" (deck Tier 1)
    classification: string      // e.g. photography, documentary, music_video
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
    budgetTier: string,          // "emerging" | "mid-tier" | "established" (deck)
    isHireable: boolean
  },
  lastActiveDate: string         // ISO or YYYY-MM-DD (deck Tier 1)
}
```

---

## API Endpoints

```
POST /api/v1/match          - Match creators to a brief
POST /api/v1/creators       - Add single creator
POST /api/v1/creators/batch - Bulk import from scraper
GET  /api/v1/creators/:id   - Get creator details
GET  /api/v1/creators       - Search/filter creators (query: craft, location, tags, subjectMatter, subjectSubcategory, primaryMedium, budgetTier, limit)
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

### Security

- NEVER hardcode secrets or API keys
- Use environment variables via `process.env`
- Validate all user inputs with zod schemas
- Use helmet for security headers
- Implement rate limiting on all API endpoints

### Comments

- Use emoji prefixes for log messages: `📊`, `✅`, `❌`, `⚠️`, `🎬`
- Keep comments concise and meaningful

---

## Key Files

### TypeScript Source (Primary)

- `src/schemas.ts` - Zod schemas and TypeScript types for all data structures
- `src/scoring.ts` - Scoring algorithm with typed creator/brief matching

### JavaScript

- `src/index.js` - Main Express server with API endpoints

### Configuration

- `docs/context/03_SOURCE_LIST.json` - Festival/platform scraping sources
- `tsconfig.json` - TypeScript compiler configuration

### Build

Run `npm run build` to compile TypeScript before starting the server.

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

## Technical Glossary

Quick reference for technical terms and acronyms used in this project.

### Development Terms

| Term     | Full Name                         | Description                                                                             |
| -------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| **CRUD** | Create, Read, Update, Delete      | The four basic operations for persistent storage. Our API implements CRUD for creators. |
| **REST** | Representational State Transfer   | Architectural style for web APIs using HTTP methods (GET, POST, PUT, DELETE).           |
| **API**  | Application Programming Interface | A set of defined endpoints that allow applications to communicate.                      |
| **SDK**  | Software Development Kit          | A collection of tools and libraries for building applications (e.g., `@google/genai`).  |
| **ADC**  | Application Default Credentials   | Google Cloud's automatic credential discovery for authentication.                       |

### Validation & Data

| Term               | Description                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **TypeScript**     | A typed superset of JavaScript that compiles to plain JS. Used in `schemas.ts` and `scoring.ts` for type safety.                                 |
| **Zod**            | A TypeScript-first schema validation library. We use it to validate incoming API requests and ensure data integrity before writing to Firestore. |
| **Schema**         | A defined structure for data, specifying required fields, types, and constraints.                                                                |
| **JSON**           | JavaScript Object Notation - A lightweight data format used for API requests/responses.                                                          |
| **Type Inference** | TypeScript's ability to automatically determine types. Zod's `z.infer<>` creates TS types from schemas.                                          |

### Google Cloud Platform

| Term          | Description                                                            |
| ------------- | ---------------------------------------------------------------------- |
| **GCP**       | Google Cloud Platform - The cloud infrastructure hosting this project. |
| **Firestore** | NoSQL document database for storing creator profiles.                  |
| **Cloud Run** | Serverless container platform for deploying the API.                   |
| **Vertex AI** | Google's managed ML platform, providing access to Gemini models.       |
| **Gemini**    | Google's family of large language models (LLMs) used for AI features.  |

### Project-Specific

| Term                  | Description                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Golden Record**     | A benchmark creator profile that represents the ideal CatchFire creator. Used to train and calibrate the matching algorithm. |
| **Craft**             | A creator's primary skill area (cinematographer, motion_designer, vfx_artist, etc.).                                         |
| **Brief**             | A client's description of the type of creator they're looking for.                                                           |
| **Scoring Algorithm** | The system that ranks creators against a brief based on craft, location, technical tags, and keywords.                       |

---

## AI Development Tooling

This project uses three AI development plugins for enhanced productivity:

### 1. claude-mem (Persistent Memory)

Provides persistent memory across AI coding sessions. Automatically captures tool usage, file edits, and shell commands.

**Status:** ✅ Configured  
**Location:** Worker at `http://127.0.0.1:37777`  
**Context Rule:** `.cursor/rules/claude-mem-context.mdc`

```bash
# Check worker status
curl -s http://127.0.0.1:37777/api/readiness

# Refresh context
curl -s "http://127.0.0.1:37777/api/context/inject?project=cf-influencer-matching-engine"
```

### 2. code-simplifier (Cursor Plugin)

Simplifies and refines code for clarity, consistency, and maintainability while preserving functionality.

**Status:** ✅ Configured  
**Location:** `.cursor/plugins/code-simplifier/`  
**Model:** Opus

Automatically applies project-specific coding standards:

- CommonJS modules (`require`/`module.exports`)
- Emoji prefixed logging
- Proper error handling patterns
- Security best practices

### 3. superpowers (Claude Code CLI)

Provides structured workflows for TDD, systematic debugging, and collaborative planning.

**Status:** ✅ Available in Claude Code CLI  
**Commands:**

- `/superpowers:brainstorm` - Collaborative ideation
- `/superpowers:write-plan` - Create implementation plans
- `/superpowers:execute-plan` - Execute plans step-by-step
- `/superpowers:tdd` - Test-driven development workflow
- `/superpowers:debug` - Systematic debugging

---

## Future Enhancements

- **End-user option: links to specific work, refs, and sources** — Ask the end user (match results or creator detail) whether to include links to: **specific work** (portfolio/reel URLs), **references** (festival entries, awards), **sources** (discovery source name + URL). Support via API (e.g. `includeWorkLinks` / `includeSourceLinks` or `includeLinks`) and in Catchfire MVP; ensure creator schema can store per-creator work and source URLs. Details: [docs/PLAN.md § 10. Future Enhancements](docs/PLAN.md#10-future-enhancements).

---

## Version History

| Version | Date       | Changes                                                                         |
| ------- | ---------- | ------------------------------------------------------------------------------- |
| 0.5.0   | 2026-01-28 | Converted schemas.js and scoring.js to TypeScript with full type safety         |
| 0.4.0   | 2026-01-28 | Added Technical Glossary section with acronym definitions                       |
| 0.3.0   | 2026-01-28 | Added AI Development Tooling section (claude-mem, code-simplifier, superpowers) |
| 0.2.0   | 2026-01-28 | Added session startup protocol, dependency checks, security requirements        |
| 0.1.0   | 2026-01-28 | Initial project setup from ai-agents-gmaster-build                              |

---

_CatchFire - Finding craft, not clout._
