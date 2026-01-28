> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# AI Golden Master - Manifest

**Version:** v1.0.0-clean  
**Build Date:** January 6, 2026  
**Status:** 📋 Template Ready  
**Architecture:** Gemini 2.5 Flash + Google APIs

**Author:** Charley Scholz (Johannes Leonardo IT)  
**Co-author:** Claude (Anthropic AI Assistant), Cursor (IDE)

---

## 1. System Overview

A reusable template for building AI-powered applications using Google Cloud Platform services.

### Key Features

- ✅ Gemini 2.5 Flash integration (native PDF reading)
- ✅ Google Drive API integration
- ✅ Google Sheets API integration
- ✅ Express.js server with API patterns
- ✅ Web dashboard template
- ✅ Notification system (Slack, Email)
- ✅ Configuration templates

---

## 2. Google Cloud Resources

| Resource     | ID/Name             | Purpose             |
| :----------- | :------------------ | :------------------ |
| **Project**  | `[YOUR_PROJECT_ID]` | GCP Project         |
| **AI Model** | Gemini 2.5 Flash    | Document processing |
| **Region**   | `us-central1`       | Primary region      |

---

## 3. Application Components

### Source Files

| File                     | Purpose                |
| :----------------------- | :--------------------- |
| `src/index.js`           | Main Express server    |
| `src/config.template.js` | Configuration template |
| `public/dashboard.html`  | Web dashboard          |
| `public/analytics.html`  | Analytics page         |
| `Dockerfile`             | Container definition   |

### Dependencies

```json
{
  "@google-cloud/vertexai": "^1.10.0",
  "@google-cloud/storage": "^7.18.0",
  "@google-cloud/firestore": "^7.1.0",
  "googleapis": "^166.0.0",
  "express": "^4.x",
  "dotenv": "^16.3.1"
}
```

---

## 4. Configuration

### Environment Variables

| Variable                         | Required | Description                 |
| :------------------------------- | :------- | :-------------------------- |
| `GCP_PROJECT_ID`                 | Yes      | GCP project ID              |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes      | Path to service account key |
| `PORT`                           | No       | Server port (default: 8080) |

### Config Template

Copy `src/config.template.js` to `src/config.js` and customize.

---

## 5. Deployment

### Cloud Run

```bash
gcloud run deploy [SERVICE_NAME] \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 120
```

---

## 6. Documentation

| Doc                            | Purpose                    |
| :----------------------------- | :------------------------- |
| `docs/PLAN.md`                 | Architecture blueprint     |
| `docs/TODO.md`                 | Task tracking              |
| `docs/SETUP.md`                | Installation guide         |
| `docs/PROJECT_GUARDRAILS.md`   | Development guidelines     |
| `docs/CLAUDE_GUARDRAILS_v4.md` | AI collaboration protocols |

---

_Manifest Version: 1.0.1_  
_Updated: January 6, 2026_
