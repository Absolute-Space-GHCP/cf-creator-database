> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# AI Project Initiation Template

**Version:** 1.0.0-clean  
**Created:** December 17, 2025  
**Updated:** January 6, 2026  
**Based on:** AI Golden Master Framework

**Author:** Charley Scholz (Johannes Leonardo IT)  
**Co-author:** Claude (Anthropic AI Assistant), Cursor (IDE)

---

## Overview

This template provides a step-by-step guide for creating new AI projects using the proven Golden Master framework. Each new project leverages the established architecture, security patterns, and CI/CD workflows.

### The 3-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 1: GOLDEN MASTER                     │
│         (Foundational Framework - Already Built ✅)          │
│  • 12-layer architecture  • Security patterns  • CI/CD      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 TIER 2: DEV BUILD ENVIRONMENT                │
│            (Clone, Configure, Customize - Per Project)       │
│  • Private GitHub repo  • Local dev setup  • Docs           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  TIER 3: PRODUCTION DEPLOYMENT               │
│              (Cloud Run + Slack + IAP Security)              │
│  • Domain-restricted  • Monitoring  • Feedback loop         │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Discovery & Scoping

**Duration:** 1-2 hours  
**Participants:** Project Owner, Stakeholder(s), Developer

### 0.1 Project Brief

Fill out before starting development:

| Field                | Value                          |
| -------------------- | ------------------------------ |
| **Project Name**     |                                |
| **Bot Name**         | `@[botname]`                   |
| **Project Owner**    |                                |
| **Target Users**     |                                |
| **Slack Channel**    | `#[channel-name]`              |
| **GitHub Repo Name** |                                |
| **GCP Project**      | `jlai-gm-v3` (existing) or new |

### 0.2 Scope Definition

| Question                                | Answer |
| --------------------------------------- | ------ |
| What questions will the bot answer?     |        |
| What documents/data sources are needed? |        |
| Who should have access?                 |        |
| Are there PII/security concerns?        |        |
| What's the success metric?              |        |

### 0.3 Document Inventory

List all documents to be indexed:

| #   | Document Name | Category | Location |
| --- | ------------- | -------- | -------- |
| 1   |               |          |          |
| 2   |               |          |          |
| 3   |               |          |          |

### 0.4 Approval

- [ ] Scope approved by stakeholder
- [ ] Documents identified and accessible
- [ ] Security review complete
- [ ] Ready to proceed

**Approved By:** ********\_******** **Date:** ********\_********

---

## Phase 1: Repository Setup

**Duration:** 15-30 minutes

### 1.1 Clone Golden Master Template

```bash
# Navigate to projects folder
cd /Users/charleymm/Projects

# Clone the Golden Master template
git clone https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build.git [PROJECT_NAME]

# Enter project directory
cd [PROJECT_NAME]
```

### 1.2 Create New GitHub Repository

1. Go to [github.com/JohannesLeonardo-AI-JLIT](https://github.com/JohannesLeonardo-AI-JLIT)
2. Click **New Repository**
3. Name: `[project-name]`
4. Visibility: **Private**
5. Do NOT initialize with README (we're pushing existing code)

### 1.3 Update Git Remote

```bash
# Remove old origin
git remote remove origin

# Add new origin
git remote add origin https://github.com/JohannesLeonardo-AI-JLIT/[PROJECT_NAME].git

# Verify
git remote -v
```

### 1.4 Clean Up Template Content

Remove/replace these files:

- [ ] Remove any unused HTML pages from `public/`
- [ ] Update `src/index.js` version string and project name
- [ ] Update health check endpoint with your project info
- [ ] Clear any template-specific documentation
- [ ] Update `README.md` with new project info

### 1.5 Initial Commit

```bash
git add -A
git commit -m "Initial commit: [PROJECT_NAME] based on Golden Master v1.0.0"
git push -u origin main
```

### Phase 1 Checklist

- [ ] Repository cloned locally
- [ ] New GitHub repo created
- [ ] Remote updated
- [ ] Template-specific content removed
- [ ] Initial commit pushed

---

## Phase 2: Local Development Setup

**Duration:** 30-60 minutes

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with project-specific values:

```env
# Google Cloud
GCP_PROJECT_ID=jlai-gm-v3

# Slack (get from api.slack.com after creating app)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...

# Feedback Sheet (create new Google Sheet)
FEEDBACK_SHEET_ID=...

# Server
PORT=8090
```

### 2.3 GCP Authentication

```bash
# Authenticate with Google Cloud
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/drive.readonly"

# Set quota project
gcloud auth application-default set-quota-project jlai-gm-v3
```

### 2.4 Create GCS Bucket for Documents

```bash
# Create bucket (if using new project)
gsutil mb -l us-central1 gs://[PROJECT_ID]-content

# Or use existing bucket with new folder
gsutil mkdir gs://jlai-gm-v3-content/[PROJECT_NAME]/
```

### 2.5 Upload Documents

Organize documents in folders:

```
gs://[bucket]/[PROJECT_NAME]/
├── 01_Category_A/
│   ├── Document1.pdf
│   └── Document2.pdf
├── 02_Category_B/
│   └── Document3.pdf
└── 03_Category_C/
    └── Document4.pdf
```

```bash
# Upload documents
gsutil -m cp -r /path/to/local/docs/* gs://[bucket]/[PROJECT_NAME]/
```

### 2.6 Configure Document Catalog

Update `src/index.js` - find `DOCUMENT_CATALOG` and customize:

```javascript
const DOCUMENT_CATALOG = {
  // Category keywords → document mappings
  keyword1: ["Document1.pdf"],
  keyword2: ["Document2.pdf", "Document3.pdf"],
  // Add all your keyword mappings
};
```

### 2.7 Update GCS Bucket Reference

In `src/index.js`, update:

```javascript
const BUCKET_NAME = "[PROJECT_ID]-content";
const CONTENT_PREFIX = "[PROJECT_NAME]/"; // If using subfolder
```

### 2.8 Local Test

```bash
# Start server
npm start

# Test health endpoint
curl http://localhost:8090/

# Test query (in another terminal)
curl "http://localhost:8090/test?q=Hello"
```

### Phase 2 Checklist

- [ ] Dependencies installed
- [ ] `.env` file configured
- [ ] GCP authentication complete
- [ ] GCS bucket/folder created
- [ ] Documents uploaded
- [ ] Document catalog configured
- [ ] Local server starts successfully
- [ ] Health check returns OK

---

## Phase 3: Slack App Configuration

**Duration:** 20-30 minutes

### 3.1 Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. App Name: `[Bot Name]`
4. Workspace: Johannes Leonardo

### 3.2 Configure Bot Token Scopes

**OAuth & Permissions** → **Scopes** → **Bot Token Scopes:**

- [ ] `chat:write`
- [ ] `app_mentions:read`
- [ ] `im:history`
- [ ] `im:read`

### 3.3 Configure Event Subscriptions

**Event Subscriptions** → Enable Events

**Request URL:** (Add after Cloud Run deployment)

**Subscribe to bot events:**

- [ ] `app_mention`
- [ ] `message.im`

⚠️ **DO NOT add `message.channels`** — causes duplicate responses!

### 3.4 Configure Interactivity

**Interactivity & Shortcuts** → Enable

**Request URL:** (Same as Event Subscriptions URL)

### 3.5 Install App to Workspace

**OAuth & Permissions** → **Install to Workspace**

Copy these values to your `.env`:

- **Bot User OAuth Token** → `SLACK_BOT_TOKEN`
- **Signing Secret** (Basic Information) → `SLACK_SIGNING_SECRET`

### 3.6 Create Slack Channel

1. Create channel: `#[project-channel-name]`
2. Invite the bot: `/invite @[botname]`

### Phase 3 Checklist

- [ ] Slack app created
- [ ] Bot token scopes configured
- [ ] Event subscriptions configured (app_mention, message.im ONLY)
- [ ] Interactivity enabled
- [ ] App installed to workspace
- [ ] Bot token and signing secret saved
- [ ] Slack channel created
- [ ] Bot invited to channel

---

## Phase 4: Cloud Deployment

**Duration:** 15-30 minutes

### 4.1 Deploy to Cloud Run

```bash
gcloud run deploy [SERVICE_NAME] \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 120 \
  --min-instances=1 \
  --project jlai-gm-v3
```

### 4.2 Set Environment Variables

```bash
gcloud run services update [SERVICE_NAME] \
  --region us-central1 \
  --set-env-vars "GCP_PROJECT_ID=jlai-gm-v3,SLACK_BOT_TOKEN=xoxb-...,SLACK_SIGNING_SECRET=..." \
  --project jlai-gm-v3
```

### 4.3 Get Cloud Run URL

```bash
gcloud run services describe [SERVICE_NAME] \
  --region us-central1 \
  --project jlai-gm-v3 \
  --format="value(status.url)"
```

### 4.4 Update Slack App URLs

Go back to [api.slack.com/apps](https://api.slack.com/apps):

1. **Event Subscriptions** → Request URL: `[CLOUD_RUN_URL]`
2. **Interactivity** → Request URL: `[CLOUD_RUN_URL]`
3. Verify both URLs show ✓

### 4.5 Test Slack Integration

In your Slack channel:

```
@[botname] Hello
```

Expected: Bot responds with greeting in thread.

### Phase 4 Checklist

- [ ] Cloud Run deployment successful
- [ ] Environment variables set
- [ ] Cloud Run URL obtained
- [ ] Slack Event Subscriptions URL updated and verified
- [ ] Slack Interactivity URL updated
- [ ] Bot responds to @mention in Slack
- [ ] Response appears in thread (not channel)

---

## Phase 5: Security & IAP (Optional)

**Duration:** 30-45 minutes  
**Cost:** ~$20/month for load balancer

Only needed if you want domain-restricted browser access to dashboards.

### 5.1 Enable Required APIs

```bash
gcloud services enable compute.googleapis.com --project=jlai-gm-v3
gcloud services enable iap.googleapis.com --project=jlai-gm-v3
```

### 5.2 Create Load Balancer Infrastructure

```bash
# Create serverless NEG
gcloud compute network-endpoint-groups create [SERVICE]-neg \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=[SERVICE_NAME] \
  --project=jlai-gm-v3

# Create backend service
gcloud compute backend-services create [SERVICE]-backend \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --global \
  --project=jlai-gm-v3

# Add NEG to backend
gcloud compute backend-services add-backend [SERVICE]-backend \
  --global \
  --network-endpoint-group=[SERVICE]-neg \
  --network-endpoint-group-region=us-central1 \
  --project=jlai-gm-v3

# Create URL map
gcloud compute url-maps create [SERVICE]-url-map \
  --default-service=[SERVICE]-backend \
  --global \
  --project=jlai-gm-v3

# Reserve static IP
gcloud compute addresses create [SERVICE]-ip \
  --ip-version=IPV4 \
  --global \
  --project=jlai-gm-v3

# Get IP address
IP=$(gcloud compute addresses describe [SERVICE]-ip --global --project=jlai-gm-v3 --format="value(address)")
echo "Static IP: $IP"

# Create SSL certificate (using nip.io)
gcloud compute ssl-certificates create [SERVICE]-cert \
  --domains="[SERVICE].$IP.nip.io" \
  --global \
  --project=jlai-gm-v3

# Create HTTPS proxy
gcloud compute target-https-proxies create [SERVICE]-https-proxy \
  --ssl-certificates=[SERVICE]-cert \
  --url-map=[SERVICE]-url-map \
  --global \
  --project=jlai-gm-v3

# Create forwarding rule
gcloud compute forwarding-rules create [SERVICE]-forwarding-rule \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --target-https-proxy=[SERVICE]-https-proxy \
  --ports=443 \
  --address=[SERVICE]-ip \
  --global \
  --project=jlai-gm-v3
```

### 5.3 Enable IAP

```bash
# Enable IAP on backend
gcloud iap web enable \
  --resource-type=backend-services \
  --service=[SERVICE]-backend \
  --project=jlai-gm-v3

# Create IAP service account
gcloud beta services identity create --service=iap.googleapis.com --project=jlai-gm-v3

# Grant IAP service account invoker access
gcloud run services add-iam-policy-binding [SERVICE_NAME] \
  --region=us-central1 \
  --member="serviceAccount:service-[PROJECT_NUMBER]@gcp-sa-iap.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --project=jlai-gm-v3

# Grant domain access through IAP
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service=[SERVICE]-backend \
  --member="domain:johannesleonardo.com" \
  --role="roles/iap.httpsResourceAccessor" \
  --project=jlai-gm-v3
```

### 5.4 Keep Slack Access Open

⚠️ **IMPORTANT:** Slack webhooks need direct access. Ensure `allUsers` has invoker access:

```bash
gcloud run services add-iam-policy-binding [SERVICE_NAME] \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=jlai-gm-v3
```

### Phase 5 Checklist

- [ ] APIs enabled
- [ ] Load balancer infrastructure created
- [ ] SSL certificate provisioned (wait 15-60 min)
- [ ] IAP enabled
- [ ] Domain access granted
- [ ] Slack access preserved (allUsers)
- [ ] IAP URL tested with Google SSO

---

## Phase 6: Documentation & Handoff

**Duration:** 30-60 minutes

### 6.1 Update Project Documentation

| File               | Updates Needed                  |
| ------------------ | ------------------------------- |
| `README.md`        | Project name, description, URLs |
| `docs/PLAN.md`     | Project-specific plan           |
| `docs/TODO.md`     | Current tasks, handoff notes    |
| `docs/MANIFEST.md` | Document inventory, components  |
| `docs/SETUP.md`    | Project-specific setup steps    |

### 6.2 Pre-Launch Testing

Complete the 17-point checklist:

#### Core Bot Functionality

- [ ] Basic greeting: `@[bot] Hello`
- [ ] Topic query: `@[bot] [relevant question]`
- [ ] Thread follow-up (no @mention needed)

#### Security

- [ ] PII block test
- [ ] Unknown topic fallback

#### Interactive Features

- [ ] Feedback buttons work
- [ ] Document links work

#### Web Dashboards

- [ ] `/dashboard` loads
- [ ] `/documents` loads (if applicable)

### 6.3 Stakeholder Demo

- [ ] Demo scheduled
- [ ] Demo completed
- [ ] Feedback incorporated
- [ ] **Approval received**

### 6.4 Go Live

- [ ] Invite users to Slack channel
- [ ] Send announcement/instructions
- [ ] Monitor for first 24-48 hours

### Phase 6 Checklist

- [ ] Documentation updated
- [ ] Pre-launch testing complete
- [ ] Stakeholder demo done
- [ ] Approval received
- [ ] Users invited
- [ ] Monitoring active

---

## Quick Reference

### Key Commands

```bash
# Local development
npm start
curl http://localhost:8090/

# Deploy
gcloud run deploy [SERVICE] --source . --region us-central1 --platform managed --allow-unauthenticated --memory 512Mi --timeout 120 --min-instances=1

# Check logs
gcloud run services logs read [SERVICE] --region=us-central1 --limit=50

# Update env vars
gcloud run services update [SERVICE] --region=us-central1 --set-env-vars "KEY=value"
```

### Key URLs

| Resource    | URL Pattern                                          |
| ----------- | ---------------------------------------------------- |
| Cloud Run   | `https://[SERVICE]-[HASH].us-central1.run.app`       |
| IAP-Secured | `https://[SERVICE].[IP].nip.io`                      |
| GitHub      | `https://github.com/JohannesLeonardo-AI-JLIT/[REPO]` |
| Slack App   | `https://api.slack.com/apps`                         |

### Support Contacts

| Role      | Contact               |
| --------- | --------------------- |
| Developer | Charley Scholz        |
| Platform  | JL IT Team            |
| Slack     | #hr-it or Slack admin |

---

## Appendix: Troubleshooting

### Slack Not Responding

1. Check Cloud Run logs for errors
2. Verify Event Subscriptions URL is correct and verified
3. Ensure `allUsers` has invoker access (for Slack webhooks)
4. Check that ONLY `app_mention` and `message.im` are subscribed (no `message.channels`)

### Duplicate Responses

- Remove `message.channels` from Slack Event Subscriptions
- Verify deduplication is working in code

### IAP "Access Denied"

- Ensure domain binding is set: `domain:johannesleonardo.com`
- Check IAP service account has invoker access
- SSL certificate must be ACTIVE (not PROVISIONING)

### Documents Not Found

- Verify GCS bucket and prefix in code
- Check document names match exactly (case-sensitive)
- Ensure documents are in correct folders

---

_Template Version: 1.0.1_  
_Based on AI Golden Master Framework | January 2026_
