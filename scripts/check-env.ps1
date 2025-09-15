# Check required environment variables for setup-entra-external-id.ps1
$vars = @('AZURE_CLIENT_ID','AZURE_CLIENT_SECRET','AZURE_TENANT_ID','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET')
foreach ($n in $vars) {
    $v = (Get-Item -Path Env:\$n -ErrorAction SilentlyContinue).Value
    $status = if ([string]::IsNullOrEmpty($v)) { '[NOT SET]' } else { '[SET]' }
    Write-Host "$n = $status"
}
Write-Host "\nNote: Values are redacted. If you need to set them for a non-interactive run, use:"
Write-Host "  $env:AZURE_CLIENT_ID = '<client-id>'"
Write-Host "  $env:AZURE_CLIENT_SECRET = '<client-secret>'"
Write-Host "  $env:AZURE_TENANT_ID = '<tenant-id>'"
Write-Host "  $env:GOOGLE_CLIENT_ID = '<google-client-id>'"
Write-Host "  $env:GOOGLE_CLIENT_SECRET = '<google-client-secret>'"
