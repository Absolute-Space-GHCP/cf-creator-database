> **Version:** 1.0.0-clean | **Date:** 2026-01-28 | **Repo:** ai-agents-gmaster-build

# AI Golden Master - Setup Guide

**Version:** v1.0.0-clean  
**Status:** Framework Ready for Customization

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SLACK BOT (Cloud Run)                           │
├─────────────────────────────────────────────────────────────────────┤
│  Query Router                                                       │
│  ├── Documents     → Gemini 2.5 Flash + GCS Direct PDF Access      │
│  ├── Entity Dir    → Firestore                                      │
│  └── Feedback      → Google Sheets                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Note:** Gemini 2.5 Flash is the recommended model for Vertex AI RAG applications.

---

## 2. Configuration Values

| Variable           | Description                        | Example            |
| :----------------- | :--------------------------------- | :----------------- |
| **GCP_PROJECT_ID** | Your Google Cloud Project          | `your-project-id`  |
| **GCS_BUCKET**     | Cloud Storage bucket for documents | `your-bucket-name` |
| **GEMINI_MODEL**   | AI Model                           | `gemini-2.5-flash` |
| **GCP_REGION**     | Cloud Run & Vertex AI region       | `us-central1`      |

---

## 3. Environment Variables

Required in Cloud Run (or `.env` for local dev):

| Variable               | Description                        | Required |
| :--------------------- | :--------------------------------- | :------- |
| `GCP_PROJECT_ID`       | GCP Project ID                     | Yes      |
| `SLACK_BOT_TOKEN`      | Slack Bot OAuth Token (`xoxb-...`) | Yes      |
| `SLACK_SIGNING_SECRET` | Slack App Signing Secret           | Yes      |
| `GCS_BUCKET`           | GCS bucket with documents          | Yes      |
| `FEEDBACK_SHEET_ID`    | Google Sheet for feedback          | No       |
| `PORT`                 | Server port (Cloud Run sets this)  | No       |
| `APP_NAME`             | Your bot's name                    | No       |
| `ORG_NAME`             | Your organization name             | No       |
| `SUPPORT_EMAIL`        | Support contact email              | No       |
| `BASE_URL`             | Your deployed service URL          | No       |

---

## 4. Local Development Setup

### Prerequisites

- Node.js 20+
- Google Cloud CLI (`gcloud`)
- A GCP project with Vertex AI, Cloud Storage, and Firestore enabled

### Steps

```bash
# 1. Clone and install
git clone https://github.com/Absolute-Space-GHCP/ai-agents-gmaster-build.git
cd ai-agents-gmaster-build
npm install

# 2. Authenticate with GCP (ADC)
gcloud auth application-default login
gcloud auth application-default set-quota-project YOUR_PROJECT_ID

# 3. Create .env file with required variables
cp .env.example .env  # Then edit with your values

# 4. Run locally
npm start
# Server runs at http://localhost:8090
```

---

## 5. Deployment (Cloud Run)

### Deploy Command

```bash
gcloud run deploy YOUR_SERVICE_NAME \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 120 \
  --min-instances=1
```

### Update Environment Variables

```bash
gcloud run services update YOUR_SERVICE_NAME \
  --region us-central1 \
  --set-env-vars "GCP_PROJECT_ID=your-project,SLACK_BOT_TOKEN=xoxb-...,SLACK_SIGNING_SECRET=..."
```

---

## 6. Identity-Aware Proxy (IAP) Security (Optional)

You can protect your dashboards with Google Cloud IAP to restrict access to your organization's domain.

### IAP Architecture

```
User → HTTPS Load Balancer → IAP (Google SSO) → Cloud Run
```

### Setup Steps

1. Create a static IP address
2. Create a Google-managed SSL certificate
3. Create a Serverless Network Endpoint Group (NEG) for Cloud Run
4. Create a backend service with IAP enabled
5. Configure IAM bindings for your domain

### Cost

~$20/month for the HTTPS Load Balancer (forwarding rule).

---

## 7. Slack App Configuration

### Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app from scratch

### Event Subscriptions

- **Request URL:** `https://YOUR_SERVICE_URL/`
- **Events:** `app_mention`, `message.im`

### Interactivity & Shortcuts

- **Request URL:** `https://YOUR_SERVICE_URL/`
- (Required for feedback buttons)

### OAuth & Permissions

- `chat:write`
- `app_mentions:read`
- `im:history`
- `im:read`

---

## 8. Document Management

### Uploading Documents

1. Upload PDFs to your GCS bucket organized in folders
2. Update `ALL_PDFS` array in `src/index.js` with your document paths
3. Update `PROCESS_MAPPINGS` with keyword → document mappings
4. Redeploy to Cloud Run

### Example GCS Structure

```
your-bucket/
  01_Benefits/
    - Company Benefits Guide.pdf
  02_Policies/
    - PTO Policy.pdf
    - Remote Work Policy.pdf
  03_Onboarding/
    - New Employee Handbook.pdf
```

---

## 9. Testing

```bash
# Test locally
curl "http://localhost:8090/"

# Test health endpoint
curl "http://localhost:8090/dashboard"

# Test document search (if implemented)
curl "http://localhost:8090/test?q=What%20is%20the%20PTO%20policy?"
```

---

## 10. Troubleshooting

### Check Cloud Run Logs

```bash
gcloud run services logs read YOUR_SERVICE_NAME --region us-central1 --limit 50
```

### Common Issues

| Issue                    | Solution                                           |
| :----------------------- | :------------------------------------------------- |
| Slack verification fails | Check URL has no trailing spaces                   |
| Buttons don't work       | Enable Interactivity in Slack app                  |
| No response from bot     | Check Cloud Run logs for errors                    |
| Auth errors              | Re-run `gcloud auth application-default login`     |
| Document not found       | Verify path in `ALL_PDFS` matches GCS path exactly |
