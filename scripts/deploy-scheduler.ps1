<#
.SYNOPSIS
  Deploys Cloud Scheduler jobs for automated creator scraping.
.DESCRIPTION
  Creates three Cloud Scheduler HTTP jobs targeting the CatchFire Matching
  Engine Cloud Run service for Vimeo (daily), Behance (daily), and all
  platforms (weekly).
.PARAMETER CloudRunUrl
  The Cloud Run service URL (e.g. https://cf-influencer-matching-engine-XXXXXXXXXX-uc.a.run.app)
.PARAMETER ServiceAccountEmail
  The service account email used for OIDC authentication against Cloud Run.
.AUTHOR
  Charley Scholz, JLAI
.COAUTHOR
  Claude Opus 4.6, Cursor (IDE)
.CREATED
  2026-02-23
.UPDATED
  2026-02-23
#>

param(
    [string]$CloudRunUrl = "https://cf-influencer-matching-engine-XXXXXXXXXX-uc.a.run.app",
    [string]$ServiceAccountEmail = "scheduler-invoker@catchfire-app-2026.iam.gserviceaccount.com"
)

$ErrorActionPreference = "Stop"
$ProjectId = "catchfire-app-2026"
$Region = "us-central1"

$VimeoOk = $false
$BehanceOk = $false
$WeeklyOk = $false

function Write-Step { param($Msg, $Color = "Cyan") Write-Host $Msg -ForegroundColor $Color }
function Write-Ok { param($Msg) Write-Host "  OK: $Msg" -ForegroundColor Green }
function Write-Fail { param($Msg) Write-Host "  FAIL: $Msg" -ForegroundColor Red }

Write-Host ""
Write-Step "=== CatchFire Scraper Scheduler Deployment ===" "Cyan"
Write-Host ""
Write-Host "  Project:          $ProjectId"
Write-Host "  Region:           $Region"
Write-Host "  Cloud Run URL:    $CloudRunUrl"
Write-Host "  Service Account:  $ServiceAccountEmail"
Write-Host ""

# -----------------------------------------------------------------------------
# 1. Check gcloud
# -----------------------------------------------------------------------------
Write-Step "[1/5] Checking gcloud..." "Cyan"
try {
    $null = gcloud --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "gcloud not found" }
} catch {
    Write-Fail "gcloud CLI not found or not in PATH. Install: https://cloud.google.com/sdk/docs/install"
    exit 1
}
Write-Ok "gcloud found"

try {
    $null = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
    if (-not $?) { throw "Not authenticated" }
} catch {
    Write-Fail "Not authenticated. Run: gcloud auth login"
    exit 1
}
Write-Ok "Authenticated"
Write-Host ""

# -----------------------------------------------------------------------------
# 2. Deploy daily-scrape-vimeo
# -----------------------------------------------------------------------------
Write-Step "[2/5] Deploying daily-scrape-vimeo..." "Cyan"
try {
    gcloud scheduler jobs create http daily-scrape-vimeo `
        --project="$ProjectId" `
        --location="$Region" `
        --schedule="0 2 * * *" `
        --time-zone="America/New_York" `
        --uri="$CloudRunUrl/api/v1/scraper/trigger" `
        --http-method=POST `
        --headers="Content-Type=application/json" `
        --message-body='{"platforms":["vimeo"],"limit":100}' `
        --oidc-service-account-email="$ServiceAccountEmail" `
        --oidc-token-audience="$CloudRunUrl" `
        --attempt-deadline="180s" `
        --max-retry-attempts=2 `
        --min-backoff="10s" `
        --max-backoff="60s" `
        --description="Daily Vimeo creator scrape at 2:00 AM EST" 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "daily-scrape-vimeo created"
        $VimeoOk = $true
    } else {
        Write-Fail "Failed (may already exist - use 'gcloud scheduler jobs update http' to modify)"
    }
} catch {
    Write-Fail $_.Exception.Message
}
Write-Host ""

# -----------------------------------------------------------------------------
# 3. Deploy daily-scrape-behance
# -----------------------------------------------------------------------------
Write-Step "[3/5] Deploying daily-scrape-behance..." "Cyan"
try {
    gcloud scheduler jobs create http daily-scrape-behance `
        --project="$ProjectId" `
        --location="$Region" `
        --schedule="0 3 * * *" `
        --time-zone="America/New_York" `
        --uri="$CloudRunUrl/api/v1/scraper/trigger" `
        --http-method=POST `
        --headers="Content-Type=application/json" `
        --message-body='{"platforms":["behance"],"limit":100}' `
        --oidc-service-account-email="$ServiceAccountEmail" `
        --oidc-token-audience="$CloudRunUrl" `
        --attempt-deadline="180s" `
        --max-retry-attempts=2 `
        --min-backoff="10s" `
        --max-backoff="60s" `
        --description="Daily Behance creator scrape at 3:00 AM EST" 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "daily-scrape-behance created"
        $BehanceOk = $true
    } else {
        Write-Fail "Failed (may already exist - use 'gcloud scheduler jobs update http' to modify)"
    }
} catch {
    Write-Fail $_.Exception.Message
}
Write-Host ""

# -----------------------------------------------------------------------------
# 4. Deploy weekly-scrape-all
# -----------------------------------------------------------------------------
Write-Step "[4/5] Deploying weekly-scrape-all..." "Cyan"
try {
    gcloud scheduler jobs create http weekly-scrape-all `
        --project="$ProjectId" `
        --location="$Region" `
        --schedule="0 1 * * 0" `
        --time-zone="America/New_York" `
        --uri="$CloudRunUrl/api/v1/scraper/trigger" `
        --http-method=POST `
        --headers="Content-Type=application/json" `
        --message-body='{"platforms":["vimeo","behance","artstation","dribbble","instagram","youtube","tiktok","linkedin"],"limit":500}' `
        --oidc-service-account-email="$ServiceAccountEmail" `
        --oidc-token-audience="$CloudRunUrl" `
        --attempt-deadline="600s" `
        --max-retry-attempts=3 `
        --min-backoff="30s" `
        --max-backoff="120s" `
        --description="Weekly full-platform creator scrape, Sunday 1:00 AM EST" 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "weekly-scrape-all created"
        $WeeklyOk = $true
    } else {
        Write-Fail "Failed (may already exist - use 'gcloud scheduler jobs update http' to modify)"
    }
} catch {
    Write-Fail $_.Exception.Message
}
Write-Host ""

# -----------------------------------------------------------------------------
# 5. Summary
# -----------------------------------------------------------------------------
Write-Step "=== Deployment Summary ===" "Cyan"
Write-Host "  daily-scrape-vimeo:   $(if ($VimeoOk) { 'OK' } else { 'FAIL' })"
Write-Host "  daily-scrape-behance: $(if ($BehanceOk) { 'OK' } else { 'FAIL' })"
Write-Host "  weekly-scrape-all:    $(if ($WeeklyOk) { 'OK' } else { 'FAIL' })"
Write-Host ""

$AllOk = $VimeoOk -and $BehanceOk -and $WeeklyOk
if ($AllOk) {
    Write-Host "All scheduler jobs deployed successfully." -ForegroundColor Green
    Write-Host ""
    Write-Host "Verify with:  gcloud scheduler jobs list --project=$ProjectId --location=$Region"
    exit 0
} else {
    Write-Host "Some deployments failed. Review errors above." -ForegroundColor Red
    exit 1
}
