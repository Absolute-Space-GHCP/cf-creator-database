# LEARN.md - Known Fixes and Lessons Learned

**Purpose:** This document captures recurring problems and their verified solutions. AI coding assistants MUST consult this file at session start and proactively apply these fixes when working in relevant areas. Developers should reference this before debugging issues that may already be solved.

**How to use:** Each entry has a Problem, Root Cause, Solution, and file references. When touching the listed files, verify the fix is still in place. When encountering the listed symptoms, apply the known solution before investigating further.

> **Cross-Project Lessons:** For issues that apply across ALL projects (PowerShell syntax, Cloud Run deploys, mojibake, npx limitations, etc.), see the global file: `C:\Users\cmsch\Projects\tools\LEARN-GLOBAL.md`. This file contains only project-specific entries.

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
| [L009](#l009-pdf-generation--use-puppeteer-via-md-to-pdfjs) | PDF Generation -- Use Puppeteer via md-to-pdf.js | Medium | `scripts/md-to-pdf.js` |
| [L010](#l010-garbled-emojispecial-characters-in-html-files) | Garbled Emoji/Special Characters in HTML Files | High | `public/index.html`, any HTML with emoji |
| [L011](#l011-claude-mem-chroma-server-fails-on-windows-npx-cannot-resolve-python-cli) | Claude-Mem Chroma Server Fails on Windows | High | `~/.claude/plugins/.../worker-service.cjs` |
| [L012](#l012-powershell-invoke-webrequest-hangs-on-localhost) | PowerShell Invoke-WebRequest Hangs on Localhost | Medium | All localhost HTTP testing |
| [L013](#l013-npx-cannot-resolve-non-npm-executables-on-windows-npm-v9) | npx Cannot Resolve Non-npm Executables (npm v9+) | High | Any `npx` calls to Python/system tools |
| [L014](#l014-typescript-erasablesyntaxonly-blocks-parameter-properties) | TypeScript erasableSyntaxOnly Blocks Parameter Properties | Medium | `web/src/**/*.ts`, `tsconfig.app.json` |
| [L015](#l015-web-dependencies-missing-after-clone-webnodemodules) | Web Dependencies Missing After Clone | Medium | `web/package.json`, `web/node_modules/` |
| [L016](#l016-integration-tests-require-running-local-server) | Integration Tests Require Running Local Server | Medium | `tests/integration/`, status reports |

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

- Garbled multi-byte sequences (e.g. `\xc3\xb0\xc5\xb8...`) instead of emoji like 🔧 in file reads
- Garbled characters instead of ✅ in console output
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

## L009: PDF Generation -- Use Puppeteer via md-to-pdf.js

**Severity:** Medium
**First Observed:** 2026-02-17
**Last Confirmed:** 2026-02-19
**Status:** PERMANENT - Verified method for all projects

### Problem

Generating PDFs from markdown is needed for status reports and deliverables. Multiple approaches were tried before landing on a reliable, repeatable process.

### Failed Approaches (Do NOT Retry)

| Method | Problem |
|--------|---------|
| `npx md-to-pdf` (npm package) | Hangs indefinitely (60s+ with no output), unreliable |
| `pandoc` | Not installed, requires separate binary |
| Browser `window.print()` via MCP | Blocked by security restrictions |
| `file://` URLs in browser automation | Blocked by browser tools |
| `jsPDF` (pure JS) | Works but limited: no markdown parsing, manual layout, poor table rendering |

### Solution

Use the project's **`scripts/md-to-pdf.js`** script. It uses Puppeteer (already installed as a dependency) to render styled HTML and export to PDF in ~5 seconds.

```bash
# Generate PDF from any markdown file
node scripts/md-to-pdf.js docs/STATUS_REPORT_2026-02-19.md

# Output: docs/STATUS_REPORT_2026-02-19.pdf (same directory, same name)

# Or specify a custom output path
node scripts/md-to-pdf.js docs/ANY_FILE.md docs/custom-output.pdf
```

### How It Works

1. Reads the `.md` file
2. Converts markdown to HTML (headings, tables, lists, bold, code)
3. Wraps in a styled HTML template (Inter font, dark table headers, gold h2 accents)
4. Launches headless Puppeteer, renders the HTML, exports as Letter-size PDF
5. ~5 seconds, ~340 KB output

### Proactive Maintenance

1. When asked to create a PDF, use `node scripts/md-to-pdf.js <input.md>` — do NOT try other methods
2. The script lives at `scripts/md-to-pdf.js` and should be copied to new projects that need PDF generation
3. Requires `puppeteer` as a dependency (`npm install --save-dev puppeteer`)
4. If the script doesn't exist in a project, copy it from `cf-influencer-matching-engine/scripts/md-to-pdf.js`

### Cross-Project Applicability

Applies to ALL projects. This is the standard PDF generation method. See also: global Cursor rule `pdf-generation.mdc`.

---

## L010: Garbled Emoji/Special Characters in HTML Files

**Severity:** High
**First Observed:** 2026-01-28
**Last Confirmed:** 2026-02-19
**Status:** PERMANENT - Recurs when files pass through encoding boundaries

### Problem

Emoji characters in HTML files (card icons, section headers, footers) render as garbled mojibake in the browser. This is distinct from L004 (TypeScript source files) because the garbled text is **user-visible** on the live web UI.

### Symptoms

- Garbled sequences like `\xc3\xb0\xc5\xb8...` instead of 🔍 in the browser
- Multi-byte garbage instead of 🔗, 📊, ⭐, ⚡
- `\xc3\xa2\xe2\x82\xac...` instead of — (em-dash)
- `\xc3\x82\xc2\xb7` instead of · (middot)
- The `StrReplace` tool **cannot match** these garbled byte sequences

### Root Cause

UTF-8 emoji are multi-byte sequences (3-4 bytes each). When an HTML file passes through an encoding boundary (e.g., a tool reads UTF-8 bytes but writes them as Latin-1/Windows-1252, or vice versa), each byte gets individually re-encoded, producing 6-12 byte mojibake sequences. This is **double-encoding** or **triple-encoding** depending on how many times it happens. Common triggers:

- File created/edited on a different OS or editor
- Copy-paste from a tool that re-encodes
- `StrReplace` tool writing back garbled matches

### Solution

**Best: Use the `ftfy` Python library** for bulk fixing. It automatically detects and reverses double/triple encoding across entire files. This is the fastest and most reliable approach.

```bash
# Install ftfy (one-time)
pip3 install ftfy
```

```python
import ftfy, pathlib, os

# Fix a single file
p = pathlib.Path('public/index.html')
text = p.read_text('utf-8')
fixed = ftfy.fix_text(text)
if fixed != text:
    p.write_text(fixed, encoding='utf-8')
    print('Fixed!')
```

```python
# Fix ALL files in the project at once
extensions = ['.md', '.html', '.js', '.ts']
skip_dirs = {'node_modules', '.git', 'dist'}

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in skip_dirs]
    for f in files:
        if not any(f.endswith(ext) for ext in extensions):
            continue
        p = pathlib.Path(os.path.join(root, f))
        text = p.read_text('utf-8')
        fixed = ftfy.fix_text(text)
        if fixed != text:
            p.write_text(fixed, encoding='utf-8')
            print(f'Fixed: {p}')
```

**Alternative: Python byte-level replacement** for surgical fixes when `ftfy` is not available:

```python
import pathlib
p = pathlib.Path('public/index.html')
data = p.read_bytes()
# Build replacement table by diagnosing garbled byte sequences first
replacements = [
    (b'\xc3\xb0\xc5\xb8...', 'EMOJI'.encode('utf-8')),
    (b'\xc3\xa2\xe2\x82\xac...', 'DASH'.encode('utf-8')),
]
for old, new in replacements:
    data = data.replace(old, new)
p.write_bytes(data)
```

### Proactive Maintenance

1. **First choice:** Use `ftfy` to fix all files at once — `pip3 install ftfy` then run the bulk script above
2. **Fallback:** Use Python byte-level replacement (not `StrReplace`) for surgical fixes
3. After fixing, verify by reading files back and checking byte sequences
4. Prefer HTML entities or CSS/SVG icons over raw emoji in HTML to prevent recurrence
5. If files will be edited by multiple tools/platforms, consider replacing emoji with text labels or icon fonts
6. See also L004 for the TypeScript source file variant of this problem

---

## L011: Claude-Mem Chroma Server Fails on Windows (npx Cannot Resolve Python CLI)

**Severity:** High
**First Observed:** 2026-02-23
**Last Confirmed:** 2026-02-23
**Status:** FIXED - Patched worker-service.cjs on 2026-02-23

### Problem

The claude-mem persistent memory plugin's Chroma vector database server fails to start on Windows, causing a 60-second timeout and disabling vector search entirely. The worker reports "ready" after the timeout but without semantic search capability.

### Symptoms

- Claude-mem logs: `[CHROMA_SERVER] Server process exited {code=1, signal=null}`
- 60-second delay on every worker startup before it becomes available
- `/api/readiness` returns 503 during the 60s wait, then 200 but with degraded (no vector search) capability
- `npx chroma run` fails with: `npm error could not determine executable to run`

### Root Cause

Two compounding issues:

1. **`chromadb` Python package was not installed.** The Chroma CLI (`chroma run`) is a Python executable, not an npm package. It must be installed via `pip install chromadb`.

2. **`npx` (npm v9+) cannot resolve Python CLIs.** Claude-mem's `worker-service.cjs` spawns `npx.cmd chroma run` on Windows. But `npx` in npm v9+ only resolves npm packages, NOT system PATH executables. Even with `chromadb` installed and `chroma.exe` on PATH, `npx chroma` still fails.

### Solution

**Step 1:** Install the Python `chromadb` package:
```powershell
pip install chromadb
```

**Step 2:** Add Python Scripts to User PATH (for direct `chroma` access):
```powershell
$scriptsPath = "$env:LOCALAPPDATA\Packages\PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0\LocalCache\local-packages\Python312\Scripts"
[Environment]::SetEnvironmentVariable("PATH", "$([Environment]::GetEnvironmentVariable('PATH', 'User'));$scriptsPath", "User")
```

**Step 3:** Patch `worker-service.cjs` to bypass `npx` and call `chroma.exe` directly:

In `~/.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs`, find:
```
r?"npx.cmd":"npx",i=["chroma","run",
```
Replace with:
```
r?"C:\\Users\\cmsch\\AppData\\Local\\Packages\\PythonSoftwareFoundation.Python.3.12_qbz5n2kfra8p0\\LocalCache\\local-packages\\Python312\\Scripts\\chroma.exe":"chroma",i=["run",
```

**Step 4:** Create a backup before patching:
```powershell
Copy-Item worker-service.cjs worker-service.cjs.bak
```

**Result:** Chroma startup goes from 60s timeout + failure to ~1 second + full success.

### Proactive Maintenance

1. After any claude-mem marketplace update, the patch will be **overwritten**. Re-apply the patch from `worker-service.cjs.bak` diff.
2. Verify with: `curl.exe -s http://127.0.0.1:37777/api/readiness` — should return `{"status":"ready","mcpReady":true}`
3. Do NOT use PowerShell `Invoke-WebRequest` to test localhost — it hangs (see L012)
4. A `.cmd` shim in npm global bin does NOT work — `npx` doesn't resolve it

### Cross-Project Applicability

**Applies to ALL projects** using claude-mem on this Windows workstation. The fix is in the global plugin directory, not per-project.

---

## L012: PowerShell Invoke-WebRequest Hangs on Localhost

**Severity:** Medium
**First Observed:** 2026-02-23
**Last Confirmed:** 2026-02-23
**Status:** PERMANENT - Windows .NET HTTP stack limitation

### Problem

PowerShell's `Invoke-WebRequest` (and `Invoke-RestMethod`) hangs indefinitely when making requests to `http://127.0.0.1` or `http://localhost`, even when the target service is confirmed running and responding.

### Symptoms

- `Invoke-WebRequest -Uri "http://127.0.0.1:37777/api/readiness"` never returns
- The command must be killed with `Ctrl+C` or `Stop-Process`
- The same URL works instantly with `curl.exe`
- `netstat` confirms the target port is listening

### Root Cause

PowerShell's `Invoke-WebRequest` uses the .NET `HttpClient` / `WebRequest` stack, which respects system proxy settings and can behave unexpectedly with loopback addresses. Common triggers include:

- System proxy configuration (corporate/VPN proxy) intercepting localhost
- .NET's connection pooling holding stale TCP connections after a previous timeout
- IPv6 vs IPv4 loopback resolution issues (`::1` vs `127.0.0.1`)

### Solution

**Use `curl.exe` instead of `Invoke-WebRequest` for localhost testing:**

```powershell
# CORRECT: Use curl.exe (Windows ships with it)
curl.exe -s --connect-timeout 5 "http://127.0.0.1:37777/api/readiness"

# WRONG: PowerShell cmdlet (may hang)
Invoke-WebRequest -Uri "http://127.0.0.1:37777/api/readiness"

# ALTERNATIVE: Use .NET directly with proxy bypass
$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.UseProxy = $false
$client = [System.Net.Http.HttpClient]::new($handler)
$client.GetStringAsync("http://127.0.0.1:37777/api/readiness").Result
```

### Proactive Maintenance

1. ALWAYS use `curl.exe` (not `curl` alias) for localhost HTTP requests in PowerShell
2. If you must use `Invoke-WebRequest`, add `-NoProxy` parameter (PowerShell 7+)
3. This applies to any local service: claude-mem, Express dev server, Vite, etc.
4. Note: `curl` in PowerShell is an alias for `Invoke-WebRequest` — use `curl.exe` explicitly

### Cross-Project Applicability

**Applies to ALL projects** on this Windows workstation. Any time you need to test a local HTTP service from PowerShell, use `curl.exe`.

---

## L013: npx Cannot Resolve Non-npm Executables on Windows (npm v9+)

**Severity:** High
**First Observed:** 2026-02-23
**Last Confirmed:** 2026-02-23
**Status:** PERMANENT - npm v9+ behavioral change

### Problem

`npx <command>` fails with "could not determine executable to run" for executables that are on PATH but are not npm packages (e.g., Python CLIs, system tools).

### Symptoms

- `npx chroma run` → `npm error could not determine executable to run`
- The command works fine when called directly: `chroma run` (if on PATH)
- Creating a `.cmd` shim in npm global bin (`%APPDATA%\npm\`) does NOT fix it
- The error occurs even when the executable is on system PATH

### Root Cause

In npm v7+ (and especially v9+), `npx` was reimplemented as `npm exec`. The new implementation:
1. Checks local `node_modules/.bin/` first
2. Checks for a matching npm package (in registry or cache)
3. Does **NOT** check system PATH for arbitrary executables

This is a deliberate behavioral change from older `npx` (npm v6 and below), which DID check PATH.

### Solution

When a third-party tool uses `npx` to call a non-npm executable:

1. **Patch the caller** to invoke the executable directly instead of through `npx` (preferred)
2. **Create a wrapper npm package** with a `bin` entry pointing to the real executable (complex, fragile)
3. **Install the tool's npm equivalent** if one exists (not always available)

For the specific case of `chroma`:
```powershell
# This does NOT work (npm v9+):
npx chroma run --path ./data

# This WORKS:
chroma run --path ./data

# Or with full path:
& "C:\path\to\chroma.exe" run --path ./data
```

### Proactive Maintenance

1. When you see "could not determine executable to run", check if the target is an npm package
2. If it's a Python/system tool, call it directly — don't use `npx`
3. This affects ANY tool that uses `npx` to invoke non-npm executables
4. See L011 for the specific claude-mem/Chroma instance of this problem

### Cross-Project Applicability

**Applies to ALL projects** on any system running npm v9+. Particularly affects AI tooling plugins that shell out to Python-based services.

---

## L014: TypeScript erasableSyntaxOnly Blocks Parameter Properties

**Severity:** Medium
**First Observed:** 2026-02-23
**Last Confirmed:** 2026-02-23
**Status:** PERMANENT - TypeScript configuration constraint

### Problem

TypeScript classes with parameter properties in constructors (`public`, `private`, `protected` in constructor params) fail to compile with error `TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled`.

### Symptoms

- `error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled`
- Occurs on constructor parameter properties like `constructor(public name: string)`
- Build fails even though the code is valid TypeScript

### Root Cause

The `tsconfig.app.json` (or equivalent) has `"erasableSyntaxOnly": true` (or inherits it). This TypeScript 5.8+ option restricts syntax to only "erasable" constructs — annotations that can be removed without changing runtime behavior. Parameter properties generate JavaScript code (they assign `this.name = name`), so they're not purely erasable.

### Solution

Use explicit property declarations instead of parameter properties:

```typescript
// WRONG (fails with erasableSyntaxOnly):
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,      // parameter property
    public isNetwork: boolean,  // parameter property
  ) {
    super(message);
  }
}

// CORRECT:
class ApiError extends Error {
  status: number;
  isNetwork: boolean;

  constructor(message: string, status: number, isNetwork = false) {
    super(message);
    this.status = status;
    this.isNetwork = isNetwork;
  }
}
```

### Proactive Maintenance

1. Check `tsconfig.app.json` for `erasableSyntaxOnly` before using parameter properties
2. Also avoid `enum` declarations (they're also non-erasable) — use `const` objects instead
3. This setting is common in modern Vite + React projects (Vite's default template enables it)
4. When scaffolding new classes, always use explicit property declarations to be safe

### Cross-Project Applicability

Applies to any project with `erasableSyntaxOnly: true` in tsconfig. Particularly common in **Vite-based React/TypeScript projects** where the default template enables this setting.

---

## L015: Web Dependencies Missing After Clone (web/node_modules)

**Severity:** Medium
**First Observed:** 2026-02-23
**Last Confirmed:** 2026-02-23
**Status:** PERMANENT - Expected behavior

### Problem

The React SPA in `web/` has its own `package.json` and `node_modules/` separate from the root project. After a fresh clone or workspace switch, `npm run web:build` fails because `web/node_modules/` is empty or missing.

### Symptoms

- `npm run web:build` fails with hundreds of `TS7026: JSX element implicitly has type 'any'` errors
- `Cannot find module '@vitejs/plugin-react'`
- `web/node_modules/` is empty or only contains `.tmp/`

### Root Cause

The project has a dual dependency structure:
- Root `package.json` — Express server, vitest, build tools
- `web/package.json` — React, Vite, TypeScript (separate workspace)

Running `npm install` at the root does NOT install web dependencies.

### Solution

```powershell
# Install both dependency sets
npm install             # root deps
cd web; npm install     # web/React deps
cd ..

# Or use the combined build command (which cd's into web/)
npm run web:build
```

### Proactive Maintenance

1. After fresh clone, always run `npm install` in BOTH root and `web/` directories
2. If `web:build` fails with JSX/module errors, check `web/node_modules/` first
3. See also L002 for the root-level variant of this issue

---

## Adding New Entries

When you discover and fix a recurring problem:

1. Add a new section following the template above
2. Assign the next sequential ID (L011, L012, etc.)
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

## L016: Integration Tests Require Running Local Server

**Severity:** Medium
**First Observed:** 2026-02-23
**Last Confirmed:** 2026-02-23
**Status:** PERMANENT - By design, these are live integration tests

### Problem

The 13 integration tests in the vitest suite consistently fail with `ECONNREFUSED` on port 8090 when no local Express server is running. The 02-19 status report listed them as "all passing" but they only pass during active dev sessions when the server is started manually.

### Symptoms

- `TypeError: fetch failed` / `ECONNREFUSED 127.0.0.1:8090` on all 13 integration tests
- Tests pass locally when `npm start` (or equivalent) is running in another terminal
- Status reports may incorrectly list them as "all passing" if tested during dev sessions

### Root Cause

Integration tests make real HTTP requests to `http://localhost:8090`. They are true integration tests, not mocked. When the server is not running (e.g., CI environment, cold session start), they all fail.

### Solution

1. **For local testing:** Start the server first: `npm start` in a separate terminal, then run `npm test`
2. **For CI:** These tests should either be excluded from CI or CI should start the server before running them
3. **For status reports:** Report integration tests separately with a note: "requires running server"

### Proactive Maintenance

1. When reporting test counts, always distinguish unit tests (always pass) from integration tests (require server)
2. Do not report integration tests as "all passing" unless they were verified with a running server in that session
3. Consider adding a vitest config that auto-starts the server for integration tests, or use a `beforeAll` that spawns the process
4. See also L008 for the three-layer testing architecture

### Cross-Project Applicability

Applies to any project with live integration tests that depend on a running server. Always document which tests are standalone vs. which require infrastructure.

---

Author: Charley Scholz, JLAI
Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
Last Updated: 2026-02-23
