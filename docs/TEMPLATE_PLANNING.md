> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# AI Golden Master - Template Planning Guide

**Version:** 1.0.0-clean  
**Last Updated:** January 6, 2026  
**Purpose:** Guide for planning new AI projects using the Golden Master framework

---

## 1. Overview

The AI Golden Master is a reusable template for building AI-powered applications using Google Cloud Platform services. It provides:

- **Generic AI Infrastructure** (reusable for any project)
- **Gemini 2.5 Flash integration** for document processing
- **Google APIs** for Drive, Sheets, and other services
- **Express.js server** with API patterns
- **Web UI templates** for dashboards

---

## 2. Template Components

### 🟢 Core Infrastructure (Always Included)

| Component                  | File(s)                 | Notes                             |
| -------------------------- | ----------------------- | --------------------------------- |
| **Express Server**         | `src/index.js`          | HTTP server, health check, routes |
| **Gemini 2.5 Integration** | `src/*.js`              | AI model calls, PDF processing    |
| **Google APIs**            | `src/*.js`              | Drive, Sheets integration         |
| **Dashboard UI**           | `public/dashboard.html` | Status monitoring                 |
| **Dockerfile**             | `Dockerfile`            | Container definition              |
| **Cloud Run Deploy**       | `package.json`          | Deploy scripts                    |
| **Documentation**          | `docs/*.md`             | Guardrails, setup guides          |

### 🔧 Configurable Components

| Component     | Default         | Can Be Removed |
| ------------- | --------------- | -------------- |
| Web UI        | Basic dashboard | Yes            |
| Notifications | Slack + Email   | Yes            |
| Google Sheets | Data storage    | Yes            |
| Google Drive  | File access     | Yes            |

---

## 3. New Project Checklist

### Phase 1: Planning

- [ ] Define project scope and requirements
- [ ] Identify data sources (Drive folders, Sheets, etc.)
- [ ] Determine API endpoints needed
- [ ] Plan user interface requirements
- [ ] Review compliance/security needs

### Phase 2: Setup

- [ ] Clone Golden Master template
- [ ] Update `package.json` with project name
- [ ] Configure environment variables
- [ ] Set up Google Cloud credentials
- [ ] Test local development

### Phase 3: Development

- [ ] Implement core business logic
- [ ] Create/modify API endpoints
- [ ] Build user interface
- [ ] Add notifications if needed
- [ ] Write documentation

### Phase 4: Deployment

- [ ] Deploy to Cloud Run
- [ ] Configure domain/SSL if needed
- [ ] Set up monitoring
- [ ] User acceptance testing
- [ ] Go live

---

## 4. Environment Variables Template

```bash
# Required
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# Optional - Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
GMAIL_USER=notifications@domain.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# Optional - Features
PORT=8080
NODE_ENV=production
```

---

## 5. Project Structure

```
your-project/
├── src/
│   ├── index.js           # Main server
│   ├── [feature].js       # Feature modules
│   └── notifications.js   # Notification helpers
├── public/
│   ├── dashboard.html     # Main UI
│   └── [other].html       # Additional pages
├── docs/
│   ├── PLAN.md            # Architecture
│   ├── PROJECT_REQUIREMENTS.md
│   ├── SETUP.md
│   └── TODO.md
├── Dockerfile
├── package.json
└── README.md
```

---

## 6. Deployment Options

| Platform      | Pros                   | Cons           | Cost          |
| ------------- | ---------------------- | -------------- | ------------- |
| **Cloud Run** | Auto-scale, serverless | Cold starts    | Pay-per-use   |
| **GCE VM**    | Always on, predictable | Manual scaling | Fixed monthly |
| **GKE**       | Full control           | Complex        | Higher        |

**Recommended:** Cloud Run for most projects

---

## 7. Best Practices

### Code Organization

- Separate concerns into modules
- Use environment variables for config
- Keep business logic testable

### Security

- Never commit secrets
- Use service accounts with minimal permissions
- Validate all inputs

### Documentation

- Update PLAN.md with architecture decisions
- Keep TODO.md current
- Write SESSION.md summaries after major changes

---

_Template Version: 1.0.1_
_Last Updated: January 6, 2026_
