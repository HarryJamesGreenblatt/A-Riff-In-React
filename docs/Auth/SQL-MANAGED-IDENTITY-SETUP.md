# SQL Managed Identity Setup

**Status**: Manual Setup Required (One-Time)  
**Reason**: `az sql db execute` command not available in GitHub Actions Azure CLI

---

## Why Manual Setup?

The SQL Server role assignment cannot be automated in the GitHub Actions workflow because:

1. **Command Not Available**: `az sql db execute` doesn't exist in the Azure CLI version available in GitHub Actions
2. **sqlcmd Not Installed**: The `sqlcmd` tool is not available in the ubuntu-latest runner
3. **Authentication Complexity**: Using Azure AD authentication from a service principal to execute SQL commands requires special setup

**This is a one-time setup** - once configured, it persists across deployments.

---

## Current Status

### ? What's Working

- Managed Identity is created automatically by Bicep
- Container App is configured to use the managed identity
- Environment variables point to the correct SQL Server and database
- Connection string uses `Authentication=Active Directory Default`

### ?? What Needs Manual Setup

The managed identity needs these SQL permissions:
- `CREATE USER` from external provider
- `db_datareader` role membership
- `db_datawriter` role membership

---

## Manual Setup Instructions

### Option 1: Azure Cloud Shell (Recommended)

1. **Open Azure Cloud Shell** (https://shell.azure.com)

2. **Get the Principal ID** from the deployment output or run:
   ```bash
   az identity show \
     --name id-a-riff-in-react \
     --resource-group riffinreact-rg \
     --query principalId -o tsv
   ```

3. **Connect to SQL Database**:
   ```bash
   sqlcmd -S sequitur-sql-server.database.windows.net \
          -d riff-react-db \
          -G  # Uses Azure AD authentication
   ```

4. **Grant Permissions** (replace `<PRINCIPAL-ID>` with the actual ID):
   ```sql
   CREATE USER [<PRINCIPAL-ID>] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [<PRINCIPAL-ID>];
   ALTER ROLE db_datawriter ADD MEMBER [<PRINCIPAL-ID>];
   GO
   ```

### Option 2: Azure Data Studio

1. **Install Azure Data Studio**: https://aka.ms/azuredatastudio

2. **Connect to Database**:
   - Server: `sequitur-sql-server.database.windows.net`
   - Database: `riff-react-db`
   - Authentication: `Azure Active Directory`

3. **Get Principal ID**:
   ```bash
   az identity show \
     --name id-a-riff-in-react \
     --resource-group riffinreact-rg \
     --query principalId -o tsv
   ```

4. **Run SQL Script**:
   ```sql
   -- Replace <PRINCIPAL-ID> with the actual principal ID
   CREATE USER [<PRINCIPAL-ID>] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [<PRINCIPAL-ID>];
   ALTER ROLE db_datawriter ADD MEMBER [<PRINCIPAL-ID>];
   GO
   ```

### Option 3: Azure Portal Query Editor

1. **Navigate to SQL Database** in Azure Portal
2. **Open Query Editor**
3. **Authenticate** with Azure AD
4. **Run the SQL commands** from Option 2

---

## Verification

After setup, verify the permissions:

### Check User Exists
```sql
SELECT 
    dp.name AS UserName,
    dp.type_desc AS UserType,
    dp.create_date AS Created
FROM sys.database_principals dp
WHERE dp.name = '<PRINCIPAL-ID>';
```

### Check Role Membership
```sql
SELECT 
    USER_NAME(rm.member_principal_id) AS UserName,
    USER_NAME(rm.role_principal_id) AS RoleName
FROM sys.database_role_members rm
WHERE USER_NAME(rm.member_principal_id) = '<PRINCIPAL-ID>';
```

Expected output:
```
UserName: <PRINCIPAL-ID>
RoleName: db_datareader

UserName: <PRINCIPAL-ID>
RoleName: db_datawriter
```

---

## Troubleshooting

### Error: "Cannot find the user"
**Cause**: Principal ID is incorrect or managed identity doesn't exist  
**Solution**: Verify the principal ID from Azure Portal or CLI

### Error: "Permission denied"
**Cause**: You don't have admin access to the SQL Server  
**Solution**: Ask your Azure administrator to add you as an Azure AD admin:

```bash
az sql server ad-admin create \
  --server sequitur-sql-server \
  --resource-group db-rg \
  --display-name "Your Name" \
  --object-id <your-azure-ad-object-id>
```

### Error: "User already exists"
**Cause**: The user was created in a previous attempt  
**Solution**: Just run the ALTER ROLE commands:

```sql
ALTER ROLE db_datareader ADD MEMBER [<PRINCIPAL-ID>];
ALTER ROLE db_datawriter ADD MEMBER [<PRINCIPAL-ID>];
GO
```

---

## Why Not Bicep?

You might wonder why we don't use Bicep for this. The commented-out code in `infra/main.bicep` explains:

```bicep
// SQL Database role assignment module - DISABLED
// Moved to GitHub workflow post-deployment step
// Reason: Deployment script resource has limitations with cross-resource-group deployments
```

Bicep's `deploymentScript` resource has issues with:
- Cross-resource-group deployments
- Authentication complexity
- Slower deployment times
- More complex error handling

The workflow approach (even if manual) is more reliable.

---

## For Template Users

If you're using this as a template for your own project:

### First Deployment
1. Deploy infrastructure via GitHub Actions
2. Get principal ID from deployment logs or Azure CLI
3. Run SQL commands once (as shown above)
4. Done! Subsequent deployments work automatically

### Subsequent Deployments
- No manual steps needed
- Container App updates automatically
- Managed identity permissions persist

---

## Current Principal ID

For reference, the current managed identity principal ID is:

```
6b3d9f97-b02a-44d9-bace-253cd5efb20a
```

**To set up SQL access**, run:

```sql
CREATE USER [6b3d9f97-b02a-44d9-bace-253cd5efb20a] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [6b3d9f97-b02a-44d9-bace-253cd5efb20a];
ALTER ROLE db_datawriter ADD MEMBER [6b3d9f97-b02a-44d9-bace-253cd5efb20a];
GO
```

---

**Status**: Documentation Complete  
**Action Required**: One-time SQL setup (see instructions above)  
**Impact**: API will have read/write access to SQL database after setup

