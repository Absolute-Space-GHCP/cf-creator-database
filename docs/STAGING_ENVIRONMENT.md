# Staging Environment

**Author:** Charley Scholz, JLAI  
**Co-authored:** Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)  
**Last Updated:** 2026-02-23

---

## Overview

The CatchFire Matching Engine staging environment provides a safe, isolated deployment for team testing before changes reach production. Staging uses the same Dockerfile and codebase as production but with different configuration.

## Staging URL Format

After deployment, the staging service URL follows this pattern:

```
https://cf-matching-staging-<hash>-ue.a.run.app
```

The exact URL is shown in the deploy output and in the Cloud Run console:

- **Project:** catchfire-app-2026  
- **Region:** us-east1  
- **Service:** cf-matching-staging  

## How to Deploy

### Manual Deploy (Local)

**npm script (cross-platform):**
```bash
npm run deploy:staging
```

**PowerShell (Windows):**
```powershell
.\scripts\deploy-staging.ps1
```

**Bash (Linux/macOS or Git Bash):**
```bash
./scripts/deploy-staging.sh
```

**Prerequisites:**
- `gcloud` CLI installed and authenticated (`gcloud auth login`, `gcloud auth application-default login`)
- Access to project `catchfire-app-2026`

### CI/CD Deploy (GitHub Actions)

Push to the `staging` branch to trigger automatic deployment:

```bash
git push origin staging
```

The workflow `.github/workflows/deploy-staging.yml` will:
1. Checkout the code
2. Authenticate to GCP
3. Build from source (`gcloud run deploy --source .`)
4. Deploy to `cf-matching-staging` in us-east1

**Required GitHub Secrets:**
- `GCP_SA_KEY` — JSON key for a service account with Cloud Run deploy permissions

**Alternative: Workload Identity Federation (recommended for production CI):**
- `WIF_PROVIDER` — Full workload identity provider resource name
- `WIF_SERVICE_ACCOUNT` — Service account email

See [GCP Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation) for setup.

## Differences from Production

| Aspect | Staging | Production |
|--------|---------|------------|
| **Service name** | cf-matching-staging | cf-matching-engine |
| **Region** | us-east1 | us-central1 |
| **Firestore collection** | creators-staging | creators |
| **NODE_ENV** | staging | production |
| **URL** | `cf-matching-staging-*.run.app` | `cf-matching-engine-*.run.app` |
| **Deploy trigger** | Push to `staging` branch | `npm run deploy` or push to `main` |

Staging uses a separate Firestore collection (`creators-staging`) so test data does not affect production. You can import sample creators into `creators-staging` for testing without touching production data.

## Environment Variables

These are set automatically by the deploy scripts:

| Variable | Staging Value | Purpose |
|----------|---------------|---------|
| `NODE_ENV` | staging | Runtime mode |
| `GCP_PROJECT_ID` | catchfire-app-2026 | GCP project |
| `GOOGLE_CLOUD_PROJECT` | catchfire-app-2026 | GCP project (SDK compatibility) |
| `FIRESTORE_COLLECTION` | creators-staging | Firestore collection for creators |

Additional variables (e.g. `GEMINI_API_KEY`, `FEEDBACK_SHEET_ID`) can be set in the Cloud Run console for the `cf-matching-staging` service if needed for staging-specific testing.

## Resource Configuration

- **Memory:** 512Mi  
- **CPU:** 1  
- **Authentication:** Unauthenticated (for team testing)  
- **Dockerfile:** Same as production (multi-stage build with React frontend)

## Post-Deploy Verification

1. **Health check:** `https://<staging-url>/health`
2. **Testing UI:** `https://<staging-url>/testing`
3. **API match:** `POST https://<staging-url>/api/v1/match` with a sample brief

## Firestore Setup

Before meaningful testing, ensure the `creators-staging` collection exists and has data. You can:

- Copy a subset of production creators to `creators-staging` for testing
- Use the batch import API: `POST /api/v1/creators/batch`
- Import via the sync script (pointing at `creators-staging`)

---
