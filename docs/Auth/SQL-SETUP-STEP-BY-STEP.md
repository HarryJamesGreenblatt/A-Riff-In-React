# ?? Database Setup Guide

**Status**: Automated via GitHub Actions  
**Last Updated**: December 2024

---

## Overview

Database setup is **fully automated** through the GitHub Actions CI/CD pipeline. This guide explains how it works and what to do if manual intervention is needed.

---

## ?? Automated Setup (Default)

### What Happens Automatically

When you push to `main` branch, the workflow (`.github/workflows/container-deploy.yml`) automatically:

1. **Creates/updates infrastructure** (Container Apps, Managed Identity)
2. **Grants SQL permissions** to the Container App's managed identity
3. **Deploys database schema** from `scripts/deploy-database.sql`
4. **Verifies deployment** with health checks

**No manual steps required!**

---

## ?? Database Schema

### Users Table
```sql
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NULL,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'member',
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

### Connection Details
- **Server**: `sequitur-sql-server.database.windows.net`
- **Database**: `riff-react-db`
- **Managed Identity**: `6b3d9f97-b02a-44d9-bace-253cd5efb20a`

---

## ?? Manual Setup (If Automated Fails)

### When Manual Setup is Needed

If the GitHub Actions workflow shows:
```
??  AUTOMATED SETUP FAILED - MANUAL SETUP REQUIRED
```

This means the GitHub service principal doesn't have SQL admin permissions.

### One-Time Manual Setup

#### Option 1: Azure Cloud Shell (Recommended)

```bash
# 1. Open Azure Cloud Shell
https://shell.azure.com

# 2. Connect to database
sqlcmd -S sequitur-sql-server.database.windows.net -d riff-react-db -G

# 3. Run these commands
CREATE USER [6b3d9f97-b02a-44d9-bace-253cd5efb20a] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [6b3d9f97-b02a-44d9-bace-253cd5efb20a];
ALTER ROLE db_datawriter ADD MEMBER [6b3d9f97-b02a-44d9-bace-253cd5efb20a];
GO

# 4. Deploy schema
:r scripts/deploy-database.sql
GO
```

#### Option 2: Grant GitHub SP SQL Admin Access

To enable fully automated setup for all future deployments:

```bash
az sql server ad-admin create \
  --server sequitur-sql-server \
  --resource-group db-rg \
  --display-name 'GitHub Actions SP' \
  --object-id $(az ad sp list --display-name 'GitHub Actions' --query '[0].id' -o tsv)
```

After this, re-run the GitHub Actions workflow - it will succeed automatically.

---

## ?? Adding Schema Changes

### Step 1: Edit the Deployment Script

Edit `scripts/deploy-database.sql` with your changes:

```sql
-- Example: Adding a new column
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'phoneNumber')
BEGIN
    PRINT '  Adding phoneNumber column...';
    ALTER TABLE Users ADD phoneNumber NVARCHAR(20) NULL;
    PRINT '  ? phoneNumber column added';
END
```

**Always use idempotent checks** (`IF NOT EXISTS`) so the script is safe to run multiple times.

### Step 2: Deploy

```bash
git add scripts/deploy-database.sql
git commit -m "Add phoneNumber column to Users table"
git push origin main
```

GitHub Actions will automatically apply your changes!

### Step 3: Test Locally First (Optional)

Before committing, test in Azure Cloud Shell:

```bash
sqlcmd -S sequitur-sql-server.database.windows.net -d riff-react-db -G
:r scripts/deploy-database.sql
GO
```

---

## ?? Verifying Database State

### Check Tables

```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

### Check Users Table Schema

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users'
ORDER BY ORDINAL_POSITION;
```

### Check Managed Identity Permissions

```sql
-- Check if managed identity exists
SELECT name, type_desc 
FROM sys.database_principals
WHERE name = '6b3d9f97-b02a-44d9-bace-253cd5efb20a';

-- Check role memberships
SELECT dp.name AS RoleName
FROM sys.database_role_members drm
INNER JOIN sys.database_principals dp ON drm.role_principal_id = dp.principal_id
INNER JOIN sys.database_principals member ON drm.member_principal_id = member.principal_id
WHERE member.name = '6b3d9f97-b02a-44d9-bace-253cd5efb20a';
```

---

## ??? Troubleshooting

### Application Can't Connect to Database

**Check Container App environment variables:**
```bash
az containerapp show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query properties.configuration.secrets
```

Should include:
- `SQL_SERVER`: sequitur-sql-server.database.windows.net
- `SQL_DATABASE`: riff-react-db
- `USE_AZURE_AUTH`: true

### Workflow Shows Permission Errors

Follow the manual setup steps above, or grant GitHub SP SQL admin access.

### Need to Rollback a Change

```bash
git revert HEAD
git push origin main
```

The workflow will deploy the previous version of the schema.

---

## ?? Files

### Used by CI/CD
- ? `scripts/deploy-database.sql` - Main schema deployment
- ? `.github/workflows/container-deploy.yml` - Orchestrates deployment

### Removed (no longer needed)
- ? All manual `setup-*.ps1` scripts
- ? All `check-*.sql` debugging scripts
- ? PowerShell-based setup tools

**Use Azure Portal, Azure Data Studio, or Cloud Shell for manual checks instead.**

---

## ? Summary

**Default Flow:**
1. Edit `scripts/deploy-database.sql`
2. Commit and push to `main`
3. ? Automatic deployment!

**Benefits:**
- ?? Version controlled schema
- ?? Repeatable deployments
- ??? Idempotent migrations
- ?? Team-friendly workflow

---

**Status**: ? Fully Automated  
**Next Steps**: Just push to main!
