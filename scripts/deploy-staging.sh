#!/bin/bash
# ============================================================================
# CatchFire Matching Engine - Deploy to Cloud Run Staging
# ============================================================================
# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
# Created: 2026-02-23
# Updated: 2026-02-23
# ============================================================================
# Purpose:     Deploys to cf-matching-staging in us-east1
#              Uses creators-staging Firestore collection (separate from prod)
# Usage:       ./scripts/deploy-staging.sh
# CI/CD:       Suitable for GitHub Actions; use deploy-staging.yml workflow
# ============================================================================

set -e

PROJECT_ID="catchfire-app-2026"
SERVICE_NAME="cf-matching-staging"
REGION="us-east1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

step() { echo -e "\n${CYAN}[$1] $2${NC}"; }
ok()   { echo -e "  ${GREEN}OK:${NC} $1"; }
fail() { echo -e "  ${RED}FAIL:${NC} $1"; }

echo ""
echo -e "${CYAN}=== CatchFire Staging Deployment ===${NC}"
echo "  Service: $SERVICE_NAME"
echo "  Region:  $REGION"
echo "  Project: $PROJECT_ID"
echo ""

# -----------------------------------------------------------------------------
# 1. Check gcloud availability and auth
# -----------------------------------------------------------------------------
step "1/4" "Checking gcloud..."
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

# -----------------------------------------------------------------------------
# 2. Build (npm run build:all)
# -----------------------------------------------------------------------------
step "2/4" "Building (npm run build:all)..."
cd "$REPO_ROOT"
if ! npm run build:all; then
    fail "Build failed"
    exit 1
fi
ok "Build complete"

# -----------------------------------------------------------------------------
# 3. Deploy to Cloud Run
# -----------------------------------------------------------------------------
step "3/4" "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --memory 512Mi \
    --cpu 1 \
    --allow-unauthenticated \
    --set-env-vars "NODE_ENV=staging,GCP_PROJECT_ID=$PROJECT_ID,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,FIRESTORE_COLLECTION=creators-staging"

ok "Deploy complete"

# -----------------------------------------------------------------------------
# 4. Get service URL
# -----------------------------------------------------------------------------
step "4/4" "Retrieving service URL..."
URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format="value(status.url)" 2>/dev/null)
if [[ -n "$URL" ]]; then
    ok "Staging URL: $URL"
    echo ""
    echo "  Health:  $URL/health"
    echo "  Testing: $URL/testing"
else
    fail "Could not retrieve service URL"
fi

echo ""
echo -e "${GREEN}Staging deployment complete.${NC}"
echo ""
