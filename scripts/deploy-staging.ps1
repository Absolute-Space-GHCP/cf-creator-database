<#
.SYNOPSIS
  Deploys CatchFire Matching Engine to Cloud Run staging environment.
.DESCRIPTION
  Builds the Docker image and deploys to cf-matching-staging in us-east1.
  Uses creators-staging Firestore collection (separate from production).
  Allows unauthenticated access for team testing.
.AUTHOR
  Charley Scholz, JLAI
.COAUTHOR
  Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
.CREATED
  2026-02-23
.UPDATED
  2026-02-23
#>

$ErrorActionPreference = "Stop"

$ProjectId = "catchfire-app-2026"
$ServiceName = "cf-matching-staging"
$Region = "us-east1"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir

function Write-Step { param($Msg, $Color = "Cyan") Write-Host $Msg -ForegroundColor $Color }
function Write-Ok { param($Msg) Write-Host "  OK: $Msg" -ForegroundColor Green }
function Write-Fail { param($Msg) Write-Host "  FAIL: $Msg" -ForegroundColor Red }

Write-Host ""
Write-Step "=== CatchFire Staging Deployment ===" "Cyan"
Write-Host "  Service: $ServiceName"
Write-Host "  Region:  $Region"
Write-Host "  Project: $ProjectId"
Write-Host ""

# -----------------------------------------------------------------------------
# 1. Check gcloud availability and auth
# -----------------------------------------------------------------------------
Write-Step "[1/4] Checking gcloud..." "Cyan"
try {
    $null = gcloud --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "gcloud not found" }
} catch {
    Write-Fail "gcloud CLI not found or not in PATH. Install: https://cloud.google.com/sdk/docs/install"
    exit 1
}
Write-Ok "gcloud found"

try {
    $acct = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
    if (-not $acct) { throw "Not authenticated" }
} catch {
    Write-Fail "Not authenticated. Run: gcloud auth login"
    exit 1
}
Write-Ok "Authenticated"
Write-Host ""

# -----------------------------------------------------------------------------
# 2. Build (npm run build:all)
# -----------------------------------------------------------------------------
Write-Step "[2/4] Building (npm run build:all)..." "Cyan"
Push-Location $RepoRoot
try {
    npm run build:all 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Build failed"
        exit 1
    }
    Write-Ok "Build complete"
} catch {
    Write-Fail "Build failed: $_"
    exit 1
} finally {
    Pop-Location
}
Write-Host ""

# -----------------------------------------------------------------------------
# 3. Deploy to Cloud Run
# -----------------------------------------------------------------------------
Write-Step "[3/4] Deploying to Cloud Run..." "Cyan"
Push-Location $RepoRoot
try {
    gcloud run deploy $ServiceName `
        --source . `
        --region $Region `
        --project $ProjectId `
        --memory 512Mi `
        --cpu 1 `
        --allow-unauthenticated `
        --set-env-vars "NODE_ENV=staging,GCP_PROJECT_ID=$ProjectId,GOOGLE_CLOUD_PROJECT=$ProjectId,FIRESTORE_COLLECTION=creators-staging" `
        2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Deploy failed"
        exit 1
    }
    Write-Ok "Deploy complete"
} catch {
    Write-Fail "Deploy failed: $_"
    exit 1
} finally {
    Pop-Location
}
Write-Host ""

# -----------------------------------------------------------------------------
# 4. Get service URL
# -----------------------------------------------------------------------------
Write-Step "[4/4] Retrieving service URL..." "Cyan"
$Url = gcloud run services describe $ServiceName --region $Region --project $ProjectId --format="value(status.url)" 2>$null
if ($Url) {
    Write-Ok "Staging URL: $Url"
    Write-Host ""
    Write-Host "  Health:  $Url/health" -ForegroundColor Gray
    Write-Host "  Testing: $Url/testing" -ForegroundColor Gray
} else {
    Write-Fail "Could not retrieve service URL"
}
Write-Host ""
Write-Step "Staging deployment complete." "Green"
Write-Host ""
