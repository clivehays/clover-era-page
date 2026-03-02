# Clover ERA Outreach System Deployment Script
# Run this in PowerShell after logging into Supabase

Write-Host "=== Clover ERA Outreach Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Step 1: Checking Supabase authentication..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Please run: supabase login" -ForegroundColor Red
    Write-Host "Then re-run this script." -ForegroundColor Red
    exit 1
}
Write-Host "Authenticated!" -ForegroundColor Green
Write-Host ""

# Link project if not already linked
Write-Host "Step 2: Linking to project..." -ForegroundColor Yellow
supabase link --project-ref drugebiitlcjkknjfxeh
Write-Host ""

# Deploy functions
Write-Host "Step 3: Deploying edge functions..." -ForegroundColor Yellow

$functions = @(
    "research-prospect",
    "generate-emails",
    "send-outreach-email",
    "resend-webhook",
    "handle-reply"
)

foreach ($func in $functions) {
    Write-Host "  Deploying $func..." -ForegroundColor Cyan
    supabase functions deploy $func --no-verify-jwt
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] $func deployed" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $func failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 4: Running SQL migration..." -ForegroundColor Yellow
Write-Host "Please run the following SQL in Supabase Dashboard SQL Editor:" -ForegroundColor Yellow
Write-Host "File: crm/migrations/030_email_sequences.sql" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set secrets in Supabase Dashboard Edge Functions Secrets:" -ForegroundColor White
Write-Host "   - ANTHROPIC_API_KEY" -ForegroundColor Gray
Write-Host "   - RESEND_API_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Run migration 030 in SQL Editor" -ForegroundColor White
