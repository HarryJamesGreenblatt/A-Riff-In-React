# GitHub Actions: Azure CI/CD Pipeline

This document provides GitHub Actions workflows for deploying **A Riff In React** to Azure, following the patterns established in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask).

## Overview
- Deploy Azure infrastructure using Bicep templates
- Build and test the React app
- Deploy to Azure App Service
- Integrate with Azure SQL, Cosmos DB, and Key Vault

## Workflows

We provide three GitHub Actions workflows for deployment:

1. **Infrastructure Deployment** (`deploy-infrastructure.yml`): Deploys Azure resources using Bicep templates
2. **Application Deployment** (`deploy-app.yml`): Builds and deploys the React application to Azure
3. **Combined Deployment** (`azure-deploy.yml`): Deploys both infrastructure and application in a single workflow

You can choose to use either the separate workflows or the combined workflow based on your needs:

### Infrastructure Deployment Workflow

```yaml
name: Deploy Azure Infrastructure

on:
  workflow_dispatch:
  push:
    branches:
      - main
    paths:
      - 'infra/**'

jobs:
  deploy-infrastructure:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy Bicep template
        uses: azure/arm-deploy@v1
        with:
          subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          resourceGroupName: ${{ secrets.AZURE_RESOURCE_GROUP }}
          template: ./infra/main.bicep
          parameters: >
            environmentName=${{ secrets.AZURE_ENV_NAME }}
            location=${{ secrets.AZURE_LOCATION }}
            b2cTenantName=${{ secrets.B2C_TENANT_NAME }}
            b2cClientId=${{ secrets.B2C_CLIENT_ID }}
            b2cSigninPolicy=${{ secrets.B2C_SIGNIN_POLICY }}
            sqlAdminPassword=${{ secrets.SQL_ADMIN_PASSWORD }}
      
      - name: Azure Logout
        run: az logout
        if: always()
```

### Application Deployment Workflow

```yaml
name: Deploy React App to Azure

on:
  workflow_dispatch:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'public/**'
      - 'index.html'
      - 'package.json'
      - 'vite.config.ts'
      - 'tsconfig.json'
      - '.github/workflows/deploy-app.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build React app
        run: npm run build
        env:
          VITE_B2C_CLIENT_ID: ${{ secrets.B2C_CLIENT_ID }}
          VITE_B2C_TENANT_NAME: ${{ secrets.B2C_TENANT_NAME }}
          VITE_B2C_SIGNIN_POLICY: ${{ secrets.B2C_SIGNIN_POLICY }}
          VITE_REDIRECT_URI: https://app-${{ secrets.AZURE_ENV_NAME }}.azurewebsites.net
          VITE_POST_LOGOUT_URI: https://app-${{ secrets.AZURE_ENV_NAME }}.azurewebsites.net
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: app-${{ secrets.AZURE_ENV_NAME }}
          package: ./dist
        - name: Azure Logout
        run: az logout
        if: always()
```

### Combined Deployment Workflow

```yaml
name: Azure CI/CD for React App with B2C Auth

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_ENV_NAME: a-riff-in-react
  AZURE_LOCATION: westus

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
          # These placeholder values are needed for build but will be replaced by actual values in Azure
          VITE_B2C_CLIENT_ID: "placeholder-for-build"
          VITE_B2C_TENANT_NAME: "placeholder-for-build"
          VITE_B2C_SIGNIN_POLICY: "placeholder-for-build"
      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy Azure Infrastructure with B2C Configuration
        id: deploy-bicep
        uses: azure/arm-deploy@v1
        with:
          scope: resourcegroup
          subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          resourceGroupName: ${{ secrets.AZURE_RESOURCE_GROUP }}
          template: ./infra/main.bicep
          parameters: >
            environmentName=${{ env.AZURE_ENV_NAME }}
            location=${{ env.AZURE_LOCATION }}
            b2cTenantName=${{ secrets.B2C_TENANT_NAME }}
            b2cClientId=${{ secrets.B2C_CLIENT_ID }}
            b2cSigninPolicy=${{ secrets.B2C_SIGNIN_POLICY }}
            sqlAdminPassword=${{ secrets.SQL_ADMIN_PASSWORD }}
          deploymentName: a-riff-in-react-${{ github.run_number }}
          failOnStdErr: false
      
      - name: Deploy React app to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: app-${{ env.AZURE_ENV_NAME }}
          package: ./dist
      
      - name: Verify B2C Configuration
        run: |
          echo "Verifying B2C configuration in Azure Web App..."
          az webapp config appsettings list --name app-${{ env.AZURE_ENV_NAME }} --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} --query "[?name.startsWith('VITE_B2C_')].{Name:name, Value:value}" --output table
      
      - name: Logout from Azure
        run: az logout
        if: always()
```

## Required GitHub Secrets

Set up the following secrets in your GitHub repository:

- `AZURE_CREDENTIALS`: JSON credentials from Service Principal
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID
- `AZURE_RESOURCE_GROUP`: Resource group name
- `AZURE_ENV_NAME`: Environment name (e.g., `a-riff-in-react`)
- `AZURE_LOCATION`: Azure region (e.g., `westus`)
- `VITE_ENTRA_CLIENT_ID`: Microsoft Entra External ID Application (client) ID
- `VITE_ENTRA_TENANT_ID`: Microsoft Entra tenant ID
- `SQL_ADMIN_PASSWORD`: SQL Server admin password

## Setting Up Service Principal

To create the `AZURE_CREDENTIALS` secret, run:

```bash
# Create a service principal for GitHub Actions
az ad sp create-for-rbac --name "github-actions-a-riff-in-react" --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth

# The output is a JSON object that should be stored in the AZURE_CREDENTIALS GitHub secret
```

## First-Time Setup

1. Create the Azure resource group manually:

```bash
az group create --name your-resource-group --location westus
```

2. Set up all required GitHub secrets

3. Choose your preferred deployment approach:
   - **Option 1**: Run the combined `azure-deploy.yml` workflow to deploy both infrastructure and application at once
   - **Option 2**: Run the infrastructure deployment workflow first, then the application deployment workflow

The combined workflow is recommended for initial setup, while the separate workflows are better for ongoing development where you might need to update just the infrastructure or just the application.

> **Note on Workflow Triggers**: All three workflows can be triggered manually via workflow_dispatch or automatically when changes are pushed to the main branch. However, they are configured to watch different file paths:
> - `deploy-infrastructure.yml`: Triggered on changes to files in the `infra/` directory
> - `deploy-app.yml`: Triggered on changes to application code files
> - `azure-deploy.yml`: Triggered on any push to main (no path filters)
>
> For production environments, you may want to adjust these triggers to avoid unintended deployments.
