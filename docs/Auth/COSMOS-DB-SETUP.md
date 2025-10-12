# Cosmos DB Setup in db-rg

**Date**: December 2024  
**Status**: Ready for Deployment via Bicep

## Context

Following the Scaffolding architecture pattern, all database resources should reside in `db-rg`. The Cosmos DB account will be named `riff-react-cosmos-db` to match the project's naming conventions.

## Architecture Pattern

Following the **Scaffolding Series** resource organization:

```
db-rg/                              ? Database Infrastructure Resource Group
??? sequitur-sql-server             ? Shared SQL Server (across all projects)
??? riff-react-db                   ? Dedicated SQL Database (this project)
??? riff-react-cosmos-db            ? Cosmos DB (this project) ? CORRECT LOCATION

riffinreact-rg/                     ? Application Resource Group
??? ca-api-a-riff-in-react          ? Container App (API)
??? env-a-riff-in-react             ? Container App Environment
??? id-a-riff-in-react              ? Managed Identity
??? swa-a-riff-in-react             ? Static Web App (Frontend)
??? log-a-riff-in-react             ? Log Analytics
??? appi-a-riff-in-react            ? Application Insights
```

## Deployment via Bicep

The Cosmos DB setup is handled **automatically** by the Bicep deployment:

1. **Cosmos DB Account**: Must be created manually or pre-exist in `db-rg`
2. **Role Assignment**: Automated via `infra/modules/cosmosRoleAssignment.bicep`
3. **Database & Containers**: Created manually after account exists

### Prerequisites

Before deploying, ensure the Cosmos DB account exists:

```bash
# Check if Cosmos DB exists
az cosmosdb show \
  --name riff-react-cosmos-db \
  --resource-group db-rg

# If not, create it (takes 5-10 minutes)
az cosmosdb create \
  --name riff-react-cosmos-db \
  --resource-group db-rg \
  --locations regionName=westus \
  --default-consistency-level Session
```

### Database and Container Setup

After the Cosmos DB account exists, create the database and containers:

```bash
# Create database
az cosmosdb sql database create \
  --account-name riff-react-cosmos-db \
  --resource-group db-rg \
  --name ARiffInReact \
  --throughput 400

# Create activities container
az cosmosdb sql container create \
  --account-name riff-react-cosmos-db \
  --resource-group db-rg \
  --database-name ARiffInReact \
  --name activities \
  --partition-key-path "/userId" \
  --throughput 400
```

## Bicep Configuration

The Bicep template is already configured correctly:

```bicep
// infra/main.bicep
param existingCosmosDbAccountName string = 'riff-react-cosmos-db'
param existingCosmosDbResourceGroup string = 'db-rg'

// Cosmos DB role assignment module
module cosmosRoleAssignment 'modules/cosmosRoleAssignment.bicep' = {
  name: 'cosmosRoleAssignment'
  scope: resourceGroup(existingCosmosDbResourceGroup)
  params: {
    cosmosDbAccountName: existingCosmosDbAccountName
    principalId: managedIdentity.properties.principalId
    roleDefinitionId: '00000000-0000-0000-0000-000000000002'  // Data Contributor
  }
}
```

## GitHub Workflow

The workflow passes the correct parameters:

```yaml
# .github/workflows/container-deploy.yml
env:
  EXISTING_COSMOS_DB_NAME: riff-react-cosmos-db
  EXISTING_COSMOS_DB_RG: db-rg
```

## Benefits of This Architecture

1. **Consistency**: All data stores in dedicated database resource group
2. **Resource Management**: Easier to manage database resources separately from compute
3. **Cost Tracking**: Database costs separated from application compute costs
4. **Lifecycle Management**: Databases persist independently of application deployments
5. **No Manual Scripts**: Everything handled by infrastructure-as-code

## Verification

After deployment, verify the setup:

```bash
# Check Cosmos DB status
az cosmosdb show \
  --name riff-react-cosmos-db \
  --resource-group db-rg \
  --query "{Name:name, Status:provisioningState, Location:location}" \
  -o table

# Check role assignments
az cosmosdb sql role assignment list \
  --account-name riff-react-cosmos-db \
  --resource-group db-rg \
  -o table

# Get managed identity principal ID
az identity show \
  --name id-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query "{Name:name, PrincipalId:principalId}" \
  -o table
```

## Cost Considerations

- **Cosmos DB Account**: Free tier available (first 1000 RU/s and 25 GB storage)
- **Database**: Autoscale or provisioned throughput (recommend 400 RU/s to start)
- **Estimated Cost**: ~$0.25/day for 400 RU/s = ~$7.50/month

## Troubleshooting

### Issue: "ResourceNotFound" during deployment
**Cause**: Cosmos DB account doesn't exist  
**Solution**: Run the creation command above before deploying

### Issue: Role assignment failed
**Cause**: Managed identity doesn't have permission  
**Solution**: Verify the Bicep module scope is correct and managed identity exists

### Issue: "Database account state is not Online"
**Cause**: Account is still being created or deleted  
**Solution**: Wait 5-10 minutes and retry

---

**Status**: Ready for deployment once Cosmos DB account is created
**Last Updated**: December 2024
