# Phone Schema Fix - Deployment Summary

**Issue:** Phone collection modal fails with 500 error because `Users` table lacks a `phone` column.

**Solution:** Automated schema deployment script that safely applies the migration.

---

## ? What Was Changed

### 1. Schema Files Updated

**`api/schema.sql`** ?
- Added `phone NVARCHAR(20) NULL` to `CREATE TABLE Users` block
- Added migration guard: `IF NOT EXISTS ... ALTER TABLE Users ADD phone ...`

**`scripts/deploy-database.sql`** ?
- Added `phone NVARCHAR(20) NULL` to table creation
- Added migration guard for existing tables

### 2. New Automation Script Created

**`scripts/deploy-schema.ps1`** ? NEW
- Fetches SQL admin credentials from Key Vault automatically
- Applies `api/schema.sql` to production database
- Verifies prerequisites (Azure CLI, sqlcmd)
- Provides clear output and error handling
- Safe to run multiple times (idempotent)

### 3. Documentation Added

**`scripts/README.md`** ? NEW
- Complete usage guide for all scripts
- Troubleshooting section
- Common workflows documented

---

## ?? How to Deploy

### Step 1: Verify Prerequisites

```powershell
# Check Azure CLI
az --version

# Check sqlcmd
sqlcmd -?

# If sqlcmd is missing, install from: https://aka.ms/sqlcmd
```

### Step 2: Run the Deployment Script

```powershell
.\scripts\deploy-schema.ps1
```

**What it does:**
1. ? Checks Azure authentication (runs `az login` if needed)
2. ? Fetches SQL admin credentials from `kv-a-riff-in-react`
3. ? Parses server, database, user, password
4. ? Shows deployment summary and asks for confirmation
5. ? Applies `api/schema.sql` using `sqlcmd`
6. ? Verifies the `phone` column was created
7. ? Provides next steps

**Expected output:**
```
========================================
  Azure SQL Schema Deployment
========================================

? Prerequisites OK
? Logged in as: your-email@example.com
? Retrieved connection string from Key Vault
? Connection details parsed

========================================
  READY TO DEPLOY SCHEMA
========================================

Schema file: C:\...\api\schema.sql
Target:      sequitur-sql-server.database.windows.net / riff-react-db

Continue? (y/N): y

? Applying schema to database...

========================================
? SCHEMA DEPLOYED SUCCESSFULLY
========================================

? The 'phone' column has been added to the Users table
? Registration and phone collection should now work end-to-end
```

### Step 3: Test the Fix

```powershell
.\scripts\test-registration.ps1
```

Expected: All tests pass ?

---

## ?? Manual Verification (Optional)

Connect to the database and verify:

```sql
SELECT 
    name, 
    TYPE_NAME(system_type_id) as DataType,
    max_length,
    is_nullable
FROM sys.columns 
WHERE object_id = OBJECT_ID('Users') 
    AND name = 'phone';
```

**Expected result:**
| name  | DataType | max_length | is_nullable |
|-------|----------|------------|-------------|
| phone | nvarchar | 40         | 1           |

---

## ?? What This Fixes

### Before Fix
- User registers successfully ?
- Phone modal appears ?
- User enters phone number ?
- Click "Save" ? **500 error** ?
- Backend logs: `Invalid column name 'phone'`

### After Fix
- User registers successfully ?
- Phone modal appears ?
- User enters phone number ?
- Click "Save" ? **200 OK** ?
- Phone saved to database ?
- User proceeds to app ?

---

## ?? Post-Deployment Checklist

- [ ] Run `.\scripts\deploy-schema.ps1` successfully
- [ ] Verify `phone` column exists in production DB
- [ ] Run `.\scripts\test-registration.ps1` ? all tests pass
- [ ] Test phone collection in UI
- [ ] Commit all changes to repo
- [ ] Update `docs/SESSION-HANDOFF.md` (mark phone issue resolved)

---

## ?? For Future Schema Changes

This pattern is now established for all future schema migrations:

1. **Update `api/schema.sql`** with new column/table/index
2. **Add migration guard**: `IF NOT EXISTS ... ALTER TABLE ...`
3. **Run deployment**: `.\scripts\deploy-schema.ps1`
4. **Test**: `.\scripts\test-registration.ps1`
5. **Commit and push** (CI/CD will deploy container with updated code)

---

## ??? Troubleshooting

### "Key Vault not found" or "Access denied"

Grant yourself Key Vault access:
```powershell
az keyvault set-policy `
    --name kv-a-riff-in-react `
    --upn YOUR_EMAIL@domain.com `
    --secret-permissions get
```

### "sqlcmd: command not found"

Install SQL Server command-line tools:
- **Windows**: https://aka.ms/sqlcmd
- **Linux**: `sudo apt-get install mssql-tools`
- **macOS**: `brew install sqlcmd`

### Schema deployment succeeds but tests still fail

Check Container App logs:
```powershell
az containerapp logs show `
    -n ca-api-a-riff-in-react `
    -g riffinreact-rg `
    --follow
```

Verify managed identity has database access:
```powershell
# See docs/Auth/SQL-SETUP-STEP-BY-STEP.md for detailed steps
```

---

## ?? Related Documentation

- [Authentication Flow](../docs/07-authentication.md)
- [Azure Deployment](../docs/10-azure-deployment.md)
- [SQL Managed Identity Setup](../docs/Auth/SQL-SETUP-STEP-BY-STEP.md)
- [Session Handoff Notes](../docs/SESSION-HANDOFF.md)
- [Scripts README](./README.md)

---

**Status:** ? Ready to deploy

**Command to run:**
```powershell
.\scripts\deploy-schema.ps1
```
