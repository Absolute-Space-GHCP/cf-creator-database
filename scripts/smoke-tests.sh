#!/bin/bash
# ============================================================================
# CatchFire Matching Engine - Smoke Test Suite
# ============================================================================
# Author: Charley Scholz, JLIT
# Co-authored: Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
# Created: 2026-02-13
# Updated: 2026-02-13
# ============================================================================
# Purpose:     Validates all services, APIs, auth, and integrations are working
# Usage:       ./scripts/smoke-tests.sh [--local|--production]
# Expected:    All tests pass with ✓
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0
SKIP=0

# Configuration
LOCAL_URL="http://localhost:8090"
PROD_URL="https://cf-matching-engine-34240596768.us-central1.run.app"
BASE_URL="$LOCAL_URL"  # Default to local

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --production|--prod|-p)
            BASE_URL="$PROD_URL"
            shift
            ;;
        --local|-l)
            BASE_URL="$LOCAL_URL"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--local|--production]"
            exit 1
            ;;
    esac
done

# ============================================================================
# Test Helper Functions
# ============================================================================

check() {
    local name="$1"
    local cmd="$2"
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $name"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

check_warn() {
    local name="$1"
    local cmd="$2"
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}○${NC} $name (optional)"
        WARN=$((WARN + 1))
    fi
}

check_version() {
    local name="$1"
    local cmd="$2"
    
    local version
    version=$(eval "$cmd" 2>&1 | head -1)
    if [ -n "$version" ]; then
        echo -e "${GREEN}✓${NC} $name: ${CYAN}$version${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}✗${NC} $name: NOT FOUND"
        FAIL=$((FAIL + 1))
    fi
}

check_http() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $name (HTTP $response_code)"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $name (HTTP $response_code, expected $expected_code)"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

check_json_field() {
    local name="$1"
    local url="$2"
    local field="$3"
    local expected="$4"
    
    local value
    value=$(curl -s "$url" 2>/dev/null | jq -r "$field" 2>/dev/null)
    
    if [ "$value" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $name: $value"
        PASS=$((PASS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $name: got '$value', expected '$expected'"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

skip_test() {
    local name="$1"
    local reason="$2"
    echo -e "${BLUE}⊘${NC} $name (skipped: $reason)"
    SKIP=$((SKIP + 1))
}

# ============================================================================
# Start Test Suite
# ============================================================================

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║          🔥 CatchFire Matching Engine — Smoke Test Suite 🔥           ║"
echo "╠═══════════════════════════════════════════════════════════════════════╣"
echo "║  Testing: $BASE_URL"
echo "║  Time:    $(date '+%Y-%m-%d %H:%M:%S')"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# Section 1: System Prerequisites
# ============================================================================
echo "── System Prerequisites ──────────────────────────────────────────────────"

check_version "Node.js" "node -v"
check_version "npm" "npm -v"
check "jq installed" "command -v jq"
check "curl installed" "command -v curl"

echo ""

# ============================================================================
# Section 2: Authentication & Credentials
# ============================================================================
echo "── Authentication & Credentials ──────────────────────────────────────────"

check "GCP ADC credentials" "[ -f ~/.config/gcloud/application_default_credentials.json ]"
check "GCP project configured" "gcloud config get-value project 2>/dev/null | grep -q '.'"
check_warn ".env file exists" "[ -f .env ]"

# Check for GEMINI_API_KEY
if [ -f .env ]; then
    if grep -q "^GEMINI_API_KEY=." .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} GEMINI_API_KEY configured"
        PASS=$((PASS + 1))
    else
        echo -e "${YELLOW}○${NC} GEMINI_API_KEY not set in .env (will use ADC)"
        WARN=$((WARN + 1))
    fi
else
    skip_test "GEMINI_API_KEY" "no .env file"
fi

echo ""

# ============================================================================
# Section 3: API Endpoint Accessibility
# ============================================================================
echo "── API Endpoint Accessibility ────────────────────────────────────────────"

# Core endpoints
check_http "GET /health" "$BASE_URL/health"
check_http "GET /api/v1/stats" "$BASE_URL/api/v1/stats"

# Creator CRUD endpoints
check_http "GET /api/v1/creators" "$BASE_URL/api/v1/creators"

# Search endpoints
check_http "POST /api/v1/match (empty brief)" "$BASE_URL/api/v1/match" "400"

# LLM endpoints
check_http "GET /api/v1/llm/test" "$BASE_URL/api/v1/llm/test"

# Embeddings endpoints
check_http "GET /api/v1/embeddings/test" "$BASE_URL/api/v1/embeddings/test"

# Lookalikes endpoints
check_http "GET /api/v1/lookalikes/model" "$BASE_URL/api/v1/lookalikes/model"

echo ""

# ============================================================================
# Section 4: API Response Validation
# ============================================================================
echo "── API Response Validation ───────────────────────────────────────────────"

# Check health endpoint returns expected structure
check_json_field "Health status" "$BASE_URL/health" ".status" "healthy"

# Check stats endpoint
STATS_RESPONSE=$(curl -s "$BASE_URL/api/v1/stats" 2>/dev/null)
if echo "$STATS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    TOTAL_CREATORS=$(echo "$STATS_RESPONSE" | jq -r '.data.totalCreators // 0')
    GOLDEN_RECORDS=$(echo "$STATS_RESPONSE" | jq -r '.data.goldenRecords // 0')
    echo -e "${GREEN}✓${NC} Stats endpoint: ${CYAN}$TOTAL_CREATORS creators, $GOLDEN_RECORDS golden${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC} Stats endpoint: invalid response"
    FAIL=$((FAIL + 1))
fi

# Check LLM test
LLM_RESPONSE=$(curl -s "$BASE_URL/api/v1/llm/test" 2>/dev/null)
if echo "$LLM_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    MODEL=$(echo "$LLM_RESPONSE" | jq -r '.model // "unknown"')
    echo -e "${GREEN}✓${NC} LLM service: ${CYAN}$MODEL${NC}"
    PASS=$((PASS + 1))
else
    ERROR=$(echo "$LLM_RESPONSE" | jq -r '.error // "unknown error"')
    echo -e "${RED}✗${NC} LLM service: $ERROR"
    FAIL=$((FAIL + 1))
fi

# Check Embeddings test
EMB_RESPONSE=$(curl -s "$BASE_URL/api/v1/embeddings/test" 2>/dev/null)
if echo "$EMB_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    DIMS=$(echo "$EMB_RESPONSE" | jq -r '.dimensions // "unknown"')
    echo -e "${GREEN}✓${NC} Embeddings service: ${CYAN}${DIMS}d vectors${NC}"
    PASS=$((PASS + 1))
else
    ERROR=$(echo "$EMB_RESPONSE" | jq -r '.error // "unknown error"')
    echo -e "${RED}✗${NC} Embeddings service: $ERROR"
    FAIL=$((FAIL + 1))
fi

echo ""

# ============================================================================
# Section 5: Database Operations
# ============================================================================
echo "── Database Operations ───────────────────────────────────────────────────"

# Test read operation
CREATORS_RESPONSE=$(curl -s "$BASE_URL/api/v1/creators?limit=1" 2>/dev/null)
if echo "$CREATORS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Firestore read operation"
    PASS=$((PASS + 1))
else
    echo -e "${RED}✗${NC} Firestore read operation"
    FAIL=$((FAIL + 1))
fi

# Check Golden Records model
LOOKALIKE_RESPONSE=$(curl -s "$BASE_URL/api/v1/lookalikes/model" 2>/dev/null)
if echo "$LOOKALIKE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    GR_COUNT=$(echo "$LOOKALIKE_RESPONSE" | jq -r '.model.totalGoldenRecords // 0')
    HAS_CENTROID=$(echo "$LOOKALIKE_RESPONSE" | jq -e '.model.centroid != null' > /dev/null 2>&1&& echo "yes" || echo "no")
    echo -e "${GREEN}✓${NC} Golden Records model: ${CYAN}$GR_COUNT records, centroid=$HAS_CENTROID${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}○${NC} Golden Records model: not built yet"
    WARN=$((WARN + 1))
fi

echo ""

# ============================================================================
# Section 6: Semantic Search Test
# ============================================================================
echo "── Semantic Search Test ──────────────────────────────────────────────────"

# Test semantic search with a real query
SEARCH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/search/semantic" \
    -H "Content-Type: application/json" \
    -d '{"query": "cinematographer with experience in documentary filmmaking"}' 2>/dev/null)

if echo "$SEARCH_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    RESULTS_COUNT=$(echo "$SEARCH_RESPONSE" | jq -r '.results | length // 0')
    echo -e "${GREEN}✓${NC} Semantic search: ${CYAN}$RESULTS_COUNT results returned${NC}"
    PASS=$((PASS + 1))
else
    ERROR=$(echo "$SEARCH_RESPONSE" | jq -r '.error // "unknown error"')
    echo -e "${RED}✗${NC} Semantic search: $ERROR"
    FAIL=$((FAIL + 1))
fi

echo ""

# ============================================================================
# Section 7: Integration Tests (if local)
# ============================================================================
if [ "$BASE_URL" = "$LOCAL_URL" ]; then
    echo "── Integration Tests (Local Only) ────────────────────────────────────────"
    
    # Check if cf-creator-database exists
    if [ -d "../cf-creator-database" ]; then
        echo -e "${GREEN}✓${NC} cf-creator-database project found"
        PASS=$((PASS + 1))
        
        # Check integration service exists
        if [ -f "../cf-creator-database/src/services/matching-engine.ts" ]; then
            echo -e "${GREEN}✓${NC} Integration service (matching-engine.ts) exists"
            PASS=$((PASS + 1))
        else
            echo -e "${YELLOW}○${NC} Integration service not found"
            WARN=$((WARN + 1))
        fi
    else
        skip_test "cf-creator-database project" "directory not found"
    fi
    
    echo ""
fi

# ============================================================================
# Section 8: Project Files Check
# ============================================================================
echo "── Project Files Check ───────────────────────────────────────────────────"

check "package.json" "[ -f package.json ]"
check "src/index.js" "[ -f src/index.js ]"
check "src/schemas.ts" "[ -f src/schemas.ts ]"
check "src/scoring.ts" "[ -f src/scoring.ts ]"
check "src/llm.ts" "[ -f src/llm.ts ]"
check_warn "tsconfig.json" "[ -f tsconfig.json ]"
check_warn "Dockerfile" "[ -f Dockerfile ]"

echo ""

# ============================================================================
# Results Summary
# ============================================================================
echo "═══════════════════════════════════════════════════════════════════════════"

TOTAL=$((PASS + FAIL + WARN + SKIP))

if [ $FAIL -eq 0 ]; then
    echo -e "🎉 ${GREEN}ALL TESTS PASSED!${NC}"
else
    echo -e "⚠️  ${RED}SOME TESTS FAILED${NC}"
fi

echo ""
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$WARN warnings${NC}, ${BLUE}$SKIP skipped${NC}"
echo "═══════════════════════════════════════════════════════════════════════════"

# Exit with error if any tests failed
if [ $FAIL -gt 0 ]; then
    exit 1
fi

exit 0
