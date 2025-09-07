# GitHub Actions: Azure CI/CD Pipeline

**Status**: ✅ **SUCCESSFULLY CONFIGURED AND RUNNING**

This document covers the GitHub Actions workflows for **A Riff In React**, which successfully deploy the containerized API and static web frontend to Azure. The pipeline includes Container Apps deployment, GitHub Container Registry integration, and managed identity configuration.

## 🎉 Current Status

- ✅ **Workflow Status**: Fully operational and tested.
- ✅ **Last Deployment**: Successful - September 6, 2025.
- ✅ **Live API**: https://api-a-riff-in-react.westus.azurecontainerapps.io
- ✅ **Live Frontend**: https://purple-tree-0e7c5c91e.4.azurestaticapps.net
- ✅ **Authentication**: Microsoft Entra External ID integrated.
- ✅ **Infrastructure**: Container Apps with managed identity for database access.
- ✅ **Platform**: Successfully migrated from Windows App Service to Container Apps.

## Active Workflows

We use **two separate workflows** that handle different parts of the application:

1. **`container-deploy.yml`**: Builds and deploys the API container to Azure Container Apps
2. **`static-web-deploy.yml`**: Builds and deploys the React frontend to Azure Static Web Apps

### Workflow Features
- **Containerized Deployment**: Docker image built and pushed to GitHub Container Registry
- **Infrastructure as Code**: Deploys Azure resources using Bicep templates
- **Managed Identity**: Properly configures identity for secure database access
- **Cross-Resource Group Deployment**: Correctly sets up role assignments for database access
- **Separate Deployment Paths**: API and frontend deploy independently based on changed files
- **Health Verification**: Automated health checks to verify successful deployment

## Required GitHub Secrets

The CI/CD pipelines require several secrets to be configured in your GitHub repository:

1.  **AZURE_CREDENTIALS**: Azure service principal credentials in JSON format
2.  **EXTERNAL_TENANT_ID**: Microsoft Entra External ID tenant ID
3.  **EXTERNAL_CLIENT_ID**: Microsoft Entra External ID client ID
4.  **STATIC_WEB_APPS_API_TOKEN**: Deployment token for Azure Static Web Apps

### Creating the Service Principal

```bash
# Create a service principal with Contributor role over required resource groups
az ad sp create-for-rbac --name "GitHub-A-Riff-In-React" --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/riffinreact-rg \
           /subscriptions/{subscription-id}/resourceGroups/db-rg \
  --sdk-auth
```

Copy the entire JSON output and add it as the `AZURE_CREDENTIALS` secret in your GitHub repository.

## Container Deploy Workflow (`.github/workflows/container-deploy.yml`)

This workflow handles the API container and infrastructure deployment:

```yaml
name: Deploy API to Container Apps

on:
  push:
    branches: [fresh-start]
    paths:
      - 'api/**'
      - '.github/workflows/container-deploy.yml'
      - 'infra/**'
  workflow_dispatch:

env:
  AZURE_RESOURCE_GROUP: riffinreact-rg
  LOCATION: westus
  ENVIRONMENT_NAME: a-riff-in-react
  EXISTING_SQL_SERVER_RG: db-rg
  EXISTING_SQL_SERVER_NAME: sequitur-sql-server
  EXISTING_SQL_DATABASE_NAME: riff-react-db
  EXISTING_COSMOS_DB_NAME: cosmos-a-riff-in-react

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      # Checkout, build, push container, and deploy infrastructure
      # See the full workflow file for details
```

Key features:
- Builds Docker image for the API
- Pushes to GitHub Container Registry
- Deploys Azure infrastructure with Bicep
- Configures managed identity for database access
- Verifies deployment with health checks

## Static Web Deploy Workflow (`.github/workflows/static-web-deploy.yml`)

This workflow handles the React frontend deployment:

```yaml
name: Deploy Frontend to Static Web Apps

on:
  push:
    branches: [fresh-start]
    paths-ignore:
      - 'api/**'
      - '.github/workflows/container-deploy.yml'
      - 'infra/**'
  workflow_dispatch:

env:
  AZURE_RESOURCE_GROUP: riffinreact-rg
  AZURE_STATIC_WEB_APP_NAME: a-riff-in-react
  API_URL: https://api-a-riff-in-react.westus.azurecontainerapps.io

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      # Checkout, build, and deploy frontend
      # See the full workflow file for details
```

Key features:
- Sets up Node.js environment
- Builds React app with appropriate environment variables
- Deploys to Azure Static Web Apps
- Configures API URL to point to Container App

## Workflow Integration

The two workflows work together but are triggered independently:
- Changes to API code or infrastructure trigger the container workflow
- Changes to frontend code trigger the Static Web Apps workflow
- Manual triggers are available through `workflow_dispatch`

## Setting Up Workflows

1. Create the `.github/workflows` directory
2. Add both workflow files as shown above
3. Configure all required GitHub secrets
4. Push to the `fresh-start` branch to trigger the initial deployment

## Troubleshooting

If deployments fail:
1. Check GitHub Actions logs for specific error messages
2. Verify container build and push steps completed successfully
3. Check Azure Container Apps logs for runtime errors
4. Verify managed identity has appropriate role assignments
5. Test API health endpoint directly

This setup ensures a robust, secure, and modern deployment pipeline for the containerized application.
