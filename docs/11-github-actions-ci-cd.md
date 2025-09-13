````markdown
# GitHub Actions: Azure CI/CD Pipeline

**Status**: ✅ **SUCCESSFULLY CONFIGURED AND RUNNING**

This document covers the GitHub Actions workflows for **A Riff In React**, which successfully deploy the containerized API and static web frontend to Azure. The pipeline includes Container Apps deployment, GitHub Container Registry integration, and managed identity configuration.

## 🎉 Current Status

- ✅ **Workflow Status**: Fully operational and tested.
- ✅ **Last Deployment**: Successful - September 6, 2025.
- ✅ **Live API**: `<YOUR_API_URL>`
- ✅ **Live Frontend**: `<YOUR_FRONTEND_URL>`
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
- **SPA Configuration**: Includes staticwebapp.config.json for proper routing and MIME types

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
    branches: [main, fresh-start]
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
    branches: [main, fresh-start]
    paths-ignore:
      - 'api/**'
      - '.github/workflows/container-deploy.yml'
      - 'infra/**'
  workflow_dispatch:

env:
  AZURE_RESOURCE_GROUP: riffinreact-rg
  AZURE_STATIC_WEB_APP_NAME: a-riff-in-react
  API_URL: <YOUR_API_URL>

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ env.API_URL }}
          VITE_EXTERNAL_CLIENT_ID: ${{ secrets.EXTERNAL_CLIENT_ID }}
          VITE_EXTERNAL_TENANT_ID: ${{ secrets.EXTERNAL_TENANT_ID }}
      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "build"
          skip_app_build: true
          api_location: "" # No API folder as we're using Container Apps
          output_location: ""
```

Key features:
- Sets up Node.js environment
- Builds React app with appropriate environment variables (using Vite prefixes)
- Deploys to Azure Static Web Apps
- Configures API URL to point to Container App
- Uses staticwebapp.config.json (at the root of the project) for SPA routing and MIME types

## Important Configuration Files

### `staticwebapp.config.json`

This file is essential for proper SPA functioning:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*", "/assets/*"]
  },
  "routes": [
    {
      "route": "/*",
      "rewrite": "/index.html"
    }
  ],
  "mimeTypes": {
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".json": "application/json",
    ".svg": "image/svg+xml"
  },
  "globalHeaders": {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' *.azurecontainerapps.io *.microsoftonline.com *.microsoft.com",
    "X-Content-Type-Options": "nosniff"
  }
}
```

This configuration:
- Ensures SPA routes work by redirecting to index.html
- Sets correct MIME types for JavaScript modules
- Configures security headers
- Is automatically deployed as part of the Static Web App workflow

## Workflow Integration

The two workflows work together but are triggered independently:
- Changes to API code or infrastructure trigger the container workflow
- Changes to frontend code trigger the Static Web Apps workflow
- Manual triggers are available through `workflow_dispatch`

## Setting Up Workflows

1. Create the `.github/workflows` directory
2. Add both workflow files as shown above
3. Configure all required GitHub secrets
4. Push to the `main` or `fresh-start` branch to trigger the initial deployment

## Troubleshooting

If deployments fail:
1. Check GitHub Actions logs for specific error messages
2. Verify container build and push steps completed successfully
3. Check Azure Container Apps logs for runtime errors
4. Verify managed identity has appropriate role assignments
5. Test API health endpoint directly
6. For Static Web App routing issues, check staticwebapp.config.json configuration
7. For MIME type errors, ensure the mimeTypes section in staticwebapp.config.json is correctly configured

This setup ensures a robust, secure, and modern deployment pipeline for the containerized application.

````
