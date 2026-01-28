> **Version:** 0.2.0 | **Date:** 2026-01-28 | **Repo:** cf-influencer-matching-engine

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

| Package | Status | Action Required |
|---------|--------|-----------------|
| `@google-cloud/vertexai` | **DEPRECATED May 2026** | Migrate to `@google/genai` |
| `@google/genai` | Current | Use for all Gemini/Vertex AI calls |
| `express` | v5.x stable | Upgrade from v4.x |
| `node` | v22 LTS | Upgrade from v20 |

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

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| **Runtime** | Node.js 20 | Node.js 22 LTS | Better performance, built-in fetch |
| **Framework** | Express 4.x | Express 5.x | Stable since March 2025 |
| **LLM SDK** | @google-cloud/vertexai | @google/genai | CRITICAL migration |
| **Database** | Firestore 7.1 | Firestore 7.11+ | Minor update |
| **Cloud** | GCP Cloud Run | GCP Cloud Run | No change |
| **AI Model** | Gemini 2.5 Flash | Gemini 2.5 Flash/Pro | Multi-model support |

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

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.2.0 | 2026-01-28 | Added session startup protocol, dependency checks, security requirements |
| 0.1.0 | 2026-01-28 | Initial project setup from ai-agents-gmaster-build |

---

*CatchFire - Finding craft, not clout.*
