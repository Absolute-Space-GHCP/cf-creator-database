> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# PROJECT_GUARDRAILS.md

# AI Golden Master Framework

# Version: 1.0.0-clean | Status: Framework Ready

## 1. Project Mission & Scope

- **Primary Goal:** Reusable Slack bot framework for document Q&A
- **Core Engine:** **Google Gemini 2.5 Flash** (via Vertex AI)
- **RAG Approach:** Direct PDF access from GCS (no Discovery Engine)
- **Deployment Target:** Google Cloud Run (Serverless)

## 2. Core Principles

- **Simplicity First:** Use the simplest approach that works reliably
- **Layered Building:** Build on successes, don't debug persistent failures
- **CI/CD Ready:** All code structured for automated deployment
- **Engineer-Grade Quality:** Error handling, logging, modularity

## 3. The "Gemini 2.5 Flash" Standard

- **Model:** `gemini-2.5-flash` (stable in Vertex AI)
- **Capability:** Native multimodal PDF reading
- **Location:** `us-central1` (recommended)

## 4. Repository Architecture

```
/
├── src/
│   ├── index.js              # Main application
│   └── config.template.js    # Configuration template
├── public/
│   ├── dashboard.html        # Monitoring dashboard
│   ├── documents.html        # Document Library
│   └── directory.html        # Entity Directory
├── docs/
│   ├── SETUP.md              # Setup instructions
│   ├── PROJECT_GUARDRAILS.md # This file
│   ├── CLAUDE_GUARDRAILS_v4.md # AI assistant protocols
│   └── TEMPLATE_*.md         # Various templates
├── tests/                    # Test scripts
├── Dockerfile                # Container definition
└── .gcloudignore            # Deployment exclusions
```

## 5. Security & Secrets

- **NO SECRETS IN CODE:** Load via `process.env` or Cloud Run env vars
- **Fail-Fast:** Log warnings if optional secrets are missing
- **Required Secrets:**
  - `SLACK_BOT_TOKEN`
  - `SLACK_SIGNING_SECRET`
- **Optional Secrets:**
  - `FEEDBACK_SHEET_ID`
  - `GCP_PROJECT_ID`
  - `GCS_BUCKET`

## 6. Versioning & Change Control

- **Semantic Versioning:** MAJOR.MINOR.PATCH
- **Current:** v0.1.0 (Golden Master Framework)

### 6.1 Git Workflow

```bash
git fetch origin
git status
# If behind: git pull origin main
```

### 6.2 Session Start Protocol (REQUIRED)

Upon starting a new session:

1. **🗂️ Parse Guardrails:** Read guardrails files
2. **📋 Parse TODO.md:** Review for pending tasks
3. **🔄 Git Sync:** Ensure working from latest code
4. **☁️ GCP Auth Check:** Verify authentication:
   ```bash
   gcloud auth list
   ```

   - If no active account, run `gcloud auth login`

### 6.3 Pre-Commit Code Review (MANDATORY)

Before any Git commit:

1. **Review all changed files** - Ensure edits didn't unintentionally delete code
2. **Verify complete functions** - No truncated or partial functions
3. **Check for lost imports** - All required imports still present
4. **Update CHANGELOG.md** - Every commit should have a changelog entry

### 6.4 Planning Protocol (Avoid Regression)

Before implementing ANY change:

1. **Plan the change** - Outline what will be modified and why
2. **Identify dependencies** - What other code relies on this?
3. **Consider side effects** - Will this break existing functionality?
4. **Be critical** - If it can be improved, improve it before outputting

## 7. Deployment & Rollback

### 7.1 Deployment Command

```bash
gcloud run deploy YOUR_SERVICE_NAME \
  --source . \
  --region us-central1 \
  --project YOUR_PROJECT_ID \
  --allow-unauthenticated
```

### 7.2 Post-Deployment Cache Warm-Up (CRITICAL)

`min-instances=1` keeps the OLD revision warm, NOT the new one!

After EVERY deployment, run cache warm-up:

```bash
# 1. Hit service to trigger container startup
curl -s "https://YOUR_SERVICE_URL/"

# 2. Send test query to warm caches
curl -s "https://YOUR_SERVICE_URL/test?q=hello"

# 3. Verify cache is warm in logs
gcloud run services logs read YOUR_SERVICE_NAME --region us-central1 --limit 15
```

### 7.3 Rollback

Previous revisions are available in Cloud Run console. Use:

```bash
gcloud run services update-traffic YOUR_SERVICE_NAME \
  --to-revisions=REVISION_NAME=100 \
  --region us-central1
```

## 8. Deprecated Approaches (Do Not Use)

- ❌ Discovery Engine / Agent Builder (indexing failures)
- ❌ Vertex AI Search apps (same underlying issue)
- ❌ `gemini-1.5-flash` (retired)
- ❌ `gemini-3-flash` (not available in Vertex AI yet)

## 9. Approved Stack

| Component        | Technology                            |
| :--------------- | :------------------------------------ |
| Runtime          | Node.js 20+                           |
| AI Model         | Gemini 2.5 Flash (via Vertex AI)      |
| Document Storage | Google Cloud Storage                  |
| Entity Data      | Firestore                             |
| Feedback         | Google Sheets                         |
| Integration      | Slack (webhooks)                      |
| Deployment       | Cloud Run                             |
| Auth             | Application Default Credentials (ADC) |
