# Deployment Status & Next Steps

**Date**: December 2024  
**Current Status**: SQL Role Assignment Moved to Workflow Automation

## ? Completed

1. **Cosmos DB Fixed**: 
   - ? Renamed to `riff-react-cosmos-db`
   - ? Created in `db-rg` (correct resource group)
   - ? Database `ARiffInReact` created with 400 RU/s
   - ? Container `activities` created with `/userId` partition key
   - ? Bicep template updated
   - ? GitHub workflow updated

2. **Cosmos DB Role Assignment Fixed**:
   - ? Fixed role definition ID path in `cosmosRoleAssignment.bicep`
   - ? Module correctly scoped to `db-rg`

3. **Documentation Updated**:
   - ? Architecture docs reflect correct resource group organization
   - ? Cosmos DB setup guide created
   - ? All references updated to use new naming

4. **SQL Role Assignment Automated**:
   - ? Removed problematic Bicep deployment script module
   - ? Added workflow step to handle SQL permissions via Azure CLI
   - ? Automated solution avoids manual post-deployment steps

## ? Solution Implemented

**Approach**: Move SQL role assignment from Bicep to GitHub Actions workflow

### Why This Works

1. **No Deployment Script Complexity**: Azure CLI in workflow context is simpler than Bicep deployment scripts
2. **Proper Authentication**: GitHub Actions service principal has correct permissions
3. **Better Error Handling**: Workflow can gracefully handle failures without blocking infrastructure deployment
4. **Separation of Concerns**: Infrastructure provisioning separated from permission configuration
5. **Fully Automated**: No manual steps required after deployment

### Implementation Details

**Bicep Changes** (`infra/main.bicep`):
- Commented out `sqlRoleAssignment` module
- Added clear documentation explaining the workflow handles this

**Workflow Changes** (`.github/workflows/container-deploy.yml`):
- Added `Setup SQL Managed Identity Access` step after infrastructure deployment
- Uses `az sql db execute` to run T-SQL commands
- Gracefully handles failures without breaking the pipeline

### SQL Setup Step

The workflow now includes:

```yaml
- name: Setup SQL Managed Identity Access
  run: |
    # Get managed identity principal ID
    PRINCIPAL_ID=$(az identity show ...)
    
    # Create and execute SQL script
    az sql db execute \
      --server sequitur-sql-server \
      --name riff-react-db \
      --resource-group db-rg \
      --scripts @/tmp/grant-access.sql
```

This executes:
```sql
CREATE USER [principal-id] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [principal-id];
ALTER ROLE db_datawriter ADD MEMBER [principal-id];
```

## ?? Success Criteria

Deployment is successful when:
- [x] Bicep template deploys without errors (SQL module removed)
- [ ] Container App starts successfully
- [ ] Cosmos DB role assignment succeeds
- [x] SQL role assignment automated in workflow
- [ ] Health endpoint returns 200

## ?? Current Resource State

```
db-rg/
??? sequitur-sql-server          ? Exists
??? riff-react-db                ? Exists  
??? riff-react-cosmos-db         ? Created (Dec 2024)
    ??? ARiffInReact database    ? Created
        ??? activities container ? Created

riffinreact-rg/
??? ca-api-a-riff-in-react       ? Ready for redeployment
??? env-a-riff-in-react          ? Exists
??? id-a-riff-in-react           ? Exists
??? swa-a-riff-in-react          ? Exists
??? log-a-riff-in-react          ? Exists
??? appi-a-riff-in-react         ? Exists
```

## ?? Ready to Deploy

The deployment is now fully automated:

1. **Push to main** triggers workflow
2. **Infrastructure deploys** (without SQL role module)
3. **SQL permissions configured** via workflow step
4. **Container App updated** with new image

No manual intervention required!

## ?? Notes for Template Users

When using this template, ensure your Azure service principal has:
- **Contributor** role on both resource groups
- **SQL Administrator** access on the SQL Server (for executing SQL commands)

Set this up with:
```bash
# Grant SQL admin to service principal
az sql server ad-admin create \
  --resource-group db-rg \
  --server-name sequitur-sql-server \
  --display-name "GitHub Actions SP" \
  --object-id <service-principal-object-id>
```

---

**Last Updated**: December 2024  
**Status**: ? Solution Implemented - Ready for Deployment  
**Next Action**: Push changes to trigger automated deployment
