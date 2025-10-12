# Infrastructure Migration Status Report

**Date**: October 12, 2025  
**Migration**: MSAL/Entra External ID ? JWT Authentication

## ?? Current State Analysis

### What's Deployed in Azure (October 1, 2025 deployment)

```
riffinreact-rg/
??? ca-api-a-riff-in-react (Container App) ? OUTDATED
?   ??? Environment Variables:
?       ??? EXTERNAL_TENANT_ID=813307d1-6d39-4c75-8a38-2e34128203bc ?
?       ??? EXTERNAL_CLIENT_ID=8e217770-697f-497e-b30b-27b214e87db1 ?
?       ??? SQL_SERVER=sequitur-sql-server.database.windows.net ?
?       ??? SQL_DATABASE=riff-react-db ?
?       ??? NODE_ENV=production ?
?
??? swa-a-riff-in-react (Static Web App) ?
??? env-a-riff-in-react (Container App Environment) ?
??? id-a-riff-in-react (Managed Identity) ?
??? cosmos-a-riff-in-react (Cosmos DB) ?
??? ariffreactacr (Container Registry) ?
??? log-a-riff-in-react (Log Analytics) ?
??? appi-a-riff-in-react (Application Insights) ?
```

### What's in Code (Current State)

#### ? Bicep Template (`infra/main.bicep`)
- **Status**: READY FOR JWT
- Contains JWT parameters (`jwtSecret`, `corsOrigins`)
- NO Entra External ID parameters
- Correct environment variables for JWT auth

#### ? GitHub Workflow (`.github/workflows/container-deploy.yml`)
- **Status**: NEEDS UPDATE
- Still passing `externalTenantId` parameter
- Still passing `externalClientId` parameter
- Missing `jwtSecret` parameter

#### ?? GitHub Secrets
- **Status**: INCOMPLETE
- Has: `EXTERNAL_TENANT_ID`, `EXTERNAL_CLIENT_ID` (obsolete)
- Missing: `JWT_SECRET` (required)

## ?? Issues Found

### Issue 1: Workflow/Template Mismatch
**Problem**: Workflow passes parameters that Bicep template doesn't accept

**Evidence**:
```yaml
# .github/workflows/container-deploy.yml (lines 119-125)
parameters: >
  externalTenantId=${{ secrets.EXTERNAL_TENANT_ID }}    ? NOT IN BICEP
  externalClientId=${{ secrets.EXTERNAL_CLIENT_ID }}    ? NOT IN BICEP
  jwtSecret=${{ secrets.JWT_SECRET }}                   ? SECRET DOESN'T EXIST
```

**Bicep template expects**:
```bicep
param jwtSecret string
param corsOrigins string
// NO externalTenantId
// NO externalClientId
```

**Impact**: Next deployment will fail with "parameter not found" error

### Issue 2: Missing JWT_SECRET
**Problem**: GitHub secret `JWT_SECRET` does not exist

**Evidence**: Not in GitHub Secrets (need to verify with `gh secret list`)

**Impact**: Deployment will fail even after workflow is fixed

### Issue 3: Deployed Container App Has Stale Config
**Problem**: Currently running Container App has Entra External ID config

**Evidence**:
```json
{
  "name": "EXTERNAL_TENANT_ID",
  "value": "813307d1-6d39-4c75-8a38-2e34128203bc"
},
{
  "name": "EXTERNAL_CLIENT_ID",
  "value": "8e217770-697f-497e-b30b-27b214e87db1"
}
```

**Impact**: App code trying to use JWT auth will find wrong environment variables

## ? Action Plan

### Step 1: Verify GitHub Secrets (IMMEDIATE)
```bash
# List all secrets
gh secret list --repo HarryJamesGreenblatt/A-Riff-In-React

# Check if JWT_SECRET exists
```

### Step 2: Create JWT_SECRET if Missing (IMMEDIATE)
```bash
# Generate secure 256-bit secret
openssl rand -base64 32

# Add to GitHub Secrets
gh secret set JWT_SECRET --repo HarryJamesGreenblatt/A-Riff-In-React
# (paste the generated secret)
```

### Step 3: Update GitHub Workflow (IMMEDIATE)
**File**: `.github/workflows/container-deploy.yml`

**Change lines 119-132 from:**
```yaml
parameters: >
  environmentName=${{ env.ENVIRONMENT_NAME }}
  location=${{ env.LOCATION }}
  containerImage=${{ env.ACR_NAME }}.azurecr.io/a-riff-in-react-api:latest
  containerRegistry=${{ env.ACR_NAME }}.azurecr.io
  containerRegistryUsername=${{ env.ACR_USERNAME }}
  containerRegistryPassword=${{ env.ACR_PASSWORD }}
  externalTenantId=${{ secrets.EXTERNAL_TENANT_ID }}      ? REMOVE
  externalClientId=${{ secrets.EXTERNAL_CLIENT_ID }}      ? REMOVE
  jwtSecret=${{ secrets.JWT_SECRET }}
  corsOrigins=${{ env.CORS_ORIGINS }}
  existingSqlServerName=${{ env.EXISTING_SQL_SERVER_NAME }}
  existingSqlServerResourceGroup=${{ env.EXISTING_SQL_SERVER_RG }}
  existingSqlDatabaseName=${{ env.EXISTING_SQL_DATABASE_NAME }}
  existingCosmosDbAccountName=${{ env.EXISTING_COSMOS_DB_NAME }}
  existingCosmosDbResourceGroup=${{ env.EXISTING_COSMOS_DB_RG }}
```

**To:**
```yaml
parameters: >
  environmentName=${{ env.ENVIRONMENT_NAME }}
  location=${{ env.LOCATION }}
  containerImage=${{ env.ACR_NAME }}.azurecr.io/a-riff-in-react-api:latest
  containerRegistry=${{ env.ACR_NAME }}.azurecr.io
  containerRegistryUsername=${{ env.ACR_USERNAME }}
  containerRegistryPassword=${{ env.ACR_PASSWORD }}
  jwtSecret=${{ secrets.JWT_SECRET }}                     ? KEEP
  corsOrigins=${{ env.CORS_ORIGINS }}
  existingSqlServerName=${{ env.EXISTING_SQL_SERVER_NAME }}
  existingSqlServerResourceGroup=${{ env.EXISTING_SQL_SERVER_RG }}
  existingSqlDatabaseName=${{ env.EXISTING_SQL_DATABASE_NAME }}
  existingCosmosDbAccountName=${{ env.EXISTING_COSMOS_DB_NAME }}
  existingCosmosDbResourceGroup=${{ env.EXISTING_COSMOS_DB_RG }}
```

### Step 4: Verify Cosmos DB Configuration (IMMEDIATE)
```bash
# Check if Cosmos DB exists and is configured correctly
az cosmosdb show \
  --name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --query "{Name:name, Location:location, DatabaseAccountOfferType:databaseAccountOfferType}"

# Check if database exists
az cosmosdb sql database show \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --name ARiffInReact

# If database doesn't exist, create it
az cosmosdb sql database create \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --name ARiffInReact
```

### Step 5: Update SQL Database Schema (SOON)
**File**: `api/schema.sql`

Ensure Users table has JWT-compatible schema:
```sql
CREATE TABLE Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    passwordHash NVARCHAR(255) NOT NULL,  -- For bcrypt hashes
    name NVARCHAR(255),
    role NVARCHAR(50) DEFAULT 'member',
    emailVerified BIT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 DEFAULT GETUTCDATE()
)

CREATE INDEX IX_Users_Email ON Users(email)
```

### Step 6: Commit and Deploy (NEXT)
```bash
# Commit workflow changes
git add .github/workflows/container-deploy.yml
git commit -m "fix: update workflow to use JWT authentication parameters

- Remove obsolete externalTenantId and externalClientId parameters
- Workflow now matches updated Bicep template
- Prepares for JWT authentication deployment"

# Push to trigger deployment
git push origin main
```

### Step 7: Verify Deployment (AFTER PUSH)
```bash
# Watch deployment
gh run watch

# After success, verify Container App environment
az containerapp show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query "properties.template.containers[0].env" \
  -o table

# Should show:
# JWT_SECRET (from secret)
# JWT_EXPIRY=7d
# CORS_ORIGINS=...
# NO EXTERNAL_TENANT_ID
# NO EXTERNAL_CLIENT_ID
```

### Step 8: Clean Up Old Secrets (OPTIONAL)
```bash
# After deployment succeeds, remove obsolete secrets
gh secret delete EXTERNAL_TENANT_ID --repo HarryJamesGreenblatt/A-Riff-In-React
gh secret delete EXTERNAL_CLIENT_ID --repo HarryJamesGreenblatt/A-Riff-In-React
gh secret delete GOOGLE_CLIENT_ID --repo HarryJamesGreenblatt/A-Riff-In-React
gh secret delete GOOGLE_CLIENT_SECRET --repo HarryJamesGreenblatt/A-Riff-In-React
```

## ?? Pre-Flight Checklist

Before deploying infrastructure changes:

- [ ] JWT_SECRET exists in GitHub Secrets
- [ ] Workflow updated to remove Entra parameters
- [ ] Cosmos DB database created (ARiffInReact)
- [ ] SQL schema includes Users table with passwordHash
- [ ] CORS_ORIGINS environment variable set correctly
- [ ] Bicep template reviewed and ready (already done)
- [ ] All changes committed to main branch

## ?? Success Criteria

Infrastructure migration is complete when:

- [ ] Deployment succeeds without errors
- [ ] Container App environment variables show JWT_SECRET (not EXTERNAL_*)
- [ ] Health endpoint returns { "authStrategy": "JWT" }
- [ ] CORS configuration shows specific origins (not wildcard)
- [ ] No Entra/External ID references in deployed resources
- [ ] Container App runs successfully with new configuration

## ?? Rollback Plan

If deployment fails:

**Option 1: Revert commit**
```bash
git revert HEAD
git push origin main
```

**Option 2: Manual Portal fix** (if only env vars need changing)
1. Azure Portal ? Container App
2. Revision Management ? Create new revision
3. Update environment variables
4. Activate revision

## ?? Template Perspective

From a template client's perspective, this infrastructure should:

? Deploy with 3 configuration values:
- `JWT_SECRET` (generated)
- `CORS_ORIGINS` (their domain)
- `SQL_ADMIN_PASSWORD` (their password)

? Should NOT require:
- Azure AD app registration
- B2C tenant creation
- User flow configuration
- Identity provider setup
- Portal clicking

**This migration enables that goal.**

---

**Next Actions**:
1. Run `gh secret list` to verify JWT_SECRET status
2. If missing, generate and add JWT_SECRET
3. Update workflow to remove Entra parameters
4. Deploy and verify

**Ready to proceed?**
