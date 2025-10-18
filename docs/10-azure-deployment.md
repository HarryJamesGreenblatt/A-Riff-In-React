# Azure Deployment Guide

## Infrastructure Overview

- **Container Apps**: Express API as a containerized application
- **Static Web Apps**: React SPA with global CDN distribution
- **Database**: Azure SQL Database (shared server pattern) + Cosmos DB
- **Authentication**: JWT-based (email/password)
- **Container Registry**: GitHub Container Registry (ghcr.io)

**Status**: ✅ **FULLY DEPLOYED AND OPERATIONAL**

This guide documents the deployment of **A Riff In React** to Azure, including the complete infrastructure setup with JWT-based authentication.

## 🎉 Current Deployment Status

- ✅ **Azure Infrastructure**: Container Apps environment deployed via Bicep
- ✅ **Web Application**: Live at `https://a-riff-in-react.harryjamesgreenblatt.com` (custom domain, SSL enabled)
- ✅ **Backend API**: Live at `https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io`
- ✅ **Authentication**: JWT-based authentication **FULLY WORKING** ✅
- ✅ **CI/CD Pipeline**: GitHub Actions workflows operational
- ✅ **Database**: Azure SQL Database and Cosmos DB with managed identity
- ✅ **Platform Migration**: Successfully migrated from Windows App Service to Container Apps

## Authentication Status: ✅ JWT-Based

**JWT Authentication Implementation:**
- Email/password registration and login
- bcrypt password hashing (10 rounds)
- JWT tokens with 7-day expiry
- Tokens stored in localStorage
- No external identity providers required

## Deployed Resources

| Resource | Name | Purpose | Status |
|----------|------|---------|--------|
| Resource Group | `riffinreact-rg` | Primary resource group | ✅ Active |
| Container Apps Environment | `env-a-riff-in-react` | Container Apps hosting environment | ✅ Active |
| Container App | `api-a-riff-in-react` | API hosting | ✅ Active |
| Static Web App | `a-riff-in-react` | React app hosting | ✅ Active |
| SQL Server | `sequitur-sql-server` (Shared) | Relational database server | ✅ Active |
| SQL Database | `riff-react-db` | Application-specific database | ✅ Active |
| Cosmos DB | `cosmos-a-riff-in-react` | NoSQL database | ✅ Active |
| User-Assigned Managed Identity | `id-a-riff-in-react` | Secure database access | ✅ Active |
| Log Analytics | `log-a-riff-in-react` | Monitoring | ✅ Active |

## Prerequisites

- Azure account with subscription
- Azure CLI installed
- Resource group created
- **Azure Resource Providers registered** (see [Provider Registration Guide](./09-provider-registration.md))

> ⚠️ **Important**: Before deploying, ensure all required Azure Resource Providers are registered in your subscription. You can use our automated script: `.\scripts\register-providers.ps1` (Windows) or `./scripts/register-providers.sh` (Linux/macOS).

## 1. Provision Azure Resources

The project includes a Bicep template in the `infra` folder that provisions:

- Azure Container Apps (for containerized API hosting)
- Azure Static Web Apps (for frontend hosting)
- User-Assigned Managed Identity (for secure database access)
- Azure SQL Database (for structured data, deployed to a shared server)
- Azure Cosmos DB (for flexible data)
- Application Insights (for monitoring, disabled by default)

### Deploy Infrastructure Using Bicep

The Bicep template is designed to deploy the application's database to a pre-existing, shared SQL server to optimize costs.

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP=riffinreact-rg
LOCATION=westus
ENV_NAME=a-riff-in-react
CONTAINER_IMAGE=ghcr.io/username/a-riff-in-react-api:latest
CONTAINER_REGISTRY_USERNAME=username
CONTAINER_REGISTRY_PASSWORD=your-pat-token
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
EXISTING_SQL_SERVER_NAME=sequitur-sql-server
EXISTING_SQL_SERVER_RG=db-rg
EXISTING_SQL_DATABASE_NAME=riff-react-db
EXISTING_COSMOS_DB_NAME=cosmos-a-riff-in-react

# Create resource group if needed
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy Bicep template
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file ./infra/main.bicep \
  --parameters environmentName=$ENV_NAME \
  location=$LOCATION \
  containerImage=$CONTAINER_IMAGE \
  containerRegistryUsername=$CONTAINER_REGISTRY_USERNAME \
  containerRegistryPassword=$CONTAINER_REGISTRY_PASSWORD \
  jwtSecret=$JWT_SECRET \
  existingSqlServerName=$EXISTING_SQL_SERVER_NAME \
  existingSqlServerResourceGroup=$EXISTING_SQL_SERVER_RG \
  existingSqlDatabaseName=$EXISTING_SQL_DATABASE_NAME \
  existingCosmosDbAccountName=$EXISTING_COSMOS_DB_NAME
```

### Configure GitHub Secrets for CI/CD

The CI/CD pipeline requires a Service Principal with sufficient permissions to deploy resources. Since the deployment targets two different resource groups (`riffinreact-rg` and the shared `db-rg`), the Service Principal must have the **Contributor** role assigned at the **Subscription** scope.

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
    *   `JWT_SECRET`: Your JWT signing secret (min 32 characters).
    *   `CONTAINER_REGISTRY_USERNAME`: GitHub username for container registry.
    *   `CONTAINER_REGISTRY_PASSWORD`: GitHub Personal Access Token with package write permissions.

## 2. Update Configuration Files

Ensure your application can use both local development settings and deployed settings:

1. **Create a `.env.local` file for local development**
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:3001
   
   # For production:
   # VITE_API_BASE_URL=https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io
   ```

2. **Create a `staticwebapp.config.json` file** (at project root)
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
       "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' *.azurecontainerapps.io",
       "X-Content-Type-Options": "nosniff"
     }
   }
   ```
   This configuration file is essential for:
   - Proper SPA routing (falling back to index.html for client-side routes)
   - Setting correct MIME types for JavaScript modules
   - Configuring security headers

## 3. Deploy the App

The project includes two GitHub Actions workflows for CI/CD:

*   **`container-deploy.yml`**: Builds and deploys the API container to Azure Container Apps
*   **`static-web-deploy.yml`**: Builds and deploys the React frontend to Azure Static Web Apps

These workflows are triggered on pushes to the `main` branch. They perform the following steps:

1.  **Container Deploy Workflow**:
    *   Builds the Docker image for the API
    *   Pushes the image to GitHub Container Registry
    *   Deploys the Bicep infrastructure including Container Apps
    *   Verifies the deployment by testing the health endpoint

2.  **Static Web Deploy Workflow**:
    *   Builds the React application with production environment variables
    *   Deploys the built assets to Azure Static Web Apps

See `docs/11-github-actions-ci-cd.md` for detailed pipeline setup instructions.

## 4. Monitor and Maintain

### API Monitoring

To check the Container App logs:

```bash
# View Container App logs
az containerapp logs show -n api-$ENV_NAME -g $RESOURCE_GROUP
```

### Checking API Status

```bash
# Get the Container App URL
API_URL=$(az containerapp show -n api-$ENV_NAME -g $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)

# Test the health endpoint
curl https://$API_URL/health
```

### Frontend Monitoring

```bash
# Get the Static Web App URL
FRONTEND_URL=$(az staticwebapp show -n $ENV_NAME -g $RESOURCE_GROUP --query "defaultHostname" -o tsv)

# Open in browser
echo "https://$FRONTEND_URL"
```

## Optional: Extending with Enterprise Authentication

While this template uses JWT authentication by default, you can extend it with enterprise identity providers if needed:

- **Azure AD / Entra ID**: For organizational users
- **OAuth Providers**: Google, GitHub, Microsoft social login
- **SAML/OIDC**: Enterprise SSO integration

See the archived documentation in `docs/archive/` for MSAL/Entra External ID implementation examples.

---

> _For additional deployment examples, see the Flask template's [azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_
