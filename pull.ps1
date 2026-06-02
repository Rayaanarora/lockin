Write-Host "⬇️  Pulling latest changes from GitHub..." -ForegroundColor Cyan

cd (Split-Path -Parent $MyInvocation.MyCommand.Path)

git pull origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pulled latest changes!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to pull changes" -ForegroundColor Red
    Write-Host "⚠️  You may have conflicts to resolve" -ForegroundColor Yellow
    exit 1
}
