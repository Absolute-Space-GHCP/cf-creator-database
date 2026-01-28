> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# AI Golden Master - TODO & Handoff Document

**Last Updated:** January 28, 2026  
**Current Version:** v1.0.1  
**Status:** 📋 Template Ready

**Author:** Charley Scholz (Johannes Leonardo IT)  
**Co-author:** Claude (Anthropic AI Assistant), Cursor (IDE)

---

## Quick Context

This is the **AI Golden Master** template - a reusable framework for building AI-powered applications using Google Cloud Platform.

---

## Template Features

| Feature               | Status   | Description                              |
| --------------------- | -------- | ---------------------------------------- |
| **Gemini 2.5 Flash**  | ✅ Ready | Native PDF reading, AI model integration |
| **Google Drive API**  | ✅ Ready | File listing, downloading                |
| **Google Sheets API** | ✅ Ready | Read/write spreadsheet data              |
| **Express Server**    | ✅ Ready | API endpoints, static file serving       |
| **Web Dashboard**     | ✅ Ready | `public/dashboard.html` template         |
| **Notifications**     | ✅ Ready | Slack webhook, Gmail SMTP                |
| **Config Template**   | ✅ Ready | `src/config.template.js`                 |

---

## Getting Started

### 1. Clone Template

```bash
git clone https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build.git [YOUR_PROJECT]
cd [YOUR_PROJECT]
```

### 2. Configure

```bash
cp src/config.template.js src/config.js
# Edit config.js with your settings
```

### 3. Install & Run

```bash
npm install
npm start
```

### 4. Deploy

```bash
gcloud run deploy [SERVICE_NAME] --source . --region us-central1
```

---

## Customization Checklist

- [ ] Update `package.json` with project name
- [ ] Configure `src/config.js` with your settings
- [ ] Update `docs/PLAN.md` with your architecture
- [ ] Update `docs/PROJECT_REQUIREMENTS.md` with your requirements
- [ ] Customize `public/dashboard.html` branding
- [ ] Add your business logic to `src/`

---

## Documentation

| Doc                            | Purpose                    |
| ------------------------------ | -------------------------- |
| `docs/PLAN.md`                 | Architecture blueprint     |
| `docs/PROJECT_REQUIREMENTS.md` | Requirements and scope     |
| `docs/PROJECT_GUARDRAILS.md`   | Development guidelines     |
| `docs/SETUP.md`                | Installation guide         |
| `docs/CLAUDE_GUARDRAILS_v4.md` | AI collaboration protocols |

---

## Quick Commands

```bash
# Local development
npm start

# Deploy to Cloud Run
gcloud run deploy [SERVICE_NAME] --source . --region us-central1 --platform managed --allow-unauthenticated --memory 512Mi --timeout 120

# Check logs
gcloud run services logs read [SERVICE_NAME] --region us-central1 --limit 30
```

---

_Template Version: 1.0.1_  
_Last Updated: January 6, 2026_
