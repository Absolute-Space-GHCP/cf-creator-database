> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# AI Golden Master - Template Setup Guide

**Version:** 1.0.0-clean  
**Last Updated:** January 6, 2026

---

## Quick Start

This template provides a production-ready AI application framework with:

- Gemini 2.5 Flash integration (native PDF reading)
- Google Drive/Sheets API integration
- Express.js API server
- Web UI templates
- Notification system (Slack, Email)

---

## Setup Options

### Option A: Use config.template.js (Recommended)

1. Copy `src/config.template.js` → `src/config.js`
2. Fill in your configuration
3. Update `src/index.js` to import from config

### Option B: Direct Editing

Edit configuration values directly in your source files.

---

## Configuration Sections

### 1. GCP Settings (Required)

```javascript
const CONFIG = {
  projectId: "your-gcp-project", // Your GCP project ID
  location: "us-central1", // Cloud Run region
  // ... other settings
};
```

### 2. API Keys & Secrets

Set via environment variables:

```bash
export GCP_PROJECT_ID=your-project
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## Environment Variables

| Variable                         | Required | Description                 |
| -------------------------------- | -------- | --------------------------- |
| `GCP_PROJECT_ID`                 | Yes      | Your GCP project            |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes      | Path to service account key |
| `PORT`                           | No       | Server port (default: 8080) |
| `SLACK_WEBHOOK_URL`              | No       | Slack notifications         |
| `GMAIL_USER`                     | No       | Email notifications         |
| `GMAIL_APP_PASSWORD`             | No       | Gmail app password          |

---

## Deployment

### Local Development

```bash
npm install
npm start
# Server runs at http://localhost:8080
```

### Cloud Run

```bash
gcloud run deploy your-service-name \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 120
```

---

## Files to Customize

| File            | What to Change                 |
| --------------- | ------------------------------ |
| `src/index.js`  | API endpoints, business logic  |
| `src/config.js` | Project-specific configuration |
| `public/*.html` | Branding, UI customization     |
| `docs/PLAN.md`  | Architecture for your project  |

---

## Branding Customization

### Dashboard Branding

Edit `public/*.html` files:

- Update titles and headers
- Change colors (CSS variables)
- Update footer text

---

## Support

For issues or questions:

- Check `docs/PLAN.md` for architecture details
- Review `docs/PROJECT_GUARDRAILS.md` for conventions
- See `CHANGELOG.md` for version history

---

_Template Version: 1.0.1_
_Based on AI Golden Master Framework_
