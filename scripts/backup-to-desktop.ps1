# AI Golden Master - End of Session Backup Script
# Creates a timestamped backup on Desktop after GitHub push

param(
    [string]$Version = "1.0.0",  # Update this when version changes
    [string]$ProjectName = "ba-invoice-reconcile"  # Project name for backup folder
)

# Get timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "$ProjectName-v$Version-$timestamp"
$backupPath = "$env:USERPROFILE\Desktop\$backupName"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  END OF SESSION BACKUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if there are uncommitted changes
$gitStatus = git status --porcelain 2>$null
if ($gitStatus) {
    Write-Host "⚠️  WARNING: You have uncommitted changes!" -ForegroundColor Yellow
    Write-Host "   Consider pushing to GitHub first." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Backup cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "📦 Creating backup..." -ForegroundColor Green
Write-Host "   Project: $ProjectName"
Write-Host "   Version: v$Version"
Write-Host "   Location: $backupPath"
Write-Host ""

# Create backup excluding unnecessary folders
$excludes = @("node_modules", ".git", "backups", "chat-history-export", "chat-transcripts", "Test Resources")
Copy-Item -Path . -Destination $backupPath -Recurse -Force -ErrorAction SilentlyContinue

# Remove excluded folders from backup
foreach ($exclude in $excludes) {
    $excludePath = Join-Path $backupPath $exclude
    if (Test-Path $excludePath) {
        Remove-Item -Path $excludePath -Recurse -Force
    }
}

# Verify backup
$fileCount = (Get-ChildItem -Path $backupPath -Recurse -File).Count

Write-Host ""
Write-Host "✅ BACKUP COMPLETE!" -ForegroundColor Green
Write-Host "   Files: $fileCount"
Write-Host "   Path:  $backupPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
