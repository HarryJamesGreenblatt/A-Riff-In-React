# Cosmos DB Setup in db-rg

**Date**: December 2024  
**Status**: In Progress - Cosmos DB Being Recreated in Correct Resource Group

## Context

The Cosmos DB account `cosmos-a-riff-in-react` was originally created in the `riffinreact-rg` resource group, which violates the Scaffolding architecture pattern where all database resources should reside in `db-rg`.

## Actions Taken

1. ? Deleted existing Cosmos DB from `riffinreact-rg`
2. ? Updated `infra/main.bicep` to correctly default to `db-rg` for Cosmos DB
3. ? Verified GitHub workflow passes correct resource group parameter
4. ? Creating Cosmos DB in `db-rg` (pending)

## Architecture Pattern

Following the **Scaffolding Series** resource organization:

```
db-rg/                              ? Database Infrastructure Resource Group
??? sequitur-sql-server             ? Shared SQL Server (across all projects)
??? riff-react-db                   ? Dedicated SQL Database (this project)
??? cosmos-a-riff-in-react          ? Cosmos DB (this project) ? CORRECT LOCATION

riffinreact-rg/                     ? Application Resource Group
??? ca-api-a-riff-in-react          ? Container App (API)
??? env-a-riff-in-react             ? Container App Environment
??? id-a-riff-in-react              ? Managed Identity
??? swa-a-riff-in-react             ? Static Web App (Frontend)
??? log-a-riff-in-react             ? Log Analytics
??? appi-a-riff-in-react            ? Application Insights
```

## Benefits of Correct Architecture

1. **Consistency**: All data stores in dedicated database resource group
2. **Resource Management**: Easier to manage database resources separately from compute
3. **Cost Tracking**: Database costs separated from application compute costs
4. **Shared Resource Pattern**: Could potentially share Cosmos DB across projects if needed
5. **Lifecycle Management**: Databases persist independently of application deployments

## Setup Commands

### 1. Create Cosmos DB Account in db-rg

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --locations regionName=westus failoverPriority=0 isZoneRedundant=False \
  --default-consistency-level Session \
  --kind GlobalDocumentDB

# Note: Creation takes 5-10 minutes
```

### 2. Create Database

```bash
# Create database
az cosmosdb sql database create \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --name ARiffInReact \
  --throughput 400
```

### 3. Create Containers

```bash
# Create activities container
az cosmosdb sql container create \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --database-name ARiffInReact \
  --name activities \
  --partition-key-path "/userId" \
  --throughput 400

# Create users container (optional, if using Cosmos for user data)
az cosmosdb sql container create \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --database-name ARiffInReact \
  --name users \
  --partition-key-path "/id" \
  --throughput 400
```

### 4. Verify Setup

```bash
# Check Cosmos DB status
az cosmosdb show \
  --name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --query "{Name:name, Status:provisioningState, Location:location, ResourceGroup:resourceGroup}" \
  -o table

# List databases
az cosmosdb sql database list \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  -o table

# List containers
az cosmosdb sql container list \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  --database-name ARiffInReact \
  -o table
```

### 5. Verify Role Assignment

After deployment, verify the managed identity has access:

```bash
# List role assignments
az cosmosdb sql role assignment list \
  --account-name cosmos-a-riff-in-react \
  --resource-group db-rg \
  -o table

# Get managed identity principal ID
PRINCIPAL_ID=$(az identity show \
  --name id-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query principalId -o tsv)

echo "Managed Identity Principal ID: $PRINCIPAL_ID"
```

## Deployment Integration

The Bicep template automatically handles role assignment via the `cosmosRoleAssignment` module:

```bicep
module cosmosRoleAssignment 'modules/cosmosRoleAssignment.bicep' = {
  name: 'cosmosRoleAssignment'
  scope: resourceGroup(existingCosmosDbResourceGroup)  // Scoped to db-rg
  params: {
    cosmosDbAccountName: existingCosmosDbAccountName
    principalId: managedIdentity.properties.principalId
    roleDefinitionId: '00000000-0000-0000-0000-000000000002'  // Data Contributor
  }
}
```

## Testing Access

Once deployed, test Cosmos DB access from the Container App:

```bash
# Get Container App URL
APP_URL=$(az containerapp show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query properties.configuration.ingress.fqdn -o tsv)

# Test Cosmos DB connectivity (when implemented in API)
curl https://$APP_URL/api/activities
```

## Cost Considerations

- **Cosmos DB Account**: Free tier available (first 1000 RU/s and 25 GB storage)
- **Database**: Autoscale or provisioned throughput (recommend 400 RU/s to start)
- **Containers**: Share database throughput or provision per-container

**Estimated Cost**: ~$0.25/day for 400 RU/s = ~$7.50/month

## Troubleshooting

### Issue: "Database account state is not Online"
**Cause**: Previous deletion still propagating through Azure
**Solution**: Wait 5-10 minutes for full deletion to complete, then retry creation

### Issue: "Role assignment failed"
**Cause**: Managed identity doesn't have permission
**Solution**: Verify the Bicep module is scoped to `db-rg` and the managed identity exists

### Issue: "ResourceNotFound" during deployment
**Cause**: Cosmos DB doesn't exist in specified resource group
**Solution**: Run the creation commands above before deploying via Bicep

## Next Steps

1. ? Wait for Cosmos DB creation to complete (5-10 minutes)
2. ? Create database and containers
3. ? Deploy Bicep template to configure role assignments
4. ? Test API connectivity to Cosmos DB
5. ? Update documentation with final URLs and configuration

## References

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Cosmos DB Role-Based Access Control](https://docs.microsoft.com/azure/cosmos-db/how-to-setup-rbac)
- [Bicep Cosmos DB Modules](https://docs.microsoft.com/azure/templates/microsoft.documentdb/databaseaccounts)

---

**Status**: Waiting for network stabilization to complete Cosmos DB creation
**Last Updated**: December 2024
