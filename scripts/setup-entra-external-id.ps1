#!/usr/bin/env pwsh
# Script: setup-entra-external-id.ps1
# Purpose: Automate app registration, user flow association, and Google provider setup for Entra External ID

param(
    [string]$TenantId,
    [string]$ClientId,
    # Optional: explicit target SPA application (client) id to use instead of creating a new app. When provided the script will prefer this appId.
    [string]$TargetAppClientId = $null,
    [string]$UserFlowId,
    [string]$GoogleClientId = $env:GOOGLE_CLIENT_ID,
    [string]$GoogleClientSecret = $env:GOOGLE_CLIENT_SECRET,
    [string]$GraphClientId = $env:AZURE_CLIENT_ID,
    [string]$GraphClientSecret = $env:AZURE_CLIENT_SECRET,
    [string]$GraphTenantId = $env:AZURE_TENANT_ID,
    [switch]$DryRun,
    [bool]$PreferModule = $true
)

# Add System.Web assembly for URL encoding
Add-Type -AssemblyName System.Web

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

# If user supplied an explicit target SPA appId, prefer that value for the app lookup/association steps.
if ($TargetAppClientId) {
    Write-Host "Using explicit target SPA app clientId: $TargetAppClientId"
    $ClientId = $TargetAppClientId
}

# Skip Google provider configuration if credentials aren't provided
$skipGoogle = -not ($GoogleClientId -and $GoogleClientSecret)
if ($skipGoogle) { Write-Host "Warning: Google client credentials not provided. Skipping Google identity provider configuration." }

# Authentication: prefer Azure CLI / az access token and use Graph REST (`az rest`) for deterministic behavior in CI.
# If az isn't available or an access token cannot be obtained, fall back to Microsoft.Graph PowerShell cmdlets.

# Helper: wrapper for `az rest` which uses the Azure CLI authentication context.
function Invoke-AzRest {
    param (
        [string]$Method,
        [string]$Uri,
        [string]$Body = $null
    )

    try {
        if ($null -ne $Body) {
            $result = & az rest --method $Method --url $Uri --body $Body --headers "Content-Type=application/json" 2>&1
        } else {
            $result = & az rest --method $Method --url $Uri 2>&1
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "az rest failed with exit code $LASTEXITCODE. Output: $($result -join "`n")"
        }
        
        # Parse JSON if it looks like JSON
        if ($result -and $result[0] -match '^\s*[{\[]') {
            return $result | ConvertFrom-Json
        }
        return $result
    } catch {
        throw "az rest error: $($_.Exception.Message)"
    }
}

# Helper: wrapper for Microsoft.Graph REST via the module (if available)
function Invoke-MgRest {
    param(
        [string]$Method,
        [string]$Uri,
        $Body = $null
    )

    if (-not (Get-Command Invoke-MgGraphRequest -ErrorAction SilentlyContinue)) {
        throw "Microsoft.Graph module REST helper not available."
    }

    if ($Body -ne $null) {
        return Invoke-MgGraphRequest -Method $Method -Uri $Uri -Body ($Body | ConvertTo-Json -Depth 10)
    }
    return Invoke-MgGraphRequest -Method $Method -Uri $Uri
}

# Helper: Az module lookups (read-only discovery). These operate via Az.Resources and Az.Accounts context.
function Get-AzApplicationByAppId {
    param([string]$appId)
    if (-not (Get-Command Get-AzADApplication -ErrorAction SilentlyContinue)) { return $null }
    try { return Get-AzADApplication -ApplicationId $appId -ErrorAction SilentlyContinue } catch { return $null }
}

function Get-AzServicePrincipalByAppId {
    param([string]$appId)
    if (-not (Get-Command Get-AzADServicePrincipal -ErrorAction SilentlyContinue)) { return $null }
    try { return Get-AzADServicePrincipal -ApplicationId $appId -ErrorAction SilentlyContinue } catch { return $null }
}

# Helper: verify az is present and the CLI has a Graph access token (non-interactive)
function Test-AzAuth {
    try {
        if (-not (Get-Command az -ErrorAction SilentlyContinue)) { Write-Host "az not found on PATH."; return $false }
        # Attempt to get an access token for Microsoft Graph to ensure az is authenticated
        $tokenJson = & az account get-access-token --resource https://graph.microsoft.com --output json 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "az account get-access-token failed. You may need to run 'az login' or configure a service principal.' Raw output:`n$($tokenJson -join "`n")"
            return $false
        }
        return $true
    } catch {
        Write-Host "Error while testing az authentication: $($_.Exception.Message)"
        return $false
    }
}

# 1. Ensure SPA app registration exists and has correct redirect URIs
# Ensure SPA app registration exists. Use Graph REST via az if we have an access token (deterministic in CI).
$app = $null

# Prefer Microsoft.Graph module when available and requested.
if ($PreferModule -and (Get-Command Connect-MgGraph -ErrorAction SilentlyContinue)) {
    Write-Host "Using Microsoft.Graph PowerShell module for operations (preferred)."
    # Ensure connection
    try {
        if ($GraphClientId -and $GraphClientSecret -and $GraphTenantId) {
            Write-Host "Connecting to Graph using service principal (ClientId from env or param)."
            if ($DryRun) {
                Write-Host "DryRun: would run Connect-MgGraph -ClientId <redacted> -TenantId $GraphTenantId -ClientSecret <redacted>"
            } else {
                # Different Microsoft.Graph module versions expose different parameter names for client credential auth.
                $connectCmd = Get-Command Connect-MgGraph -ErrorAction SilentlyContinue
                if ($connectCmd) {
                    $paramNames = $connectCmd.Parameters.Keys
                    if ($paramNames -contains 'ClientSecret') {
                        # Parameter accepts a plain string for client secret
                        Connect-MgGraph -ClientId $GraphClientId -TenantId $GraphTenantId -ClientSecret $GraphClientSecret -ErrorAction Stop
                    } elseif ($paramNames -contains 'ClientSecretCredential') {
                        # Parameter expects a PSCredential; construct one from the client id + secret
                        $secure = ConvertTo-SecureString $GraphClientSecret -AsPlainText -Force
                        $cred = New-Object System.Management.Automation.PSCredential($GraphClientId, $secure)
                        Connect-MgGraph -TenantId $GraphTenantId -ClientSecretCredential $cred -ErrorAction Stop
                    } else {
                        # Fallback to interactive if client credential parameters are not available
                        Write-Host "Connect-MgGraph does not support ClientSecret/ClientSecretCredential parameters in this module version; falling back to interactive connect."
                        Connect-MgGraph -ErrorAction Stop
                    }
                } else {
                    Write-Host "Connect-MgGraph not found despite earlier check; falling back to interactive connect."
                    Connect-MgGraph -ErrorAction Stop
                }
            }
        } else {
            if ($DryRun) { Write-Host "DryRun: would run Connect-MgGraph (interactive)" } else { Connect-MgGraph -ErrorAction Stop }
        }
    } catch {
        Write-Host "Failed to connect via Microsoft.Graph module: $($_.Exception.Message). Falling back to az if available."
    }

    try {
        Write-Host "Looking up application with appId = $ClientId via Microsoft.Graph REST (module-backed)..."
        $found = $false
        # Prefer the module REST helper when available for app-only context
        if ($ClientId -and (Get-Command Invoke-MgGraphRequest -ErrorAction SilentlyContinue)) {
            try {
                $filter = "appId eq '$ClientId'"
                $enc = [System.Web.HttpUtility]::UrlEncode($filter)
                $uri = "https://graph.microsoft.com/v1.0/applications?`$filter=$enc"
                Write-Host "Querying Graph: $uri"
                $resp = Invoke-MgGraphRequest -Method GET -Uri $uri -ErrorAction SilentlyContinue
                $json = $null
                if ($resp) {
                    # Invoke-MgGraphRequest can return different shapes depending on module version
                    if ($resp -is [string]) {
                        try { $json = $resp | ConvertFrom-Json } catch { $json = $null }
                    } elseif ($resp.PSObject.Properties.Name -contains 'Content') {
                        try { $json = $resp.Content | ConvertFrom-Json } catch { $json = $null }
                    } else {
                        # Might already be a parsed object
                        $json = $resp
                    }
                }
                if (-not $json -or -not ($json.value)) {
                    Write-Host "Module REST returned no usable content; falling back to az rest for app lookup."
                    $respAz = Invoke-AzRest -Method GET -Uri $uri
                    if ($respAz -and $respAz.value -and $respAz.value.Count -gt 0) { $json = $respAz }
                }
                if ($json -and $json.value -and $json.value.Count -gt 0) {
                    $o = $json.value[0]
                    # Normalize into expected shape (Id, AppId, Web/Spa redirectUris)
                    $app = [PSCustomObject]@{
                        Id = $o.id
                        AppId = $o.appId
                        Web = @{ RedirectUris = @( ($o.spa.redirectUris -as [object[]]) + ($o.web.redirectUris -as [object[]]) ) }
                        AdditionalProperties = $o
                    }
                    Write-Host "Found application via Graph REST: appId=$($app.AppId) objectId=$($app.Id)"
                    $found = $true
                }
            } catch {
                Write-Host "Module REST lookup failed: $($_.Exception.Message)"
            }
        }

        # If not found by clientId, try to find by a known displayName
        if (-not $found) {
            Write-Host "No application found by clientId; trying to find existing application by displayName 'A-Riff-In-React SPA'..."
            if (Get-Command Invoke-MgGraphRequest -ErrorAction SilentlyContinue) {
                try {
                    $filter2 = "displayName eq 'A-Riff-In-React SPA'"
                    $enc2 = [System.Web.HttpUtility]::UrlEncode($filter2)
                    $uri2 = "https://graph.microsoft.com/v1.0/applications?`$filter=$enc2"
                    Write-Host "Querying Graph: $uri2"
                    $resp2 = Invoke-MgGraphRequest -Method GET -Uri $uri2 -ErrorAction SilentlyContinue
                    $json2 = $null
                    if ($resp2) {
                        if ($resp2 -is [string]) {
                            try { $json2 = $resp2 | ConvertFrom-Json } catch { $json2 = $null }
                        } elseif ($resp2.PSObject.Properties.Name -contains 'Content') {
                            try { $json2 = $resp2.Content | ConvertFrom-Json } catch { $json2 = $null }
                        } else { $json2 = $resp2 }
                    }
                    if (-not $json2 -or -not ($json2.value)) {
                        Write-Host "Module REST by displayName returned no usable content; falling back to az rest."
                        $respAz2 = Invoke-AzRest -Method GET -Uri $uri2
                        if ($respAz2 -and $respAz2.value -and $respAz2.value.Count -gt 0) { $json2 = $respAz2 }
                    }
                    if ($json2 -and $json2.value -and $json2.value.Count -gt 0) {
                        $o2 = $json2.value[0]
                        $app = [PSCustomObject]@{
                            Id = $o2.id
                            AppId = $o2.appId
                            Web = @{ RedirectUris = @( ($o2.spa.redirectUris -as [object[]]) + ($o2.web.redirectUris -as [object[]]) ) }
                            AdditionalProperties = $o2
                        }
                        Write-Host "Found application by displayName via Graph REST: appId=$($app.AppId) objectId=$($app.Id)"
                        $found = $true
                    }
                } catch {
                    Write-Host "Module REST lookup by displayName failed: $($_.Exception.Message)"
                }
            }
        }
    } catch {
        Write-Host "Module-backed lookup failed: $($_.Exception.Message)"
    }

    $redirectUris = @("http://localhost:5173", "https://a-riff-in-react.harryjamesgreenblatt.co")
    if (-not $app) {
        Write-Host "App registration not found via module. Creating..."
        if ($DryRun) {
            Write-Host "DryRun: would create application with redirectUris: $($redirectUris -join ', ')"
        } else {
            try {
                $newApp = New-MgApplication -DisplayName 'A-Riff-In-React SPA' -Web @{ RedirectUris = $redirectUris } -ErrorAction Stop
                $app = $newApp
                $ClientId = $app.AppId
                Write-Host "Created app registration with clientId: $ClientId (via module)"
            } catch {
                Write-Host "Module create failed: $($_.Exception.Message)"
            }
        }
    } else {
        Write-Host "App found via module. Ensuring redirect URIs are set..."
        if ($DryRun) { Write-Host "DryRun: would update application $($app.Id) redirectUris to: $($redirectUris -join ', ')" } else {
            try {
                Update-MgApplication -ApplicationId $app.Id -Web @{ RedirectUris = $redirectUris } -ErrorAction Stop
                Write-Host "Updated app redirect URIs via module."
            } catch { Write-Host "Failed to update application via module: $($_.Exception.Message)" }
        }
    }
}

# If module route didn't produce an app, try az rest fallback (this was previously working in your environment)
if (-not $app -and (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Falling back to az rest path for application lookup/creation."
    try {
        $filter = "appId eq '$ClientId'"
        $baseUri = "https://graph.microsoft.com/v1.0/applications"
        $filterParam = "`$filter=" + [System.Web.HttpUtility]::UrlEncode($filter)
        $uri = "$baseUri" + "?" + $filterParam
        $resp = Invoke-AzRest -Method GET -Uri $uri
        if ($resp.value -and $resp.value.Count -gt 0) { $app = $resp.value[0] }
        # If still not found by appId, try to find an application by displayName as a fallback
        if (-not $app) {
            Write-Host "No application found by clientId via az; trying displayName 'A-Riff-In-React SPA'..."
            $filter2 = "displayName eq 'A-Riff-In-React SPA'"
            $filterParam2 = "`$filter=" + [System.Web.HttpUtility]::UrlEncode($filter2)
            $uri2 = "$baseUri" + "?" + $filterParam2
            $resp2 = Invoke-AzRest -Method GET -Uri $uri2
            if ($resp2.value -and $resp2.value.Count -gt 0) { $app = $resp2.value[0] }
        }
    } catch { Write-Host "az rest lookup failed: $($_.Exception.Message)" }

    $redirectUris = @("http://localhost:5173", "https://a-riff-in-react.harryjamesgreenblatt.co")
    if (-not $app) {
        Write-Host "App registration not found (az path). Creating..."
        $body = @{ displayName = 'A-Riff-In-React SPA'; web = @{ redirectUris = $redirectUris } } | ConvertTo-Json -Depth 5
        if ($DryRun) { Write-Host "DryRun: would POST to applications with body: $body" } else {
            try { $newApp = Invoke-AzRest -Method POST -Uri "https://graph.microsoft.com/v1.0/applications" -Body $body; $app = $newApp; $ClientId = $app.appId; Write-Host "Created app registration with clientId: $ClientId (via az rest)" } catch { Write-Host "az rest create app failed: $($_.Exception.Message)" }
        }
    } else {
        Write-Host "App registration found via az. Ensuring redirect URIs are set..."
        $body = @{ web = @{ redirectUris = $redirectUris } } | ConvertTo-Json -Depth 3
        if ($DryRun) { Write-Host "DryRun: would PATCH application $($app.id) with body: $body" } else { try { Invoke-AzRest -Method PATCH -Uri "https://graph.microsoft.com/v1.0/applications/$($app.id)" -Body $body; Write-Host "Updated app redirect URIs via az rest." } catch { Write-Host "Failed to update app via az rest: $($_.Exception.Message)" } }
    }
}

# 2. Associate app registration with user flow
$userFlowAssociated = $false
# Try the module cmdlet first (if available)
if (Get-Command New-MgIdentityB2xUserFlowApplication -ErrorAction SilentlyContinue) {
    try {
        Write-Host "Associating app with user flow via Microsoft.Graph module..."
        if ($DryRun) { Write-Host "DryRun: would run New-MgIdentityB2xUserFlowApplication -UserFlowId $UserFlowId -AppId $ClientId" } else { New-MgIdentityB2xUserFlowApplication -UserFlowId $UserFlowId -AppId $ClientId -ErrorAction Stop }
        $userFlowAssociated = $true
        Write-Host "Associated app with user flow via module."
    } catch { Write-Host "Module attempt to associate app with user flow failed: $($_.Exception.Message)" }
}

# If module approach didn't run or failed, try secure az/Az fallback using $ref collection add
if (-not $userFlowAssociated) {
    # Determine application object id (object id) needed for $ref.
    $appObjectId = $null
    try {
        if (Get-Command Get-AzADApplication -ErrorAction SilentlyContinue) {
            $azApp = Get-AzApplicationByAppId -appId $ClientId
            if ($azApp) { $appObjectId = $azApp.Id }
        }
    } catch { Write-Host "Az lookup for application failed: $($_.Exception.Message)" }

    # If module earlier produced $app with Id use that
    if (-not $appObjectId -and $app -and $app.Id) { $appObjectId = $app.Id }

    # Prefer the service principal object id when referencing the app in collections that expect servicePrincipal references
    $spObjectId = $null
    try {
        if (Get-Command Get-AzADServicePrincipal -ErrorAction SilentlyContinue) {
            $azSp = Get-AzServicePrincipalByAppId -appId $ClientId
            if ($azSp) { $spObjectId = $azSp.Id }
        }
    } catch { Write-Host "Az lookup for service principal failed: $($_.Exception.Message)" }

    if (-not $appObjectId) { Write-Host "Unable to determine application object id to reference in user flow association; skipping association." }
    else {
        if (Get-Command Invoke-MgGraphRequest -ErrorAction SilentlyContinue) {
            try {
                Write-Host "Associating app with user flow via Microsoft.Graph module REST ($ref pattern)..."
                $uri = "https://graph.microsoft.com/beta/identity/b2xUserFlows/$UserFlowId/applications/`$ref"
                if ($spObjectId) {
                    $odataId = "https://graph.microsoft.com/v1.0/servicePrincipals/$spObjectId"
                } else {
                    $odataId = "https://graph.microsoft.com/v1.0/applications/$appObjectId"
                }
                $body = @{ "@odata.id" = $odataId }
                if ($DryRun) { Write-Host "DryRun: would POST $uri with body: $($body | ConvertTo-Json)" } else { Invoke-MgRest -Method POST -Uri $uri -Body $body }
                $userFlowAssociated = $true
                Write-Host "Associated app with user flow via module REST."
            } catch { Write-Host "Module REST attempt failed: $($_.Exception.Message)" }
        } elseif (Get-Command az -ErrorAction SilentlyContinue) {
            try {
                Write-Host "Falling back to az rest to associate app with user flow using $ref pattern..."
                $uri = "https://graph.microsoft.com/beta/identity/b2xUserFlows/$UserFlowId/applications/" + '$ref'
                $odataId = "https://graph.microsoft.com/v1.0/applications/$appObjectId"
                $body = @{ "@odata.id" = $odataId } | ConvertTo-Json -Depth 3
                if ($DryRun) { Write-Host "DryRun: would POST $uri with body: $body" } else { Invoke-AzRest -Method POST -Uri $uri -Body $body }
                $userFlowAssociated = $true
                Write-Host "Associated app with user flow via az rest."
            } catch { Write-Host "az rest attempt failed: $($_.Exception.Message)" }
        } else {
            Write-Host "No available method (module or az) to perform REST fallback; cannot associate app with user flow from this environment."
        }
    }
}

# 3. Configure Google as an identity provider
if (-not $skipGoogle) {
    $existingProvider = $null
    if (Get-Command Get-MgIdentityProvider -ErrorAction SilentlyContinue) {
        try { $existing = Get-MgIdentityProvider -Filter "displayName eq 'Google'" -ErrorAction SilentlyContinue; if ($existing) { $existingProvider = $existing[0] } } catch { Write-Host "Module lookup for identity provider failed: $($_.Exception.Message)" }
    }

    if (-not $existingProvider -and (Get-Command az -ErrorAction SilentlyContinue)) {
        try {
            $filter = "displayName eq 'Google'"
            $baseUri = "https://graph.microsoft.com/v1.0/identity/identityProviders"
            $filterParam = "`$filter=" + [System.Web.HttpUtility]::UrlEncode($filter)
            $uri = "$baseUri" + "?" + $filterParam
            $resp = Invoke-AzRest -Method GET -Uri $uri
            if ($resp.value -and $resp.value.Count -gt 0) { $existingProvider = $resp.value[0] }
        } catch { Write-Host "az rest lookup for identity providers failed: $($_.Exception.Message)" }
    }

    if ($existingProvider) {
        Write-Host "Google identity provider exists. Updating clientId/secret..."
        if ($DryRun) { Write-Host "DryRun: would update provider id $($existingProvider.id) with new client id/secret" } else {
            try {
                if (Get-Command Update-MgIdentityProvider -ErrorAction SilentlyContinue) {
                    Update-MgIdentityProvider -IdentityProviderId $existingProvider.Id -AdditionalProperties @{ clientId = $GoogleClientId; clientSecret = $GoogleClientSecret } -ErrorAction Stop
                    Write-Host "Updated Google provider via module."
                } else {
                    Invoke-AzRest -Method PATCH -Uri "https://graph.microsoft.com/beta/identity/identityProviders/$($existingProvider.id)" -Body (@{ clientId = $GoogleClientId; clientSecret = $GoogleClientSecret } | ConvertTo-Json)
                    Write-Host "Updated Google provider via az rest."
                }
            } catch { Write-Host "Failed to update Google provider: $($_.Exception.Message)" }
        }
    } else {
        Write-Host "Google identity provider not found. Creating..."
        if ($DryRun) { Write-Host "DryRun: would create Google identity provider with clientId <redacted>" } else {
            try {
                # Use explicit REST body to create the Google identity provider (beta endpoint).
                $providerBody = @{ displayName = 'Google'; identityProviderType = 'Google'; clientId = $GoogleClientId; clientSecret = $GoogleClientSecret }
                if ($DryRun) {
                    Write-Host "DryRun: would create identity provider with body: $($providerBody | ConvertTo-Json -Depth 5)"
                } else {
                    try {
                        if (Get-Command Invoke-MgGraphRequest -ErrorAction SilentlyContinue) {
                            Invoke-MgRest -Method POST -Uri "https://graph.microsoft.com/beta/identity/identityProviders" -Body $providerBody
                            Write-Host "Created Google provider via Microsoft.Graph REST."
                        } else {
                            Invoke-AzRest -Method POST -Uri "https://graph.microsoft.com/beta/identity/identityProviders" -Body ($providerBody | ConvertTo-Json -Depth 5)
                            Write-Host "Created Google provider via az rest."
                        }
                    } catch { Write-Host "Failed to create Google provider: $($_.Exception.Message)" }
                }
            } catch { Write-Host "Failed to create Google provider: $($_.Exception.Message)" }
        }
    }
} else {
    Write-Host "Skipping Google identity provider configuration (no credentials provided)."
}

Write-Host "✅ Entra External ID setup complete."