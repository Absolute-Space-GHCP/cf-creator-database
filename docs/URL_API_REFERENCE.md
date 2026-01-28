> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# AI Golden Master - URL & API Reference

**Version:** v1.0.0-clean  
**Status:** Framework Template

---

> **IMPORTANT:** This document is a template for documenting your project's URLs and APIs.  
> Customize with your actual service URLs after deployment.

---

## Production URLs

### Cloud Run Service

| URL                                                       | Description                |
| --------------------------------------------------------- | -------------------------- |
| `https://YOUR_SERVICE-PROJECT_NUMBER.us-central1.run.app` | Main Slack bot endpoint    |
| `https://YOUR_SERVICE.../dashboard`                       | Admin monitoring dashboard |
| `https://YOUR_SERVICE.../documents`                       | Document Library           |
| `https://YOUR_SERVICE.../directory`                       | Entity Directory           |

### GitHub Repository

| URL                                                              | Description                  |
| ---------------------------------------------------------------- | ---------------------------- |
| `https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build` | Golden Master Framework repo |

---

## Google Cloud Console

### GCP Project

| URL                                                                    | Description           |
| ---------------------------------------------------------------------- | --------------------- |
| `https://console.cloud.google.com/home/dashboard?project=YOUR_PROJECT` | Main GCP dashboard    |
| `https://console.cloud.google.com/run?project=YOUR_PROJECT`            | Cloud Run services    |
| `https://console.cloud.google.com/storage?project=YOUR_PROJECT`        | Cloud Storage buckets |
| `https://console.cloud.google.com/firestore?project=YOUR_PROJECT`      | Firestore database    |

### Cloud Storage (GCS)

| URL                           | Description             |
| ----------------------------- | ----------------------- |
| `gs://YOUR_BUCKET/`           | Documents bucket        |
| `gs://YOUR_BUCKET/01_Folder/` | Example document folder |

---

## Integrations

### Slack

| URL                                                        | Description                    |
| ---------------------------------------------------------- | ------------------------------ |
| `https://api.slack.com/apps`                               | Slack App management dashboard |
| `https://app.slack.com/client/YOUR_WORKSPACE/YOUR_CHANNEL` | Deep link to your bot channel  |

### Google Sheets (Optional)

| URL                                                    | Description               |
| ------------------------------------------------------ | ------------------------- |
| `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID` | Feedback collection sheet |

---

## APIs & Endpoints

### External APIs (Used by Framework)

#### Slack API

| Endpoint                                 | Method | Description                       |
| ---------------------------------------- | ------ | --------------------------------- |
| `https://slack.com/api/chat.postMessage` | POST   | Send messages to channels/threads |
| `https://slack.com/api/chat.update`      | POST   | Update existing messages          |

#### Google Cloud APIs

| Service           | SDK                       | Description                    |
| ----------------- | ------------------------- | ------------------------------ |
| **Vertex AI**     | `@google-cloud/vertexai`  | Gemini 2.5 Flash for RAG       |
| **Firestore**     | `@google-cloud/firestore` | Entity directory database      |
| **Cloud Storage** | `@google-cloud/storage`   | Document PDFs                  |
| **Sheets API**    | `googleapis`              | Feedback, pre-canned responses |

---

### Internal API Endpoints

#### Core Endpoints

| Endpoint | Method | Description                        |
| -------- | ------ | ---------------------------------- |
| `/`      | POST   | Main Slack event handler           |
| `/`      | GET    | Health check (returns JSON status) |

#### Dashboards

| Endpoint     | Method | Description                |
| ------------ | ------ | -------------------------- |
| `/dashboard` | GET    | Admin monitoring dashboard |
| `/documents` | GET    | Document Library           |
| `/directory` | GET    | Entity Directory           |

#### Data APIs

| Endpoint                   | Method | Description                        |
| -------------------------- | ------ | ---------------------------------- |
| `/api/search-employees?q=` | GET    | Search entities by name/title/dept |

#### Test/Debug Endpoints

| Endpoint   | Method | Description           |
| ---------- | ------ | --------------------- |
| `/test?q=` | GET    | Test document queries |

---

## Quick Copy Reference

### For Slack App Configuration

```
Event Subscriptions URL:
https://YOUR_SERVICE_URL/

Interactivity URL:
https://YOUR_SERVICE_URL/
```

### For Git Remote

```bash
git remote add origin https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build.git
```

### For Local Testing

```bash
# Health check
curl https://YOUR_SERVICE_URL/

# Test document query
curl "https://YOUR_SERVICE_URL/test?q=What%20is%20the%20policy?"

# Test entity search
curl "https://YOUR_SERVICE_URL/api/search-employees?q=John"
```

---

_Customize this document with your actual URLs after deployment._
