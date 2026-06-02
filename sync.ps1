param([string]$message = "Sync changes")

Write-Host "🔄 Syncing with GitHub..." -ForegroundColor Cyan

cd (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Pull latest changes first
Write-Host "⬇️  Pulling changes..." -ForegroundColor Blue
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull changes" -ForegroundColor Red
    exit 1
}

# Push your changes
Write-Host "⬆️  Pushing your changes..." -ForegroundColor Blue
git add .
git commit -m $message
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No new changes to push" -ForegroundColor Yellow
}

git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully synced with GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push" -ForegroundColor Red
    exit 1
}
