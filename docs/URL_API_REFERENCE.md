> **Version:** 0.1.0 | **Date:** 2026-01-28 | **Repo:** cf-influencer-matching-engine

# CatchFire Influencer Matching Engine - URL & API Reference

**Version:** v0.1.0  
**Status:** Development  
**Last Verified:** 2026-01-28

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
| **Organization**  | CatchFire / Johannes Leonardo |
| **Support Email** | support@johannesleonardo.com  |

---

## Production URLs

### Cloud Run Service

| URL                                                               | Description          | Project            |
| ----------------------------------------------------------------- | -------------------- | ------------------ |
| `https://catchfire-mvp-34240596768.us-central1.run.app`           | Main API endpoint    | catchfire-app-2026 |
| `https://catchfire-mvp-34240596768.us-central1.run.app/health`    | Health check         | catchfire-app-2026 |
| `https://catchfire-mvp-34240596768.us-central1.run.app/dashboard` | Monitoring dashboard | catchfire-app-2026 |

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

| Endpoint                 | Method | Description                        |
| ------------------------ | ------ | ---------------------------------- |
| `/health`                | GET    | Health check (returns JSON status) |
| `/dashboard`             | GET    | Admin monitoring dashboard         |
| `/api/v1/match`          | POST   | Match creators to a brief          |
| `/api/v1/creators`       | GET    | Search/filter creators             |
| `/api/v1/creators`       | POST   | Add single creator                 |
| `/api/v1/creators/batch` | POST   | Bulk import from scraper           |
| `/api/v1/creators/:id`   | GET    | Get creator details                |
| `/api/v1/categorize`     | POST   | LLM-categorize a bio               |

### Dashboard Endpoints

| Endpoint          | Method | Description               |
| ----------------- | ------ | ------------------------- |
| `/dashboard`      | GET    | Main monitoring dashboard |
| `/analytics.html` | GET    | Analytics dashboard       |

---

## External Services & APIs

### Google Cloud APIs Used

| Service            | SDK Package               | Purpose                              |
| ------------------ | ------------------------- | ------------------------------------ |
| Vertex AI / Gemini | `@google/genai` (target)  | Creator bio categorization, matching |
| Firestore          | `@google-cloud/firestore` | Creator database                     |
| Cloud Storage      | `@google-cloud/storage`   | Asset storage (future)               |

### AI Model Configuration

| Field        | Value              |
| ------------ | ------------------ |
| **Model**    | `gemini-2.5-flash` |
| **Fallback** | `gemini-2.5-pro`   |
| **Provider** | Google Vertex AI   |

### Firestore Collections

| Collection | Description                    |
| ---------- | ------------------------------ |
| `creators` | Main creator profiles          |
| `briefs`   | Client briefs (future)         |
| `matches`  | Match results history (future) |

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

### Deploy to Cloud Run

```bash
gcloud run deploy cf-matching-engine \
  --source . \
  --region us-central1 \
  --project catchfire-app-2026 \
  --allow-unauthenticated
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
┌─────────────────────────────────────────────────────────────┐
│ CatchFire Influencer Matching Engine                        │
├─────────────────────────────────────────────────────────────┤
│ GCP Account:    charleys@johannesleonardo.com               │
│ GCP Project:    catchfire-app-2026                          │
│ GitHub User:    cmscholz222                                 │
│ GitHub Org:     Absolute-Space-GHCP                         │
├─────────────────────────────────────────────────────────────┤
│ Production:     https://catchfire-mvp-34240596768...run.app │
│ Local Dev:      http://localhost:8090                       │
│ AI Model:       gemini-2.5-flash                            │
│ Database:       Firestore (creators collection)             │
└─────────────────────────────────────────────────────────────┘
```

---

Author: Charley Scholz, JLIT  
Co-authored: Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)  
Last Updated: 2026-01-28
