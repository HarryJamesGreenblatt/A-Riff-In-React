#!/usr/bin/env pwsh
# Script: setup-entra-external-id.ps1
# Purpose: Automate app registration, user flow association, and Google provider setup for Entra External ID

param(

    [string]$TenantId,
    [string]$ClientId,
    [string]$UserFlowId,
    [string]$GoogleClientId,
    [string]$GoogleClientSecret,
    [string]$GraphClientId = $env:AZURE_CLIENT_ID,
    [string]$GraphClientSecret = $env:AZURE_CLIENT_SECRET,
    [string]$GraphTenantId = $env:AZURE_TENANT_ID
)


# Minimal validation: respect parameters as passed (param defaults already read from env when provided by the caller)
# Do not reassign params from environment; the workflow should pass them or rely on the param defaults.
$missing = @()
if (-not $TenantId) { $missing += 'TenantId' }
if (-not $ClientId) { $missing += 'ClientId' }
if (-not $UserFlowId) { $missing += 'UserFlowId' }
if ($missing.Count -gt 0) {
    Write-Error "Missing required parameters: $($missing -join ', ').\nPass them as script parameters or set the environment variables that are already used as param defaults (for example AZURE_CLIENT_ID/SECRET/TENANT or VITE_ENTRA_*)."
    exit 1
}

# Skip Google provider configuration if credentials aren't provided
$skipGoogle = -not ($GoogleClientId -and $GoogleClientSecret)
if ($skipGoogle) { Write-Host "Warning: Google client credentials not provided. Skipping Google identity provider configuration." }

# Connect to Microsoft Graph using service principal for CI/CD

# Try PSCredential-based login if required by Microsoft.Graph module version
if ($GraphClientId -and $GraphClientSecret -and $GraphTenantId) {
    try {
        $secpasswd = ConvertTo-SecureString $GraphClientSecret -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($GraphClientId, $secpasswd)
        Connect-MgGraph -ClientSecretCredential $credential -TenantId $GraphTenantId -Scopes "Application.ReadWrite.All, IdentityProvider.ReadWrite.All, User.ReadWrite.All"
    } catch {
        Write-Host "PSCredential login failed, trying string-based login..."
        Connect-MgGraph -ClientId $GraphClientId -ClientSecret $GraphClientSecret -TenantId $GraphTenantId -Scopes "Application.ReadWrite.All, IdentityProvider.ReadWrite.All, User.ReadWrite.All"
    }
} else {
    Write-Host "Service principal credentials not found. Falling back to interactive login."
    Connect-MgGraph -Scopes "Application.ReadWrite.All, IdentityProvider.ReadWrite.All, User.ReadWrite.All" -TenantId $TenantId
}

# 1. Ensure SPA app registration exists and has correct redirect URIs
$app = Get-MgApplication -Filter "appId eq '$ClientId'"
if (-not $app) {
    Write-Host "App registration not found. Creating new app registration..."
    $app = New-MgApplication -DisplayName "A-Riff-In-React SPA" -Web @{ RedirectUris = @("http://localhost:5173", "https://<YOUR_FRONTEND_URL>") }
    $ClientId = $app.AppId
    Write-Host "Created app registration with clientId: $ClientId"
} else {
    Write-Host "App registration found. Ensuring redirect URIs are set..."
    Update-MgApplication -ApplicationId $app.Id -Web @{ RedirectUris = @("http://localhost:5173", "https://<YOUR_FRONTEND_URL>") }
}

# 2. Associate app registration with user flow
$userFlow = Get-MgIdentityB2xUserFlow -UserFlowId $UserFlowId
if ($userFlow) {
    Write-Host "Associating app registration with user flow..."
    # Add the app to the user flow's applications collection
    New-MgIdentityB2xUserFlowApplication -UserFlowId $UserFlowId -AppId $app.AppId
} else {
    Write-Host "User flow $UserFlowId not found."
}

# 3. Configure Google as an identity provider
$googleProvider = Get-MgIdentityProvider -Filter "displayName eq 'Google'"
if (-not $googleProvider) {
    Write-Host "Creating Google identity provider..."
    New-MgIdentityProvider -DisplayName "Google" -IdentityProviderType "Google" -ClientId $GoogleClientId -ClientSecret $GoogleClientSecret
} else {
    Write-Host "Google identity provider already exists. Updating credentials..."
    Update-MgIdentityProvider -IdentityProviderId $googleProvider.Id -ClientId $GoogleClientId -ClientSecret $GoogleClientSecret
}

Write-Host "✅ Entra External ID setup complete."
