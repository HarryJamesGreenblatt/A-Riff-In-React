# GitHub Actions: Azure CI/CD Pipeline

**Status**: ✅ **SUCCESSFULLY CONFIGURED AND RUNNING**

This document covers the GitHub Actions workflow for **A Riff In React**, which successfully deploys the application and its infrastructure to Azure. The pipeline is optimized for cost-efficiency by deploying to a shared SQL Server.

## 🎉 Current Status

- ✅ **Workflow Status**: Fully operational and tested.
- ✅ **Last Deployment**: Successful - August 30, 2025.
- ✅ **Live Application**: https://a-riff-in-react.azurewebsites.net
- ✅ **Authentication**: Microsoft Entra External ID integrated.
- ✅ **Infrastructure**: Deploys to a shared SQL Server in a separate resource group.

## Active Workflow: `azure-deploy.yml`

We use a **single, combined workflow** that handles both infrastructure and application deployment. This streamlined process was recently updated to handle the cross-resource-group deployment required by the shared database architecture.

### Workflow Features
- **Infrastructure as Code**: Deploys Azure resources using Bicep.
- **Cross-Resource Group Deployment**: Correctly deploys the SQL database to the shared server's resource group.
- **React Application Build**: Compiles the TypeScript application.
- **Azure App Service Deployment**: Pushes the built application to the hosting environment.
- **CI/CD Best Practices**: Uses a Service Principal with subscription-level permissions to manage resources across multiple resource groups.

## Required GitHub Secrets

The CI/CD pipeline requires a Service Principal with sufficient permissions. Because the deployment targets two different resource groups (`riffinreact-rg` for the app and `db-rg` for the database), the Service Principal must have the **Contributor** role assigned at the **Subscription** scope.

1.  **Create the Service Principal**:
    ```bash
    # Create a service principal with Contributor role over the entire subscription
    az ad sp create-for-rbac --name "GitHub-A-Riff-In-React" --role contributor \
      --scopes /subscriptions/{subscription-id} \
      --sdk-auth
    
    # The output is a JSON object. Copy it.
    ```

2.  **Add GitHub Secrets**:
    Add the following secrets to your GitHub repository's settings:
    *   `AZURE_CREDENTIALS`: Paste the entire JSON output from the `az ad sp create-for-rbac` command.
    *   `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID.
    *   `AZURE_RESOURCE_GROUP`: The primary resource group for this project (e.g., `riffinreact-rg`).
    *   `SHARED_SQL_SERVER_RG`: The resource group of the shared SQL server (e.g., `db-rg`).
    *   `SQL_ADMIN_PASSWORD`: The administrator password for the shared SQL server.

## Workflow Detail (`.github/workflows/azure-deploy.yml`)

The workflow uses a direct Azure CLI command (`az deployment group create`) for the Bicep deployment. This was a necessary change to overcome a limitation in the `azure/arm-deploy` action when dealing with module deployments that have a cross-resource-group scope.

```yaml
name: Azure CI/CD for React App with Entra External ID

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_ENV_NAME: a-riff-in-react
  AZURE_LOCATION: westus
  AZURE_RESOURCE_GROUP: riffinreact-rg
  SHARED_SQL_SERVER_RG: db-rg

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build React app
        run: npm run build
        env:
          VITE_ENTRA_CLIENT_ID: "placeholder-for-build"
          VITE_ENTRA_TENANT_ID: "placeholder-for-build"
      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy Azure Infrastructure
        run: |
          az deployment group create \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
            --template-file ./infra/main.bicep \
            --parameters environmentName=${{ env.AZURE_ENV_NAME }} \
                         location=${{ env.AZURE_LOCATION }} \
                         externalTenantId=${{ secrets.EXTERNAL_TENANT_ID }} \
                         externalClientId=${{ secrets.EXTERNAL_CLIENT_ID }} \
                         sharedSqlServerResourceGroupName=${{ env.SHARED_SQL_SERVER_RG }} \
                         sqlAdminPassword='${{ secrets.SQL_ADMIN_PASSWORD }}'
        shell: bash

      - name: Deploy React app to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.AZURE_ENV_NAME }}
          package: ./dist
      
      - name: Logout from Azure
        run: az logout
        if: always()
```

This setup ensures a robust, secure, and cost-effective deployment pipeline for the application.
