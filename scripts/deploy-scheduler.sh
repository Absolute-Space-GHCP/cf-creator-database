#!/bin/bash
# ============================================================================
# CatchFire Matching Engine - Deploy Cloud Scheduler Jobs
# ============================================================================
# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Cursor (IDE)
# Created: 2026-02-23
# Updated: 2026-03-30
# ============================================================================
# Purpose:     Deploys Cloud Scheduler jobs for automated creator scraping
#              to GCP project catchfire-app-2026
# Usage:       ./scripts/deploy-scheduler.sh [CLOUD_RUN_URL] [SERVICE_ACCOUNT_EMAIL]
#
# Source keys must match SCRAPER_REGISTRY in scraper/scrapers/__init__.py:
#   camerimage, annecy, ars_electronica, sxsw_title, ciclope, ukmva,
#   promax, sitges, fantastic_fest, the_rookies, shotdeck,
#   directors_notes, motionographer, stash_media
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ID="catchfire-app-2026"
REGION="us-central1"
CLOUD_RUN_URL="${1:-https://cf-matching-engine-34240596768.us-central1.run.app}"
SERVICE_ACCOUNT_EMAIL="${2:-scheduler-invoker@${PROJECT_ID}.iam.gserviceaccount.com}"

FESTIVALS_OK=0
EDITORIAL_OK=0
WEEKLY_OK=0

step() { echo -e "\n${CYAN}[$1] $2${NC}"; }
ok()   { echo -e "  ${GREEN}OK:${NC} $1"; }
fail() { echo -e "  ${RED}FAIL:${NC} $1"; }
warn() { echo -e "  ${YELLOW}WARN:${NC} $1"; }

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

# Helper: create-or-update a scheduler job
deploy_job() {
    local JOB_NAME="$1"
    local SCHEDULE="$2"
    local BODY="$3"
    local DEADLINE="$4"
    local RETRIES="$5"
    local DESCRIPTION="$6"

    if gcloud scheduler jobs describe "${JOB_NAME}" \
        --project="${PROJECT_ID}" --location="${REGION}" &>/dev/null; then
        warn "${JOB_NAME} already exists — deleting and recreating"
        gcloud scheduler jobs delete "${JOB_NAME}" \
            --project="${PROJECT_ID}" --location="${REGION}" --quiet 2>/dev/null
    fi

    gcloud scheduler jobs create http "${JOB_NAME}" \
            --project="${PROJECT_ID}" \
            --location="${REGION}" \
            --schedule="${SCHEDULE}" \
            --time-zone="America/New_York" \
            --uri="${CLOUD_RUN_URL}/api/v1/scraper/trigger" \
            --http-method=POST \
            --headers="Content-Type=application/json" \
            --message-body="${BODY}" \
            --oidc-service-account-email="${SERVICE_ACCOUNT_EMAIL}" \
            --oidc-token-audience="${CLOUD_RUN_URL}" \
            --attempt-deadline="${DEADLINE}" \
            --max-retry-attempts="${RETRIES}" \
            --min-backoff="10s" \
            --max-backoff="60s" \
            --description="${DESCRIPTION}" \
            2>/dev/null
}

# -------------------------------------------------------------------------
# 2. Deploy daily-scrape-festivals
# -------------------------------------------------------------------------
step "2/5" "Deploying daily-scrape-festivals..."
if deploy_job "daily-scrape-festivals" \
    "0 2 * * *" \
    '{"platforms":["camerimage","annecy","ciclope","ukmva","promax"]}' \
    "300s" \
    "2" \
    "Daily festival scrape (5 sources) at 2:00 AM EST"; then
    ok "daily-scrape-festivals deployed"
    FESTIVALS_OK=1
else
    fail "Failed to deploy daily-scrape-festivals"
fi

# -------------------------------------------------------------------------
# 3. Deploy daily-scrape-editorial
# -------------------------------------------------------------------------
step "3/5" "Deploying daily-scrape-editorial..."
if deploy_job "daily-scrape-editorial" \
    "0 3 * * *" \
    '{"platforms":["motionographer","directors_notes","stash_media"]}' \
    "300s" \
    "2" \
    "Daily editorial scrape (3 sources) at 3:00 AM EST"; then
    ok "daily-scrape-editorial deployed"
    EDITORIAL_OK=1
else
    fail "Failed to deploy daily-scrape-editorial"
fi

# -------------------------------------------------------------------------
# 4. Deploy weekly-scrape-all
# -------------------------------------------------------------------------
step "4/5" "Deploying weekly-scrape-all..."
if deploy_job "weekly-scrape-all" \
    "0 1 * * 0" \
    '{"platforms":["camerimage","annecy","ars_electronica","sxsw_title","ciclope","ukmva","promax","sitges","fantastic_fest","the_rookies","shotdeck","directors_notes","motionographer","stash_media"]}' \
    "600s" \
    "3" \
    "Weekly full scrape (all 14 sources) Sunday 1:00 AM EST"; then
    ok "weekly-scrape-all deployed"
    WEEKLY_OK=1
else
    fail "Failed to deploy weekly-scrape-all"
fi

# -------------------------------------------------------------------------
# 5. Summary
# -------------------------------------------------------------------------
step "5/5" "Deployment Summary"
echo "  daily-scrape-festivals:  $([[ $FESTIVALS_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo "  daily-scrape-editorial:  $([[ $EDITORIAL_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo "  weekly-scrape-all:       $([[ $WEEKLY_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo ""

if [[ $FESTIVALS_OK -eq 1 && $EDITORIAL_OK -eq 1 && $WEEKLY_OK -eq 1 ]]; then
    echo -e "${GREEN}All scheduler jobs deployed successfully.${NC}"
    echo ""
    echo "Verify with:  gcloud scheduler jobs list --project=${PROJECT_ID} --location=${REGION}"
    echo "Force run:    gcloud scheduler jobs run daily-scrape-festivals --project=${PROJECT_ID} --location=${REGION}"
    exit 0
else
    echo -e "${RED}Some deployments failed. Review errors above.${NC}"
    exit 1
fi
