> **Version:** 0.8.0 | **Date:** 2026-03-05 | **Repo:** cf-influencer-matching-engine

# CatchFire Influencer Matching Engine - URL & API Reference

**Version:** v0.8.0  
**Status:** Development  
**Last Verified:** 2026-03-05

---

## Account Reference (No Secrets)

### Google Cloud Platform

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Primary Account**   | `charleys@johannesleonardo.com` |
| **Default Project**   | `marketing-auto-digest`         |
| **CatchFire Project** | `catchfire-app-2026`            |
| **Backup Project**    | `cf-mvp-mockup`                 |
| **Region**            | `us-central1`                   |

### GitHub

| Field            | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| **Username**     | `cmscholz222`                                            |
| **Organization** | `Absolute-Space-GHCP`                                    |
| **Org URL**      | https://github.com/orgs/Absolute-Space-GHCP/repositories |

### App Identity

| Field             | Value                         |
| ----------------- | ----------------------------- |
| **App Name**      | CatchFire Matching Engine     |
| **Organization**  | CF - Influencer Matching Engine |
| **Support Email** |                                 |

---

## Production URLs

### Cloud Run Services

| URL | Description | Project |
| --- | ----------- | ------- |
| `https://cf-matching-engine-34240596768.us-central1.run.app` | Cloud Run service (direct, locked - 403 to public) | catchfire-app-2026 |
| `https://cf-matching-engine.34.54.144.178.nip.io` | Production URL (IAP-secured, Google SSO) | catchfire-app-2026 |
| `https://cf-matching-staging-34240596768.us-east1.run.app` | Staging service (locked - 403 to public) | catchfire-app-2026 |

### GitHub Repository

| URL                                                                          | Description     |
| ---------------------------------------------------------------------------- | --------------- |
| https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine         | Main repository |
| https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine/actions | CI/CD workflows |
| https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine/issues  | Issue tracker   |

---

## Google Cloud Console

### Primary Project: `catchfire-app-2026`

| URL                                                                        | Description           |
| -------------------------------------------------------------------------- | --------------------- |
| https://console.cloud.google.com/home/dashboard?project=catchfire-app-2026 | Project dashboard     |
| https://console.cloud.google.com/run?project=catchfire-app-2026            | Cloud Run services    |
| https://console.cloud.google.com/firestore?project=catchfire-app-2026      | Firestore database    |
| https://console.cloud.google.com/storage?project=catchfire-app-2026        | Cloud Storage buckets |
| https://console.cloud.google.com/apis/dashboard?project=catchfire-app-2026 | APIs & Services       |
| https://console.cloud.google.com/logs?project=catchfire-app-2026           | Cloud Logging         |

### Backup Project: `cf-mvp-mockup`

| URL                                                                   | Description        |
| --------------------------------------------------------------------- | ------------------ |
| https://console.cloud.google.com/home/dashboard?project=cf-mvp-mockup | Project dashboard  |
| https://console.cloud.google.com/run?project=cf-mvp-mockup            | Cloud Run services |

---

## API Endpoints

### Core API (v1)

| Endpoint                    | Method | Description                        |
| --------------------------- | ------ | ---------------------------------- |
| `/health`                   | GET    | Health check (returns JSON status) |
| `/dashboard`                | GET    | Admin monitoring dashboard         |
| `/testing`                  | GET    | Testing dashboard                  |
| `/api/v1/creators`          | GET    | Search/filter creators             |
| `/api/v1/creators`          | POST   | Add single creator                 |
| `/api/v1/creators/:id`      | GET    | Get creator details                |
| `/api/v1/creators/:id`      | PATCH  | Update creator details             |
| `/api/v1/creators/batch`    | POST   | Bulk import from scraper           |
| `/api/v1/import/apify`      | POST   | Import from Apify scraper results  |
| `/api/v1/match`             | POST   | Match creators to a brief          |
| `/api/v1/feedback`          | POST   | Submit match feedback              |
| `/api/v1/categorize`        | POST   | LLM-categorize a bio               |
| `/api/v1/style-signature`   | POST   | Generate creator style signature   |

### AI & Embeddings

| Endpoint                         | Method | Description                        |
| -------------------------------- | ------ | ---------------------------------- |
| `/api/v1/llm/test`               | GET    | Test LLM connectivity              |
| `/api/v1/embeddings/test`        | GET    | Test embeddings connectivity       |
| `/api/v1/embeddings/generate/:id`| POST   | Generate embeddings for a creator  |
| `/api/v1/embeddings/batch`       | POST   | Batch generate embeddings          |
| `/api/v1/search/semantic`        | POST   | Semantic search across creators    |
| `/api/v1/similar/:id`            | GET    | Find similar creators              |

### Lookalikes

| Endpoint                        | Method | Description                       |
| ------------------------------- | ------ | --------------------------------- |
| `/api/v1/lookalikes`            | GET    | List lookalike results            |
| `/api/v1/lookalikes/model`      | GET    | Get lookalike model info          |
| `/api/v1/lookalikes/score/:id`  | GET    | Get lookalike score for a creator |
| `/api/v1/lookalikes/refresh`    | POST   | Refresh lookalike model           |

### Scraper

| Endpoint                   | Method | Description                |
| -------------------------- | ------ | -------------------------- |
| `/api/v1/scraper/trigger`  | POST   | Trigger a scraper run      |
| `/api/v1/stats`            | GET    | Get system/scraper stats   |

### Web

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/app/*` | GET    | React SPA   |

---

## External Services & APIs

### Google Cloud APIs Used

| Service            | SDK Package               | Purpose                              |
| ------------------ | ------------------------- | ------------------------------------ |
| Vertex AI / Gemini | `@google/genai`           | Creator bio categorization, matching |
| Firestore          | `@google-cloud/firestore` | Creator database                     |
| Cloud Storage      | `@google-cloud/storage`   | Asset storage (future)               |

### AI Model Configuration

| Field        | Value              |
| ------------ | ------------------ |
| **Model**    | `gemini-2.5-flash` |
| **Fallback** | `gemini-2.5-pro`   |
| **Provider** | Google Vertex AI   |

### Firestore Collections

| Collection        | Description                                      |
| ----------------- | ------------------------------------------------ |
| `creators`        | Main creator profiles (37 records, 11 Golden Records) |
| `creators-staging`| Staging environment data                         |
| `scraper_runs`    | Scraper execution logs                           |

---

## Cloud Monitoring

| Check/Alert              | Configuration                          |
| ------------------------ | -------------------------------------- |
| Uptime check             | `/health` endpoint                     |
| Error rate alert         | >5 5xx responses in 5 min             |
| Latency alert            | p99 > 10s                              |
| Notification channel     | CatchFire Engineering (email)          |

---

## Cloud Scheduler

| Job Name              | Schedule                   |
| --------------------- | -------------------------- |
| `daily-scrape-vimeo`  | 2:00 AM EST daily          |
| `daily-scrape-behance`| 3:00 AM EST daily          |
| `weekly-scrape-all`   | Sunday 1:00 AM EST         |

---

## Local Development

### Server Configuration

| Field        | Value                   |
| ------------ | ----------------------- |
| **Port**     | 8090                    |
| **Base URL** | `http://localhost:8090` |

### Quick Test Commands

```bash
# Health check
curl http://localhost:8090/health

# Test match endpoint (example)
curl -X POST http://localhost:8090/api/v1/match \
  -H "Content-Type: application/json" \
  -d '{"brief": "Looking for a cinematographer with anamorphic experience"}'

# Search creators
curl "http://localhost:8090/api/v1/creators?craft=cinematographer"
```

---

## GCP Project Selection Guide

| Project                 | Use Case        | Notes                             |
| ----------------------- | --------------- | --------------------------------- |
| `catchfire-app-2026`    | **Production**  | Has existing Cloud Run deployment |
| `cf-mvp-mockup`         | Staging/Testing | Secondary environment             |
| `marketing-auto-digest` | Default ADC     | Not for CatchFire                 |

### Switch GCP Project

```bash
# Set project for this session
gcloud config set project catchfire-app-2026

# Or use per-command
gcloud run deploy --project=catchfire-app-2026 ...
```

---

## Git Configuration

### Clone Repository

```bash
git clone https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine.git
```

### Remote Origin

```bash
git remote add origin https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine.git
```

---

## Deployment Commands

### Deploy to Cloud Run (Production)

```bash
gcloud run deploy cf-matching-engine \
  --source . \
  --region us-central1 \
  --project catchfire-app-2026 \
  --no-allow-unauthenticated
```

### Deploy to Cloud Run (Staging)

```bash
gcloud run deploy cf-matching-staging \
  --source . \
  --region us-east1 \
  --project catchfire-app-2026 \
  --no-allow-unauthenticated
```

### View Logs

```bash
gcloud run services logs read cf-matching-engine \
  --project catchfire-app-2026 \
  --region us-central1
```

---

## Quick Reference Card

```
+-------------------------------------------------------------+
| CatchFire Influencer Matching Engine                        |
+-------------------------------------------------------------+
| GCP Account:    charleys@johannesleonardo.com               |
| GCP Project:    catchfire-app-2026                          |
| GitHub User:    cmscholz222                                 |
| GitHub Org:     Absolute-Space-GHCP                         |
+-------------------------------------------------------------+
| Production (IAP): https://cf-matching-engine.34.54.144.178.nip.io |
| Staging:     https://cf-matching-staging-34240596768.us-east1.run.app |
| Local Dev:   http://localhost:8090                          |
| AI Model:    gemini-2.5-flash                               |
| Database:    Firestore (creators collection, 37 records)    |
+-------------------------------------------------------------+
```

---

Author: Charley Scholz, JLAI  
Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)  
Last Updated: 2026-03-05
