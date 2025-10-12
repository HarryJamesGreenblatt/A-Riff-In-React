# SQL Role Assignment - Automated with Fallback

**Date**: December 2024  
**Status**: ? Updated - Automated with graceful fallback

---

## ?? What Was Changed

Updated `.github/workflows/container-deploy.yml` to **attempt automated SQL role assignment** with a graceful fallback to manual instructions.

### The New Approach

```yaml
- name: Setup SQL Managed Identity Access
  # 1. Gets managed identity principal ID
  # 2. Creates SQL script with role assignments
  # 3. Attempts automated execution via Azure CLI
  # 4. If fails, displays clear manual instructions
```

---

## ? How It Works

### Step 1: Attempt Automation

The workflow tries to execute SQL commands using `az sql db execute`:

```bash
az sql db execute \
  --server sequitur-sql-server \
  --database riff-react-db \
  --resource-group db-rg \
  --auth-type ADPassword \
  --file /tmp/grant-access.sql
```

**SQL Script Executed:**
```sql
-- Creates user if doesn't exist
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '${PRINCIPAL_ID}')
BEGIN
    CREATE USER [${PRINCIPAL_ID}] FROM EXTERNAL PROVIDER;
END

-- Adds db_datareader role if not already member
IF IS_ROLEMEMBER('db_datareader', '${PRINCIPAL_ID}') = 0
BEGIN
    ALTER ROLE db_datareader ADD MEMBER [${PRINCIPAL_ID}];
END

-- Adds db_datawriter role if not already member
IF IS_ROLEMEMBER('db_datawriter', '${PRINCIPAL_ID}') = 0
BEGIN
    ALTER ROLE db_datawriter ADD MEMBER [${PRINCIPAL_ID}];
END
```

### Step 2: Graceful Fallback

If automation fails (likely because GitHub Actions service principal lacks SQL admin permissions):

- ? **Deployment continues** (doesn't fail the pipeline)
- ?? **Clear manual instructions** are displayed in logs
- ?? **Reference to documentation** (`docs/Auth/SQL-MANAGED-IDENTITY-SETUP.md`)
- ?? **Warning** that API won't access database until setup is complete

---

## ?? When Automation Works

Automation will succeed if:

? GitHub Actions service principal is configured as Azure AD admin on the SQL Server:

```bash
az sql server ad-admin create \
  --server sequitur-sql-server \
  --resource-group db-rg \
  --display-name 'GitHub Actions SP' \
  --object-id <service-principal-object-id>
```

? Service principal has `Contributor` role on the database resource group

---

## ?? When Manual Setup Is Required

Manual setup is needed if:

? GitHub Actions service principal is **not** an Azure AD admin on SQL Server  
? Service principal lacks SQL permissions  
? `az sql db execute` command fails for any reason

### Manual Setup Options

#### Option 1: Azure Cloud Shell (Recommended)

```bash
# 1. Open https://shell.azure.com
# 2. Connect to database
sqlcmd -S sequitur-sql-server.database.windows.net \
       -d riff-react-db \
       -G

# 3. Execute SQL
CREATE USER [<PRINCIPAL_ID>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [<PRINCIPAL_ID>];
ALTER ROLE db_datawriter ADD MEMBER [<PRINCIPAL_ID>];
GO
```

#### Option 2: Azure Data Studio

1. Install Azure Data Studio
2. Connect with Azure AD auth
3. Execute SQL commands above

#### Option 3: Azure Portal Query Editor

1. Navigate to SQL Database in Portal
2. Open Query Editor
3. Authenticate with Azure AD
4. Execute SQL commands

---

## ?? Benefits of This Approach

### ? Best of Both Worlds

| Aspect | Benefit |
|--------|---------|
| **Automation** | Works automatically when permissions are configured |
| **Reliability** | Doesn't fail deployment if automation can't run |
| **Flexibility** | Manual fallback for initial setup or restricted environments |
| **Idempotency** | SQL script checks if user/roles exist before creating |
| **Clear Guidance** | Detailed manual instructions if automation fails |

### ? Template-Friendly

For template users:

1. **First Deployment**: Manual setup required (one-time)
2. **Subsequent Deployments**: Works automatically
3. **No Deployment Failures**: Pipeline succeeds even if SQL setup isn't done

---

## ?? Verification

After deployment, verify SQL permissions:

```sql
-- Check if user exists
SELECT name, type_desc, create_date 
FROM sys.database_principals 
WHERE name = '<PRINCIPAL_ID>';

-- Check role membership
SELECT 
    USER_NAME(rm.member_principal_id) AS UserName,
    USER_NAME(rm.role_principal_id) AS RoleName
FROM sys.database_role_members rm
WHERE USER_NAME(rm.member_principal_id) = '<PRINCIPAL_ID>';
```

Expected output:
```
UserName: <PRINCIPAL_ID>
RoleName: db_datareader

UserName: <PRINCIPAL_ID>
RoleName: db_datawriter
```

---

## ?? Deployment Impact

### Current Deployment Flow

```
1. Build & Push Container Image ?
2. Deploy Bicep Infrastructure ?
3. Attempt SQL Role Assignment
   ?? ? Success ? Automated setup complete
   ?? ? Failure ? Display manual instructions
4. Verify Container App Health ?
5. Deployment Complete ?
```

**Key Point**: Deployment always succeeds, even if SQL setup requires manual intervention.

---

## ?? Manual Setup Status

**Current Principal ID**: Check deployment logs or run:

```bash
az identity show \
  --name id-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query principalId -o tsv
```

**Setup Required**: If you see manual instructions in deployment logs

**Setup Complete When**:
- API can read/write to SQL database
- No authentication errors in Container App logs
- User registration/login endpoints work

---

## ?? Lessons Learned

### Why Not Pure Automation?

We attempted several approaches:

1. **Bicep deployment scripts** - Complex, cross-RG issues, slow
2. **GitHub workflow with sqlcmd** - Tool not available in runners
3. **Azure CLI execute** - Requires SQL admin permissions

### Why This Hybrid Approach?

? **Pragmatic**: Works when possible, fails gracefully  
? **Template-Friendly**: Doesn't block deployments  
? **Well-Documented**: Clear instructions for manual setup  
? **Idempotent**: Safe to run multiple times  
? **Future-Proof**: Automation works once permissions are granted

---

## ?? Related Documentation

- **SQL Setup Details**: `docs/Auth/SQL-MANAGED-IDENTITY-SETUP.md`
- **Deployment Status**: `docs/Auth/DEPLOYMENT-STATUS.md`
- **Infrastructure Status**: `docs/Auth/INFRASTRUCTURE-MIGRATION-STATUS.md`

---

## ? Success Criteria

The SQL role assignment is properly configured when:

- [x] Workflow step attempts automation
- [x] Workflow displays clear fallback instructions if automation fails
- [x] Deployment succeeds regardless of SQL setup status
- [ ] Managed identity has db_datareader role
- [ ] Managed identity has db_datawriter role
- [ ] API can connect to SQL database
- [ ] User registration/login endpoints work

---

**Status**: ? Workflow Updated  
**Next Step**: Deploy and verify SQL permissions  
**Manual Setup**: May be required on first deployment
