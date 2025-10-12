# Infrastructure Migration: MSAL ? JWT Authentication

**Date**: October 12, 2025  
**Status**: Ready for Deployment Testing

## ?? Overview

This document tracks the infrastructure changes required to support the migration from MSAL/Entra External ID to JWT-based authentication.

## ? Changes Completed

### 1. Bicep Template (`infra/main.bicep`)

**Removed:**
- ? `externalTenantId` parameter
- ? `externalClientId` parameter
- ? `EXTERNAL_TENANT_ID` environment variable
- ? `EXTERNAL_CLIENT_ID` environment variable

**Added:**
- ? `jwtSecret` parameter (secure)
- ? `corsOrigins` parameter with proper configuration
- ? `JWT_SECRET` environment variable (from secret)
- ? `JWT_EXPIRY` environment variable (7d default)
- ? `CORS_ORIGINS` environment variable
- ? Cosmos DB parameters and configuration
- ? Proper CORS policy with specific origins
- ? Static Web App resource definition
- ? Application Insights resource (not just reference)

**Updated:**
- ? CORS policy from wildcard (`*`) to specific origins
- ? Added proper CORS methods and headers
- ? Tags include `authStrategy: 'JWT'`
- ? Environment variables for JWT authentication

### 2. GitHub Actions Workflow (`.github/workflows/container-deploy.yml`)

**Removed:**
- ? `externalTenantId` parameter
- ? `externalClientId` parameter
- ? References to Entra External ID secrets

**Added:**
- ? `jwtSecret` parameter from GitHub Secrets
- ? `corsOrigins` parameter from environment variable
- ? Cosmos DB parameters

**Updated:**
- ? Deployment parameters now JWT-focused
- ? CORS configuration for localhost + production

## ?? Action Items Required

### IMMEDIATE: Before Next Deployment

#### 1. Create JWT_SECRET GitHub Secret ?? **REQUIRED**

```bash
# Generate a secure 256-bit secret
openssl rand -base64 32

# Add to GitHub Secrets
gh secret set JWT_SECRET --repo HarryJamesGreenblatt/A-Riff-In-React
# Paste the generated secret when prompted
```

**Alternative (PowerShell):**
```powershell
# Generate secure random string
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
Write-Host $secret

# Then add to GitHub manually or via gh CLI
gh secret set JWT_SECRET --repo HarryJamesGreenblatt/A-Riff-In-React
```

#### 2. Verify Cosmos DB Exists

```bash
# Check if Cosmos DB account exists
az cosmosdb show \
  --name cosmos-a-riff-in-react \
  --resource-group db-rg

# If not, create it
az cosmosdb create \
  --name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --locations regionName=westus failoverPriority=0 isZoneRedundant=False \
  --default-consistency-level Session

# Create database
az cosmosdb sql database create \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --name ARiffInReact

# Create container for activities
az cosmosdb sql container create \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --database-name ARiffInReact \
  --name activities \
  --partition-key-path "/userId" \
  --throughput 400
```

#### 3. Verify SQL Database Schema

Ensure the Users table exists with the correct schema for JWT auth:

```sql
-- Connect to riff-react-db on sequitur-sql-server
-- Execute this schema:

CREATE TABLE Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    passwordHash NVARCHAR(255) NOT NULL,
    name NVARCHAR(255),
    role NVARCHAR(50) DEFAULT 'member',
    emailVerified BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE()
)

CREATE INDEX IX_Users_Email ON Users(email)
```

### OPTIONAL: Clean Up Old Secrets

These secrets are **no longer used** and can be deleted:

```bash
# Delete obsolete Entra/OAuth secrets
gh secret delete EXTERNAL_CLIENT_ID --repo HarryJamesGreenblatt/A-Riff-In-React
gh secret delete EXTERNAL_TENANT_ID --repo HarryJamesGreenblatt/A-Riff-In-React
gh secret delete GOOGLE_CLIENT_ID --repo HarryJamesGreenblatt/A-Riff-In-React
gh secret delete GOOGLE_CLIENT_SECRET --repo HarryJamesGreenblatt/A-Riff-In-React
gh secret delete ENTRA_CLIENT_ID --repo HarryJamesGreenblatt/A-Riff-In-React
gh secret delete ENTRA_TENANT_ID --repo HarryJamesGreenblatt/A-Riff-In-React
```

**Keep these secrets** (still needed):
- `AZURE_CREDENTIALS` - Service principal for deployment
- `AZURE_SUBSCRIPTION_ID` - Azure subscription
- `SQL_ADMIN_PASSWORD` - SQL Server admin password
- `STATIC_WEB_APPS_API_TOKEN` - Static Web App deployment
- `JWT_SECRET` - **NEW** - For signing JWT tokens

## ?? Infrastructure Changes Summary

### Before (MSAL/Entra External ID)
```
Container App Environment Variables:
?? EXTERNAL_TENANT_ID=<tenant-id>
?? EXTERNAL_CLIENT_ID=<client-id>
?? SQL_SERVER=<sql-server>
?? SQL_DATABASE=<database>

CORS: * (wildcard - insecure)

GitHub Secrets Required:
?? EXTERNAL_TENANT_ID
?? EXTERNAL_CLIENT_ID
?? GOOGLE_CLIENT_ID
?? GOOGLE_CLIENT_SECRET
```

### After (JWT Authentication)
```
Container App Environment Variables:
?? JWT_SECRET=<secret> (from secret)
?? JWT_EXPIRY=7d
?? SQL_SERVER_ENDPOINT=<sql-server>
?? SQL_DATABASE_NAME=<database>
?? COSMOS_ENDPOINT=<cosmos-endpoint>
?? COSMOS_DATABASE_NAME=ARiffInReact
?? MANAGED_IDENTITY_CLIENT_ID=<identity>
?? CORS_ORIGINS=<allowed-origins>

CORS: Specific origins only (secure)

GitHub Secrets Required:
?? JWT_SECRET
```

## ?? Deployment Checklist

Before deploying the updated infrastructure:

- [ ] **Generate and set JWT_SECRET** in GitHub Secrets
- [ ] **Verify Cosmos DB exists** in db-rg resource group
- [ ] **Verify SQL Database schema** has Users table with passwordHash column
- [ ] **Review CORS origins** in workflow (update if needed)
- [ ] **Commit Bicep and workflow changes** to main branch
- [ ] **Monitor deployment** via GitHub Actions
- [ ] **Test health endpoint** after deployment
- [ ] **Verify environment variables** in Container App
- [ ] **Clean up old secrets** (optional)

## ?? Post-Deployment Verification

After successful deployment, verify:

### 1. Container App Configuration

```bash
# Get Container App environment variables
az containerapp show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query 'properties.template.containers[0].env' \
  -o table

# Should show:
# - JWT_SECRET (from secret)
# - JWT_EXPIRY=7d
# - CORS_ORIGINS=<your-origins>
# - No EXTERNAL_TENANT_ID
# - No EXTERNAL_CLIENT_ID
```

### 2. CORS Configuration

```bash
# Get CORS policy
az containerapp show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query 'properties.configuration.ingress.corsPolicy' \
  -o json

# Should show specific origins, NOT wildcard
```

### 3. Health Endpoint

```bash
# Test health endpoint
curl https://<your-container-app-url>/health

# Should return 200 OK with:
{
  "status": "healthy",
  "authStrategy": "JWT",
  "timestamp": "2025-10-12T..."
}
```

### 4. Managed Identity Permissions

```bash
# Verify SQL Database role assignment
az sql db show \
  --name riff-react-db \
  --server sequitur-sql-server \
  --resource-group db-rg

# Verify Cosmos DB role assignment
az cosmosdb sql role assignment list \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg
```

## ?? Rollback Plan

If deployment fails or issues arise:

### Option 1: Revert to Previous Commit

```bash
# Revert infrastructure changes
git revert HEAD
git push origin main

# GitHub Actions will deploy the previous version
```

### Option 2: Manual Fix in Azure Portal

If only environment variables need adjustment:

1. Navigate to Container App in Azure Portal
2. Go to "Revision management" ? "Create new revision"
3. Update environment variables
4. Activate new revision

## ?? Infrastructure Cost Impact

### Before (MSAL/Entra External ID)
- Container Apps: ~$0 (consumption tier)
- Azure SQL: Shared server cost
- **External ID tenant**: Would have been free <50K users, but required manual setup

### After (JWT Authentication)
- Container Apps: ~$0 (consumption tier)
- Azure SQL: Shared server cost
- Cosmos DB: ~$0.25/day (400 RU/s)
- **Total additional cost**: ~$7.50/month for Cosmos DB

**Cost Savings:**
- No separate B2C/External ID tenant management
- No time spent on Portal configuration (worth $$$ in developer time)

## ?? Template Client Experience

### What Clients Need to Configure

**Minimum (3 variables):**
```bash
JWT_SECRET=<generate-with-openssl>
SQL_ADMIN_PASSWORD=<secure-password>
CORS_ORIGINS=https://your-domain.com
```

**Optional (customization):**
```bash
JWT_EXPIRY=7d  # Or different duration
ENVIRONMENT_NAME=your-app-name
LOCATION=your-region
```

### What Clients DON'T Need to Configure

- ? No Azure AD app registration
- ? No B2C tenant creation
- ? No user flows
- ? No identity provider setup
- ? No redirect URI configuration
- ? No Portal clicking

## ? Success Metrics

Infrastructure migration is successful when:

- [x] Bicep template updated with JWT parameters
- [x] GitHub workflow updated with JWT deployment
- [ ] JWT_SECRET created in GitHub Secrets
- [ ] Cosmos DB verified/created
- [ ] SQL schema updated for JWT auth
- [ ] Deployment succeeds without errors
- [ ] Health endpoint returns JWT auth strategy
- [ ] CORS works with specific origins (not wildcard)
- [ ] Container App shows correct environment variables
- [ ] No references to Entra/External ID in deployed resources

---

**Next Steps**: Once infrastructure changes are deployed and verified, proceed with implementing the JWT authentication endpoints in the API code.
