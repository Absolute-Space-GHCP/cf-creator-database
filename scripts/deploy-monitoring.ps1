<#
.SYNOPSIS
  Deploys Cloud Monitoring alerts and uptime checks for CatchFire Matching Engine.
.DESCRIPTION
  Deploys uptime check, error-rate alert, and latency alert policies to GCP
  project catchfire-app-2026. Verifies notification channel exists before deploy.
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
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$MonitoringDir = Join-Path $ScriptDir "monitoring"

# Counters for summary
$UptimeOk = $false
$ErrorRateOk = $false
$LatencyOk = $false
$ChannelOk = $false

function Write-Step { param($Msg, $Color = "Cyan") Write-Host $Msg -ForegroundColor $Color }
function Write-Ok { param($Msg) Write-Host "  OK: $Msg" -ForegroundColor Green }
function Write-Fail { param($Msg) Write-Host "  FAIL: $Msg" -ForegroundColor Red }

Write-Host ""
Write-Step "=== CatchFire Monitoring Deployment ===" "Cyan"
Write-Host ""

# -----------------------------------------------------------------------------
# 1. Check gcloud availability and auth
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
# 2. Verify notification channel exists
# -----------------------------------------------------------------------------
Write-Step "[2/5] Verifying notification channel..." "Cyan"
$ChannelId = "14498102877036729188"
$ChannelName = "projects/$ProjectId/notificationChannels/$ChannelId"
try {
    gcloud alpha monitoring channels describe $ChannelId --project=$ProjectId 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Channel $ChannelId exists"
        $ChannelOk = $true
    } else {
        Write-Fail "Channel $ChannelId not found. Create it in Cloud Console first."
    }
} catch {
    Write-Fail "Channel $ChannelId not found. Create it in Cloud Console first."
}
Write-Host ""

# -----------------------------------------------------------------------------
# 3. Deploy uptime check (via REST API - gcloud has no --config-from-file)
# -----------------------------------------------------------------------------
Write-Step "[3/5] Deploying uptime check..." "Cyan"
$UptimeConfigPath = Join-Path $MonitoringDir "uptime-check.json"
if (-not (Test-Path $UptimeConfigPath)) {
    Write-Fail "Config not found: $UptimeConfigPath"
} else {
    try {
        $Token = gcloud auth print-access-token 2>$null
        $Body = Get-Content $UptimeConfigPath -Raw
        $Uri = "https://monitoring.googleapis.com/v3/projects/$ProjectId/uptimeCheckConfigs"
        $Headers = @{
            "Authorization" = "Bearer $Token"
            "Content-Type"   = "application/json"
        }
        $Response = Invoke-RestMethod -Uri $Uri -Method Post -Headers $Headers -Body $Body -ErrorAction Stop
        Write-Ok "Uptime check created: $($Response.name)"
        $UptimeOk = $true
    } catch {
        $statusCode = $null
        if ($_.Exception.Response) { $statusCode = $_.Exception.Response.StatusCode.value__ }
        if ($statusCode -eq 409 -or $_.Exception.Message -match "already exists|409") {
            Write-Host "  (Uptime check may already exist - skipping)" -ForegroundColor Yellow
        } else {
            Write-Fail $_.Exception.Message
        }
    }
}
Write-Host ""

# -----------------------------------------------------------------------------
# 4. Deploy error rate alert policy
# -----------------------------------------------------------------------------
Write-Step "[4/5] Deploying error rate alert policy..." "Cyan"
$ErrorRatePath = Join-Path $MonitoringDir "error-rate-alert.json"
if (-not (Test-Path $ErrorRatePath)) {
    Write-Fail "Config not found: $ErrorRatePath"
} else {
    try {
        gcloud alpha monitoring policies create --policy-from-file=$ErrorRatePath --project=$ProjectId 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Error rate alert policy created"
            $ErrorRateOk = $true
        } else {
            Write-Fail "gcloud alpha monitoring policies create failed (exit $LASTEXITCODE)"
        }
    } catch {
        Write-Fail $_.Exception.Message
    }
}
Write-Host ""

# -----------------------------------------------------------------------------
# 5. Deploy latency alert policy
# -----------------------------------------------------------------------------
Write-Step "[5/5] Deploying latency alert policy..." "Cyan"
$LatencyPath = Join-Path $MonitoringDir "latency-alert.json"
if (-not (Test-Path $LatencyPath)) {
    Write-Fail "Config not found: $LatencyPath"
} else {
    try {
        gcloud alpha monitoring policies create --policy-from-file=$LatencyPath --project=$ProjectId 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Latency alert policy created"
            $LatencyOk = $true
        } else {
            Write-Fail "gcloud alpha monitoring policies create failed (exit $LASTEXITCODE)"
        }
    } catch {
        Write-Fail $_.Exception.Message
    }
}
Write-Host ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
Write-Step "=== Deployment Summary ===" "Cyan"
$AllOk = $UptimeOk -and $ErrorRateOk -and $LatencyOk -and $ChannelOk
Write-Host "  Notification channel: $(if ($ChannelOk) { 'OK' } else { 'FAIL' })"
Write-Host "  Uptime check:         $(if ($UptimeOk) { 'OK' } else { 'FAIL' })"
Write-Host "  Error rate alert:     $(if ($ErrorRateOk) { 'OK' } else { 'FAIL' })"
Write-Host "  Latency alert:        $(if ($LatencyOk) { 'OK' } else { 'FAIL' })"
Write-Host ""
if ($AllOk) {
    Write-Host "All monitoring resources deployed successfully." -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some deployments failed. Review errors above." -ForegroundColor Red
    exit 1
}
