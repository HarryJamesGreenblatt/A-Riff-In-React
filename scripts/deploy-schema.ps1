#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    Deploys schema changes to Azure SQL Database
.DESCRIPTION
    Fetches SQL admin credentials from Key Vault and applies api/schema.sql to production database.
    Safe to run multiple times - schema.sql is idempotent.
.PARAMETER KeyVaultName
    Name of the Key Vault containing SQL credentials (default: kv-a-riff-in-react)
.PARAMETER SecretName
    Name of the connection string secret (default: SQL-CONNECTION-STRING)
.PARAMETER SchemaFile
    Path to schema SQL file (default: ../api/schema.sql)
.PARAMETER AutoApprove
    If set, skip the interactive confirmation prompt and run non-interactively.
.EXAMPLE
    .\scripts\deploy-schema.ps1
    Applies schema using default Key Vault and schema file
.EXAMPLE
    .\scripts\deploy-schema.ps1 -KeyVaultName "my-kv" -SchemaFile "custom-schema.sql"
    Uses custom Key Vault and schema file
.EXAMPLE
    .\scripts\deploy-schema.ps1 -AutoApprove
    Runs non-interactively and applies schema immediately
#>

param(
    [string]$KeyVaultName = "kv-a-riff-in-react",
    [string]$SecretName = "SQL-CONNECTION-STRING",
    [string]$SchemaFile = "$PSScriptRoot/../api/schema.sql",
    [switch]$AutoApprove
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Color output helpers
function Write-Success { Write-Host "? $args" -ForegroundColor Green }
function Write-Info { Write-Host "??  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "??  $args" -ForegroundColor Yellow }
function Write-Failure { Write-Host "? $args" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Azure SQL Schema Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Info "Checking prerequisites..."

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Failure "Azure CLI is not installed. Please install it from: https://aka.ms/azure-cli"
    exit 1
}

# Check if sqlcmd is installed
if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    Write-Failure "sqlcmd is not installed."
    Write-Host ""
    Write-Host "To install sqlcmd:" -ForegroundColor Yellow
    Write-Host "  Windows: Download from https://aka.ms/sqlcmd" -ForegroundColor Yellow
    Write-Host "  Linux:   sudo apt-get install mssql-tools" -ForegroundColor Yellow
    Write-Host "  macOS:   brew install sqlcmd" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if schema file exists
if (-not (Test-Path $SchemaFile)) {
    Write-Failure "Schema file not found: $SchemaFile"
    exit 1
}

Write-Success "Prerequisites OK"
Write-Host ""

# Check Azure login
Write-Info "Checking Azure authentication..."
try {
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Warning "Not logged in to Azure. Running 'az login'..."
        az login
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "Azure login failed"
            exit 1
        }
    }
    Write-Success "Logged in as: $($account.user.name)"
    Write-Info "Subscription: $($account.name) ($($account.id))"
} catch {
    Write-Failure "Failed to check Azure authentication: $_"
    exit 1
}
Write-Host ""

# Fetch connection string from Key Vault
Write-Info "Fetching SQL credentials from Key Vault: $KeyVaultName"
try {
    $secretJson = az keyvault secret show `
        --vault-name $KeyVaultName `
        --name $SecretName `
        --query value `
        -o json 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Failure "Failed to fetch Key Vault secret. Possible reasons:"
        Write-Host "  • Key Vault '$KeyVaultName' doesn't exist" -ForegroundColor Yellow
        Write-Host "  • Secret '$SecretName' doesn't exist" -ForegroundColor Yellow
        Write-Host "  • You don't have 'Get' permission on secrets" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To grant yourself access:" -ForegroundColor Cyan
        Write-Host "  az keyvault set-policy --name $KeyVaultName --upn YOUR_EMAIL --secret-permissions get" -ForegroundColor Cyan
        Write-Host ""
        exit 1
    }

    $connectionString = $secretJson | ConvertFrom-Json
    Write-Success "Retrieved connection string from Key Vault"
} catch {
    Write-Failure "Error retrieving Key Vault secret: $_"
    exit 1
}

# Parse connection string
Write-Info "Parsing connection details..."
try {
    # Normalize the connection string (remove enclosing quotes if any)
    $rawConn = $connectionString -as [string]
    $rawConn = $rawConn.Trim('"')

    # Try several common key names for server
    if ($rawConn -match 'Server\s*=\s*([^;,]+)') {
        $server = $matches[1].Trim()
    } elseif ($rawConn -match 'Data Source\s*=\s*([^;,]+)') {
        $server = $matches[1].Trim()
    } elseif ($rawConn -match 'Server\s*:|Data Source\s*:') {
        # fallback - not common
        $server = $null
    }

    # Remove tcp: prefix and optional port from server
    if ($server) {
        $server = $server -replace '^tcp:', ''
        $server = $server -replace ',\d+$', ''
    }

    # Try several common key names for database
    if ($rawConn -match 'Database\s*=\s*([^;,]+)') {
        $database = $matches[1].Trim()
    } elseif ($rawConn -match 'Initial Catalog\s*=\s*([^;,]+)') {
        $database = $matches[1].Trim()
    } elseif ($rawConn -match 'InitialCatalog\s*=\s*([^;,]+)') {
        $database = $matches[1].Trim()
    }

    # Try several common key names for user
    if ($rawConn -match '(User\s*Id|User|Uid)\s*=\s*([^;,]+)') {
        $user = $matches[2].Trim()
    }
    # Try several common key names for password
    if ($rawConn -match 'Password\s*=\s*([^;,]+)') {
        $password = $matches[1].Trim()
    }

    if (-not $server -or -not $database -or -not $user -or -not $password) {
        Write-Failure "Failed to parse connection string. Parsed values: server=$server, database=$database, user=$user"
        Write-Host "Raw connection string (hidden by default). If you want to debug, run:" -ForegroundColor Yellow
        Write-Host "  az keyvault secret show --vault-name $KeyVaultName --name $SecretName --query value -o tsv" -ForegroundColor Cyan
        exit 1
    }

    Write-Success "Connection details parsed"
    Write-Info "Server:   $server"
    Write-Info "Database: $database"
    Write-Info "User:     $user"
} catch {
    Write-Failure "Error parsing connection string: $_"
    exit 1
}
Write-Host ""

# Confirm deployment
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  READY TO DEPLOY SCHEMA" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Schema file: " -NoNewline
Write-Host $SchemaFile -ForegroundColor Cyan
Write-Host "Target:      " -NoNewline
Write-Host "$server / $database" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will apply the schema changes in $SchemaFile" -ForegroundColor Yellow
Write-Host "The schema is idempotent (safe to run multiple times)." -ForegroundColor Green
Write-Host ""

if (-not $AutoApprove) {
    $confirmation = Read-Host "Continue? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Warning "Deployment cancelled by user"
        exit 0
    }
} else {
    Write-Info "AutoApprove set: proceeding without confirmation"
}
Write-Host ""

# Apply schema
Write-Info "Applying schema to database..."
Write-Host ""

try {
    # Preprocess schema: remove any CREATE DATABASE / USE blocks that try to switch DBs (Azure SQL doesn't allow USE)
    $rawSql = Get-Content -Raw -Path $SchemaFile

    # Remove IF NOT EXISTS ... CREATE DATABASE ... END ... GO blocks that reference ARiffInReact
    $patternCreateDb = "(?is)IF\s+NOT\s+EXISTS\s*\(SELECT\s+\*\s+FROM\s+sys\.databases\s+WHERE\s+name\s*=\s*'ARiffInReact'\).*?GO\s*"
    $processedSql = [regex]::Replace($rawSql, $patternCreateDb, '')

    # Remove explicit USE ARiffInReact; GO sequences
    $processedSql = [regex]::Replace($processedSql, "(?i)USE\s+ARiffInReact\s*;\s*GO\s*", '')

    # Write processed SQL to a temp file
    $tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
    Set-Content -Path $tempFile -Value $processedSql -Encoding UTF8

    Write-Info "Executing processed schema SQL file: $tempFile"

    # Run sqlcmd against the target database using processed SQL
    $sqlcmdArgs = @(
        "-S", $server,
        "-d", $database,
        "-U", $user,
        "-P", $password,
        "-i", $tempFile,
        "-b"  # Exit with error code on failure
    )

    $output = & sqlcmd @sqlcmdArgs 2>&1
    $exitCode = $LASTEXITCODE

    # Remove temp file
    Remove-Item -Path $tempFile -ErrorAction SilentlyContinue

    # Display output
    if ($output) {
        Write-Host "--- SQL Output ---" -ForegroundColor DarkGray
        Write-Host $output
        Write-Host "--- End Output ---" -ForegroundColor DarkGray
        Write-Host ""
    }

    if ($exitCode -ne 0) {
        Write-Failure "Schema deployment failed (exit code: $exitCode)"
        exit $exitCode
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Success "SCHEMA DEPLOYED SUCCESSFULLY"
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Info "Database: $database"
    Write-Info "Changes applied from: $SchemaFile"
    Write-Host ""
    Write-Success "The 'phone' column has been added to the Users table"
    Write-Success "Registration and phone collection should now work end-to-end"
    Write-Host ""

} catch {
    Write-Failure "Error running sqlcmd: $_"
    exit 1
}

# Verify schema (optional quick check)
Write-Info "Verifying 'phone' column exists..."
try {
    $verifyQuery = "SELECT COUNT(*) as HasPhone FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'phone'"
    $verifyResult = & sqlcmd -S $server -d $database -U $user -P $password -Q $verifyQuery -h -1 2>&1
    
    if ($verifyResult -match '^\s*1\s*$') {
        Write-Success "Verified: 'phone' column exists in Users table"
    } else {
        Write-Warning "Could not verify 'phone' column (this may be normal)"
    }
} catch {
    Write-Warning "Could not verify schema (this may be normal)"
}

Write-Host ""
Write-Info "Next steps:"
Write-Host "  1. Test registration: " -NoNewline -ForegroundColor Cyan
Write-Host ".\scripts\test-registration.ps1" -ForegroundColor White
Write-Host "  2. Test phone collection in the UI" -ForegroundColor Cyan
Write-Host ""
