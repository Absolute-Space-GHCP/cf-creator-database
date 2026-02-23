#!/bin/bash
# ============================================================================
# CatchFire Matching Engine - Deploy Cloud Scheduler Jobs
# ============================================================================
# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Cursor (IDE)
# Created: 2026-02-23
# Updated: 2026-02-23
# ============================================================================
# Purpose:     Deploys Cloud Scheduler jobs for automated creator scraping
#              to GCP project catchfire-app-2026
# Usage:       ./scripts/deploy-scheduler.sh [CLOUD_RUN_URL] [SERVICE_ACCOUNT_EMAIL]
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ID="catchfire-app-2026"
REGION="us-central1"
CLOUD_RUN_URL="${1:-https://cf-influencer-matching-engine-XXXXXXXXXX-uc.a.run.app}"
SERVICE_ACCOUNT_EMAIL="${2:-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEDULER_DIR="${SCRIPT_DIR}/scheduler"

VIMEO_OK=0
BEHANCE_OK=0
WEEKLY_OK=0

step() { echo -e "\n${CYAN}[$1] $2${NC}"; }
ok()   { echo -e "  ${GREEN}OK:${NC} $1"; }
fail() { echo -e "  ${RED}FAIL:${NC} $1"; }

echo ""
echo -e "${CYAN}=== CatchFire Scraper Scheduler Deployment ===${NC}"
echo ""
echo "  Project:          ${PROJECT_ID}"
echo "  Region:           ${REGION}"
echo "  Cloud Run URL:    ${CLOUD_RUN_URL}"
echo "  Service Account:  ${SERVICE_ACCOUNT_EMAIL}"
echo ""

# -------------------------------------------------------------------------
# 1. Check gcloud
# -------------------------------------------------------------------------
step "1/5" "Checking gcloud..."
if ! command -v gcloud &>/dev/null; then
    fail "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
ok "gcloud found"

if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
    fail "Not authenticated. Run: gcloud auth login"
    exit 1
fi
ok "Authenticated"

# -------------------------------------------------------------------------
# 2. Deploy daily-scrape-vimeo
# -------------------------------------------------------------------------
step "2/5" "Deploying daily-scrape-vimeo..."
if gcloud scheduler jobs create http daily-scrape-vimeo \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --schedule="0 2 * * *" \
    --time-zone="America/New_York" \
    --uri="${CLOUD_RUN_URL}/api/v1/scraper/trigger" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body='{"platforms":["vimeo"],"limit":100}' \
    --oidc-service-account-email="${SERVICE_ACCOUNT_EMAIL}" \
    --oidc-token-audience="${CLOUD_RUN_URL}" \
    --attempt-deadline="180s" \
    --max-retry-attempts=2 \
    --min-backoff="10s" \
    --max-backoff="60s" \
    --description="Daily Vimeo creator scrape at 2:00 AM EST" \
    2>/dev/null; then
    ok "daily-scrape-vimeo created"
    VIMEO_OK=1
else
    fail "Failed to create daily-scrape-vimeo (may already exist — use 'gcloud scheduler jobs update http' to modify)"
fi

# -------------------------------------------------------------------------
# 3. Deploy daily-scrape-behance
# -------------------------------------------------------------------------
step "3/5" "Deploying daily-scrape-behance..."
if gcloud scheduler jobs create http daily-scrape-behance \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --schedule="0 3 * * *" \
    --time-zone="America/New_York" \
    --uri="${CLOUD_RUN_URL}/api/v1/scraper/trigger" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body='{"platforms":["behance"],"limit":100}' \
    --oidc-service-account-email="${SERVICE_ACCOUNT_EMAIL}" \
    --oidc-token-audience="${CLOUD_RUN_URL}" \
    --attempt-deadline="180s" \
    --max-retry-attempts=2 \
    --min-backoff="10s" \
    --max-backoff="60s" \
    --description="Daily Behance creator scrape at 3:00 AM EST" \
    2>/dev/null; then
    ok "daily-scrape-behance created"
    BEHANCE_OK=1
else
    fail "Failed to create daily-scrape-behance (may already exist — use 'gcloud scheduler jobs update http' to modify)"
fi

# -------------------------------------------------------------------------
# 4. Deploy weekly-scrape-all
# -------------------------------------------------------------------------
step "4/5" "Deploying weekly-scrape-all..."
if gcloud scheduler jobs create http weekly-scrape-all \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --schedule="0 1 * * 0" \
    --time-zone="America/New_York" \
    --uri="${CLOUD_RUN_URL}/api/v1/scraper/trigger" \
    --http-method=POST \
    --headers="Content-Type=application/json" \
    --message-body='{"platforms":["vimeo","behance","artstation","dribbble","instagram","youtube","tiktok","linkedin"],"limit":500}' \
    --oidc-service-account-email="${SERVICE_ACCOUNT_EMAIL}" \
    --oidc-token-audience="${CLOUD_RUN_URL}" \
    --attempt-deadline="600s" \
    --max-retry-attempts=3 \
    --min-backoff="30s" \
    --max-backoff="120s" \
    --description="Weekly full-platform creator scrape, Sunday 1:00 AM EST" \
    2>/dev/null; then
    ok "weekly-scrape-all created"
    WEEKLY_OK=1
else
    fail "Failed to create weekly-scrape-all (may already exist — use 'gcloud scheduler jobs update http' to modify)"
fi

# -------------------------------------------------------------------------
# 5. Summary
# -------------------------------------------------------------------------
step "5/5" "Deployment Summary"
echo "  daily-scrape-vimeo:   $([[ $VIMEO_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo "  daily-scrape-behance: $([[ $BEHANCE_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo "  weekly-scrape-all:    $([[ $WEEKLY_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo ""

if [[ $VIMEO_OK -eq 1 && $BEHANCE_OK -eq 1 && $WEEKLY_OK -eq 1 ]]; then
    echo -e "${GREEN}All scheduler jobs deployed successfully.${NC}"
    echo ""
    echo "Verify with:  gcloud scheduler jobs list --project=${PROJECT_ID} --location=${REGION}"
    exit 0
else
    echo -e "${RED}Some deployments failed. Review errors above.${NC}"
    exit 1
fi
