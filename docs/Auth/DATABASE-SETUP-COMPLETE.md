# ? Database Setup - Fully Automated

**Date**: December 2024  
**Status**: Automated via GitHub Actions  
**Method**: CI/CD Workflow Deployment

---

## ?? Database Schema

### Users Table
- **Table**: `Users`
- **Columns**:
  - `id` (INT, PRIMARY KEY, IDENTITY)
  - `email` (NVARCHAR(255), UNIQUE, NOT NULL)
  - `passwordHash` (NVARCHAR(255), NULL)
  - `name` (NVARCHAR(255), NOT NULL)
  - `role` (NVARCHAR(50), DEFAULT 'member')
  - `createdAt` (DATETIME2)
  - `updatedAt` (DATETIME2)

### Connection Details
- **Server**: `sequitur-sql-server.database.windows.net`
- **Database**: `riff-react-db`
- **Authentication**: Managed Identity (Container App)

---

## ?? How It Works

### Automated Deployment (Recommended)

**When you push to `main` branch, GitHub Actions automatically:**

1. **Deploys Infrastructure** (Container Apps, Managed Identity)
2. **Grants SQL Permissions** to the Container App's managed identity
3. **Runs Database Schema** from `scripts/deploy-database.sql`
4. **Verifies Deployment** with health checks

**Zero manual steps required!** ??

### The Deployment Script

**File**: `scripts/deploy-database.sql`

This idempotent SQL script:
- ? Creates `Users` table if it doesn't exist
- ? Adds missing columns (for schema migrations)
- ? Safe to run multiple times
- ? Used automatically by CI/CD

---

## ?? Adding Database Changes

### Step 1: Edit the Script

Edit `scripts/deploy-database.sql`:

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

### Step 2: Deploy

```bash
git add scripts/deploy-database.sql
git commit -m "Add phoneNumber column"
git push origin main
```

**That's it!** GitHub Actions deploys it automatically.

---

## ?? Manual Testing (Optional)

For local testing before committing:

### Option 1: Azure Cloud Shell
```bash
sqlcmd -S sequitur-sql-server.database.windows.net -d riff-react-db -G
:r scripts/deploy-database.sql
GO
```

### Option 2: Azure Data Studio
1. Connect with Azure Active Directory auth
2. Open `scripts/deploy-database.sql`
3. Execute (F5)

---

## ??? Troubleshooting

### "AUTOMATED SETUP FAILED" in Workflow

**Cause**: GitHub Actions service principal needs SQL admin access

**Solution (One-time)**:
```bash
az sql server ad-admin create \
  --server sequitur-sql-server \
  --resource-group db-rg \
  --display-name 'GitHub Actions SP' \
  --object-id $(az ad sp list --display-name 'GitHub Actions' --query '[0].id' -o tsv)
```

Or follow the manual setup instructions in the workflow output.

### Application Can't Connect

Check Container App environment variables:
- `SQL_SERVER`: sequitur-sql-server.database.windows.net
- `SQL_DATABASE`: riff-react-db
- `USE_AZURE_AUTH`: true

---

## ?? Scripts Organization

**Kept** (used by CI/CD):
- ? `scripts/deploy-database.sql` - Main schema deployment

**Removed** (replaced by automation):
- ? `scripts/setup-database.ps1` - Manual setup no longer needed
- ? `scripts/check-*.sql` - Use Azure Portal/Data Studio instead
- ? All other manual scripts

---

## ? Summary

**How Deployment Works:**
1. Edit `scripts/deploy-database.sql`
2. Push to `main`
3. ? **Automatic deployment!** ?

**Benefits:**
- ?? Single source of truth (Git)
- ?? Repeatable deployments
- ??? Idempotent migrations
- ?? Team-friendly workflow

---

**Status**: ? Fully Automated  
**Next Steps**: Just push to main and let CI/CD handle it!

