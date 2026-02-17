# LEARN.md - Known Fixes and Lessons Learned

**Purpose:** This document captures recurring problems and their verified solutions. AI coding assistants MUST consult this file at session start and proactively apply these fixes when working in relevant areas. Developers should reference this before debugging issues that may already be solved.

**How to use:** Each entry has a Problem, Root Cause, Solution, and file references. When touching the listed files, verify the fix is still in place. When encountering the listed symptoms, apply the known solution before investigating further.

---

## Table of Contents

| ID | Title | Severity | Files Affected |
|----|-------|----------|----------------|
| [L001](#l001-powershell-does-not-support-heredoc-or--chaining) | PowerShell Does Not Support Heredoc or && Chaining | High | All shell commands |
| [L002](#l002-missing-dev-artifacts-after-clone-or-device-switch) | Missing Dev Artifacts After Clone or Device Switch | Medium | `.gitignore`, `package.json` |
| [L003](#l003-deprecated-google-cloudvertexai-sdk) | Deprecated @google-cloud/vertexai SDK | High | `src/llm.ts`, `package.json` |
| [L004](#l004-mojibake-emoji-encoding-in-typescript-files) | Mojibake Emoji Encoding in TypeScript Files | Medium | `src/llm.ts`, `src/schemas.ts`, `src/scoring.ts` |
| [L005](#l005-express-5-migration-considerations) | Express 5 Migration Considerations | Medium | `src/index.js`, `package.json` |
| [L006](#l006-package-lockjson-must-be-committed) | package-lock.json Must Be Committed | Medium | `.gitignore`, `package-lock.json` |
| [L007](#l007-legacy-test-files-from-golden-master-template) | Legacy Test Files from Golden Master Template | Low | `tests/` directory |
| [L008](#l008-project-has-three-testing-layers--know-them-all) | Project Has Three Testing Layers -- Know Them All | Info | `tests/`, `docs/TESTING_*.md`, `public/testing.html` |
| [L009](#l009-pdf-generation--use-jspdf-not-puppeteermd-to-pdf) | PDF Generation -- Use jsPDF, Not Puppeteer | Medium | `scripts/generate-status-pdf.mjs` |

---

## L001: PowerShell Does Not Support Heredoc or && Chaining

**Severity:** High
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-17
**Status:** PERMANENT - PowerShell limitation, will never be fixed

### Problem

Git commit commands and chained shell commands using bash syntax fail in PowerShell.

### Symptoms

- `The token '&&' is not a valid statement separator in this version.`
- `Missing file specification after redirection operator.`
- `The '<' operator is reserved for future use.`

### Root Cause

PowerShell is NOT bash. It does not support `&&` chaining or heredoc (`<<'EOF'`) syntax.

### Solution

```powershell
# Correct: Use semicolons for chaining
git add -A; git commit -m "feat: description"

# Correct: Multi-line with backtick-n
git commit -m "feat: title`n`nLonger description"

# WRONG: bash chaining
git add -A && git commit -m "message"

# WRONG: bash heredoc
git commit -m "$(cat <<'EOF'
message
EOF
)"
```

### Proactive Maintenance

1. NEVER use `&&` to chain commands -- use `;` instead
2. NEVER use heredoc -- use simple `-m "message"` strings
3. NEVER use unquoted `&` in commit messages -- spell out "and"
4. This applies to ALL shell commands, not just git

### Cross-Project Applicability

Applies to ALL projects on this Windows/PowerShell workstation.

---

## L002: Missing Dev Artifacts After Clone or Device Switch

**Severity:** Medium
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-17
**Status:** PERMANENT - Expected behavior for gitignored files

### Problem

After cloning the repo or switching machines, `node_modules`, `.env`, and compiled TypeScript output (`.js` from `.ts`) are missing. The server won't start.

### Symptoms

- `Error: Cannot find module 'express'` (node_modules missing)
- Server crashes on start (no .env)
- `Cannot find module './schemas'` (TypeScript not compiled)

### Root Cause

These files are intentionally gitignored:
- `node_modules/` - standard; restored via `npm install`
- `.env` - secrets; restored from `.env.example`
- `src/schemas.js`, `src/scoring.js`, `src/llm.js` - compiled TS; restored via `npm run build`

### Solution

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
# Copy .env.example to .env, set GCP_PROJECT_ID=catchfire-app-2026

# 3. Build TypeScript
npm run build

# 4. Start server
npm run dev
```

### Proactive Maintenance

1. After any fresh clone, run all 4 steps above
2. If server won't start, check these three things first
3. This is NOT a code regression -- it's expected gitignore behavior

---

## L003: Deprecated @google-cloud/vertexai SDK

**Severity:** High
**First Observed:** 2026-01-28
**Last Confirmed:** 2026-02-17
**Status:** FIXED - Fully migrated to @google/genai on 2026-02-17

### Problem

`@google-cloud/vertexai` is deprecated (May 2026 EOL). The codebase previously used it as a fallback when no API key was present.

### Symptoms

- Deprecation warnings in npm output
- Dual-client code paths (GoogleGenAI + VertexAI) adding complexity
- Embeddings didn't work with the VertexAI fallback path

### Root Cause

The `@google/genai` SDK now supports both API key auth AND Vertex AI (ADC) auth natively, making the legacy SDK unnecessary.

### Solution

**Files fixed:** `src/llm.ts`, `package.json`

Replaced dual-client setup with unified `@google/genai`:
```typescript
// API key mode
genAI = new GoogleGenAI({ apiKey });

// Vertex AI / ADC mode (no API key)
genAI = new GoogleGenAI({
    vertexai: true,
    project: GCP_PROJECT_ID,
    location: GCP_REGION
});
```

### Proactive Maintenance

1. NEVER add `@google-cloud/vertexai` back to dependencies
2. All Gemini/Vertex AI calls go through `@google/genai`
3. If auth fails, check: API key in env OR `gcloud auth application-default login`

---

## L004: Mojibake Emoji Encoding in TypeScript Files

**Severity:** Medium
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-17
**Status:** FIXED - Files rewritten with correct encoding

### Problem

Emoji characters in TypeScript source files (section headers like `// 🔧 CONFIGURATION`) display as mojibake sequences when read by certain tools.

### Symptoms

- `ðŸ"§` instead of `🔧` in file reads
- `âœ…` instead of `✅` in console output
- `StrReplace` tool fails to match strings containing emoji

### Root Cause

UTF-8 multi-byte emoji sequences were interpreted incorrectly when files passed through Windows encoding boundaries. The `StrReplace` tool cannot reliably match these garbled bytes.

### Solution

When emoji-containing files need bulk edits, use the `Write` tool to rewrite the entire file rather than `StrReplace` on individual sections.

### Proactive Maintenance

1. When `StrReplace` fails on emoji-containing text, use `Write` to rewrite the file
2. Prefer ASCII alternatives in code comments where possible
3. Emoji in `console.log` strings are fine -- they display correctly at runtime

---

## L005: Express 5 Migration Considerations

**Severity:** Medium
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-17
**Status:** FIXED - Migrated from Express 4 to 5 on 2026-02-17

### Problem

Express 5 has breaking changes from Express 4 that can affect routing and middleware.

### Symptoms

- `app.del()` removed (use `app.delete()`)
- `req.host` now includes port
- Path matching slightly different
- `app.listen()` returns a Promise

### Root Cause

Express 5 was a major version upgrade. Our codebase was clean (no deprecated patterns), so migration was smooth.

### Solution

No code changes were needed in `src/index.js` for the Express 5 upgrade -- the existing code used only standard patterns. Key verification:
- `app.listen()` with callback still works (keeps process alive)
- All route handlers use standard `app.get()` / `app.post()` patterns
- No `app.del()` or `app.param(fn)` usage

### Proactive Maintenance

1. If adding new routes, use `app.delete()` not `app.del()`
2. If checking `req.host`, be aware it may include port in Express 5
3. Express 5 auto-catches rejected promises in route handlers

---

## L006: package-lock.json Must Be Committed

**Severity:** Medium
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-17
**Status:** FIXED - Removed from .gitignore on 2026-02-17

### Problem

`package-lock.json` was listed in `.gitignore`, causing `npm audit` to fail and making dependency versions non-reproducible across machines.

### Symptoms

- `npm audit` error: `This command requires an existing lockfile`
- Different machines may resolve to different dependency versions
- No guarantee of reproducible builds

### Root Cause

Holdover from the golden master template that gitignored the lockfile. Best practice for applications (not libraries) is to commit it.

### Solution

**File fixed:** `.gitignore`

Removed `package-lock.json` from the gitignore. The lockfile is now committed and tracked.

### Proactive Maintenance

1. NEVER re-add `package-lock.json` to `.gitignore`
2. Always commit lockfile changes alongside `package.json` changes
3. Use `npm ci` in CI/CD for exact lockfile installation

---

## L007: Legacy Test Files from Golden Master Template

**Severity:** Low
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-17
**Status:** MONITORING - Files still present but harmless

### Problem

The `tests/` directory contains legacy test scripts from the `ai-agents-gmaster-build` golden master template that test unrelated GCP services (Discovery Engine, employees collection).

### Symptoms

- `tests/test_vertex.js` references `jlai-gm-v3` project (not CatchFire)
- `tests/check_firestore.js` queries `employees` collection (doesn't exist in CatchFire)
- `tests/debug_engine.js` and `tests/debug_serving_configs.js` test Discovery Engine (not used)

### Root Cause

These files were inherited from the golden master template and never updated for the CatchFire project.

### Solution

New vitest-based tests were added (`tests/schemas.test.ts`, `tests/scoring.test.ts`) that test the actual CatchFire codebase. The legacy scripts are harmless but should be cleaned up eventually.

### Proactive Maintenance

1. Use `npm test` (vitest) for the real test suite
2. Legacy scripts can be removed when convenient
3. New tests should always be `.test.ts` files using vitest

---

## L008: Project Has Three Testing Layers -- Know Them All

**Severity:** Info
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-17
**Status:** PERMANENT - Architectural awareness

### Problem

New sessions may only discover one testing layer and miss the others, leading to duplicated work or incomplete testing.

### The Three Layers

| Layer | What | Files | Who Uses It |
|-------|------|-------|-------------|
| **1. Automated Unit Tests** | Vitest suite (79+ tests) for schemas and scoring | `tests/schemas.test.ts`, `tests/scoring.test.ts`, `vitest.config.ts` | Developers, CI |
| **2. Stakeholder QA Docs** | Step-by-step manual testing guides and deploy plan | `docs/TESTING_FOR_STAKEHOLDERS.md`, `docs/TESTING_AND_DEPLOY_PLAN.md` | Dan, stakeholders |
| **3. Browser Testing UI** | Temp UI at `/testing` for match-by-brief with thumbs up/down feedback | `public/testing.html`, `POST /api/v1/feedback` | Dan, testers, anyone with browser access |

### How They Fit Together

1. **Unit tests (Layer 1)** catch regressions in schemas and scoring logic before code ships
2. **Stakeholder docs (Layer 2)** tell Dan how to run the server, what endpoints to test, curl examples
3. **Testing UI (Layer 3)** lets anyone paste a brief, see ranked results, and give per-result feedback that flows to a Google Sheet (when `FEEDBACK_SHEET_ID` is configured)

### Proactive Maintenance

1. When adding new scoring logic, add unit tests AND verify results make sense in the testing UI
2. When changing API endpoints, update `TESTING_FOR_STAKEHOLDERS.md` if curl examples change
3. When modifying match response format, update `public/testing.html` to display new fields
4. The `.cursor/rules/tdd-agent.mdc` rule documents all three layers for AI assistants

### Cross-Project Applicability

The three-layer pattern (automated tests + stakeholder QA docs + browser test UI) is a good model for any API project with non-technical stakeholders.

---

## L009: PDF Generation -- Use jsPDF, Not Puppeteer/md-to-pdf

**Severity:** Medium
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-17
**Status:** PERMANENT - Verified fastest method

### Problem

Generating PDFs from markdown or HTML is needed for status reports and deliverables. Tools like `md-to-pdf` and `puppeteer` require downloading a full Chromium binary (~300MB), take minutes to install, and often hang on Windows.

### Symptoms

- `npx md-to-pdf` hangs for 2+ minutes downloading puppeteer/chromium
- `puppeteer` install fails or takes excessively long
- Browser `window.print()` via MCP tools is blocked by security restrictions
- `file://` URLs cannot be opened in browser automation tools

### Root Cause

`md-to-pdf`, `puppeteer`, and similar tools need a headless browser. On Windows/PowerShell this is slow to install and unreliable. The browser MCP tools block `file://` URLs and `window.print()`.

### Solution

Use **jsPDF** (pure JavaScript, no browser needed). Generates PDFs in under 2 seconds.

```bash
# Install (one-time, as devDependency)
npm install --save-dev jspdf

# Generate PDF
node scripts/generate-status-pdf.mjs
# Output: docs/STATUS_REPORT_2026-02-17.pdf (60 KB, <2 seconds)
```

Pattern from leo-participation-translator: `app/src/lib/generate-pdf.ts` uses the same approach.

### Proactive Maintenance

1. NEVER use `md-to-pdf` or `puppeteer` for PDF generation on this workstation
2. Use `jsPDF` with `.mjs` extension (ESM) for `import { jsPDF } from 'jspdf'`
3. Write PDF buffer with `Buffer.from(doc.output('arraybuffer'))` then `writeFileSync`
4. Keep the generate script in `scripts/` for reuse

### Cross-Project Applicability

Applies to ALL projects on this Windows workstation. jsPDF is the fastest and most reliable PDF generation method.

---

## Adding New Entries

When you discover and fix a recurring problem:

1. Add a new section following the template above
2. Assign the next sequential ID (L008, L009, etc.)
3. Update the Table of Contents
4. Reference the specific files and line numbers (approximate is fine)
5. Include the proactive maintenance steps
6. Note cross-project applicability if relevant

Template:

```markdown
## LXXX: Title

**Severity:** Critical/High/Medium/Low
**First Observed:** YYYY-MM-DD
**Last Confirmed:** YYYY-MM-DD
**Status:** FIXED/OPEN/MONITORING/PERMANENT

### Problem
### Symptoms
### Root Cause
### Solution
### Proactive Maintenance
### Cross-Project Applicability
```

---

Author: Charley Scholz, JLAI
Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
Last Updated: 2026-02-17
