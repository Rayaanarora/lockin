param([string]$message = "Update changes")

Write-Host "🔄 Pushing to GitHub..." -ForegroundColor Cyan

cd (Split-Path -Parent $MyInvocation.MyCommand.Path)

git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to stage files" -ForegroundColor Red
    exit 1
}

git commit -m $message
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
    exit 0
}

git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push" -ForegroundColor Red
    exit 1
}
