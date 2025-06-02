# GitHub Actions: Azure CI/CD Pipeline

This document provides GitHub Actions workflows for deploying **A Riff In React** to Azure, following the patterns established in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask).

## Overview
- Deploy Azure infrastructure using Bicep templates
- Build and test the React app
- Deploy to Azure App Service
- Integrate with Azure SQL, Cosmos DB, and Key Vault

## Workflows

We use two GitHub Actions workflows for deployment:

1. **Infrastructure Deployment**: Deploys Azure resources using Bicep templates
2. **Application Deployment**: Builds and deploys the React application to Azure

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

## Required GitHub Secrets

Set up the following secrets in your GitHub repository:

- `AZURE_CREDENTIALS`: JSON credentials from Service Principal
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID
- `AZURE_RESOURCE_GROUP`: Resource group name
- `AZURE_ENV_NAME`: Environment name (e.g., `a-riff-in-react`)
- `AZURE_LOCATION`: Azure region (e.g., `eastus`)
- `B2C_TENANT_NAME`: Your B2C tenant name
- `B2C_CLIENT_ID`: Your B2C client ID
- `B2C_SIGNIN_POLICY`: Your B2C policy name
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
az group create --name your-resource-group --location eastus
```

2. Set up all required GitHub secrets

3. Run the infrastructure deployment workflow first

4. Run the application deployment workflow after infrastructure is ready
