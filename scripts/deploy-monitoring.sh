#!/bin/bash
# ============================================================================
# CatchFire Matching Engine - Deploy Cloud Monitoring Alerts
# ============================================================================
# Author: Charley Scholz, JLAI
# Co-authored: Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
# Created: 2026-02-23
# Updated: 2026-02-23
# ============================================================================
# Purpose:     Deploys uptime check, error-rate alert, and latency alert
#              policies to GCP project catchfire-app-2026
# Usage:       ./scripts/deploy-monitoring.sh
# CI/CD:       Suitable for GitHub Actions, Cloud Build, etc.
# ============================================================================

# Don't use set -e; we continue on partial failures and report at end

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ID="catchfire-app-2026"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="${SCRIPT_DIR}/monitoring"
CHANNEL_ID="14498102877036729188"

# Counters
UPTIME_OK=0
ERROR_RATE_OK=0
LATENCY_OK=0
CHANNEL_OK=0

step() { echo -e "\n${CYAN}[$1] $2${NC}"; }
ok()   { echo -e "  ${GREEN}OK:${NC} $1"; }
fail() { echo -e "  ${RED}FAIL:${NC} $1"; }

# -----------------------------------------------------------------------------
# 1. Check gcloud availability and auth
# -----------------------------------------------------------------------------
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

# -----------------------------------------------------------------------------
# 2. Verify notification channel exists
# -----------------------------------------------------------------------------
step "2/5" "Verifying notification channel..."
if gcloud alpha monitoring channels describe "$CHANNEL_ID" --project="$PROJECT_ID" &>/dev/null; then
    ok "Channel $CHANNEL_ID exists"
    CHANNEL_OK=1
else
    fail "Channel $CHANNEL_ID not found. Create it in Cloud Console first."
fi

# -----------------------------------------------------------------------------
# 3. Deploy uptime check (via REST API - gcloud has no --config-from-file)
# -----------------------------------------------------------------------------
step "3/5" "Deploying uptime check..."
UPTIME_CONFIG="${MONITORING_DIR}/uptime-check.json"
if [[ ! -f "$UPTIME_CONFIG" ]]; then
    fail "Config not found: $UPTIME_CONFIG"
else
    TOKEN=$(gcloud auth print-access-token)
    HTTP_CODE=$(curl -s -o /tmp/uptime-response.json -w "%{http_code}" \
        -X POST "https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/uptimeCheckConfigs" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d @"${UPTIME_CONFIG}" 2>/dev/null) || HTTP_CODE="000"
    if [[ "$HTTP_CODE" == "200" ]]; then
        ok "Uptime check created"
        UPTIME_OK=1
    elif [[ "$HTTP_CODE" == "409" ]]; then
        echo -e "  ${YELLOW}(Uptime check may already exist - skipping)${NC}"
    else
        fail "HTTP $HTTP_CODE - $(cat /tmp/uptime-response.json 2>/dev/null | head -c 200)"
    fi
fi

# -----------------------------------------------------------------------------
# 4. Deploy error rate alert policy
# -----------------------------------------------------------------------------
step "4/5" "Deploying error rate alert policy..."
ERROR_RATE_CONFIG="${MONITORING_DIR}/error-rate-alert.json"
if [[ ! -f "$ERROR_RATE_CONFIG" ]]; then
    fail "Config not found: $ERROR_RATE_CONFIG"
else
    if gcloud alpha monitoring policies create \
        --policy-from-file="$ERROR_RATE_CONFIG" \
        --project="$PROJECT_ID" 2>/dev/null; then
        ok "Error rate alert policy created"
        ERROR_RATE_OK=1
    else
        EXIT=$?
        fail "gcloud alpha monitoring policies create failed (exit $EXIT)"
    fi
fi

# -----------------------------------------------------------------------------
# 5. Deploy latency alert policy
# -----------------------------------------------------------------------------
step "5/5" "Deploying latency alert policy..."
LATENCY_CONFIG="${MONITORING_DIR}/latency-alert.json"
if [[ ! -f "$LATENCY_CONFIG" ]]; then
    fail "Config not found: $LATENCY_CONFIG"
else
    if gcloud alpha monitoring policies create \
        --policy-from-file="$LATENCY_CONFIG" \
        --project="$PROJECT_ID" 2>/dev/null; then
        ok "Latency alert policy created"
        LATENCY_OK=1
    else
        EXIT=$?
        fail "gcloud alpha monitoring policies create failed (exit $EXIT)"
    fi
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
step "Summary" "Deployment Summary"
echo "  Notification channel: $([[ $CHANNEL_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo "  Uptime check:         $([[ $UPTIME_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo "  Error rate alert:     $([[ $ERROR_RATE_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo "  Latency alert:        $([[ $LATENCY_OK -eq 1 ]] && echo 'OK' || echo 'FAIL')"
echo ""

if [[ $CHANNEL_OK -eq 1 && $UPTIME_OK -eq 1 && $ERROR_RATE_OK -eq 1 && $LATENCY_OK -eq 1 ]]; then
    echo -e "${GREEN}All monitoring resources deployed successfully.${NC}"
    exit 0
else
    echo -e "${RED}Some deployments failed. Review errors above.${NC}"
    exit 1
fi
