````markdown
# Azure Deployment Guide

## Infrastructure Overview

- **Container Apps**: Express API as a containerized application
- **Static Web Apps**: React SPA with global CDN distribution
- **Database**: Azure SQL Database (shared server pattern) + Cosmos DB
- **Authentication**: Microsoft Entra External ID
- **Container Registry**: GitHub Container Registry (ghcr.io)

**Status**: ✅ **FULLY DEPLOYED AND OPERATIONAL** (as of September 6, 2025)

This guide documents the deployment of **A Riff In React** to Azure, including the complete infrastructure setup with Microsoft Entra External ID authentication.

## 🎉 Current Deployment Status

- ✅ **Azure Infrastructure**: Container Apps environment deployed via Bicep
- ✅ **Web Application**: Live at https://gentle-stone-08653e81e.1.azurestaticapps.net
- ✅ **Backend API**: Live at https://api-a-riff-in-react.westus.azurecontainerapps.io
- ✅ **Authentication**: Microsoft Entra External ID **FULLY WORKING** ✅
- ✅ **CI/CD Pipeline**: GitHub Actions workflows operational
- ✅ **Database**: Azure SQL Database and Cosmos DB with managed identity
- ✅ **Platform Migration**: Successfully migrated from Windows App Service to Container Apps (Sept 2025)

## Authentication Status: ✅ FULLY WORKING

**Microsoft Entra External ID Integration:**
- Client ID: `8e217770-697f-497e-b30b-27b214e87db1`
- Tenant ID: `813307d1-6d39-4c75-8a38-2e34128203bc`
- Redirect URIs: Configured for both localhost and production
- Token Flow: Working perfectly with redirect-based authentication
- User Profiles: Successfully extracted and displayed

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
- **Azure Resource Providers registered** (see [Provider Registration Guide](./provider-registration.md))

> ⚠️ **Important**: Before deploying, ensure all required Azure Resource Providers are registered in your subscription. You can use our automated script: `.\scripts\register-providers.ps1` (Windows) or `./scripts/register-providers.sh` (Linux/macOS).

## Prerequisites
- Azure account
- Azure CLI installed
- Resource group created

## 1. Microsoft Entra Tenant Setup

To enable external user authentication with Microsoft Entra External ID, you can set up app registration either through the Azure portal or programmatically:

### Manual Setup (Azure Portal)

1. **Register Your App in Microsoft Entra**
   - In the Azure Portal, go to **Azure Active Directory** > **App registrations** > **New registration**
   - Configure redirect URIs and authentication settings
   - Note the Application (client) ID and Directory (tenant) ID

### Programmatic Setup

1. **Register Your App in Microsoft Entra**
   ```bash
   # Login to Azure
   az login
   
   # Create app registration
   az ad app create \
     --display-name "A-Riff-In-React-Entra" \
     --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
     --web-redirect-uris "http://localhost:5173" "https://gentle-stone-08653e81e.1.azurestaticapps.net"
   
   # Get the application ID (client ID)
   az ad app list --display-name "A-Riff-In-React-Entra" --query "[].appId" -o tsv
   ```

2. **Configure User Flows**
   - In your Entra tenant, go to **User flows**
   - Create a **Sign up and sign in** flow (e.g., `B2C_1_signupsignin`)
   - Configure the user attributes, application claims, and identity providers
   - Save the flow name for your deployment configuration

   **Programmatic Alternative:**
   ```bash
   # Create user flow through REST API (requires access token)
   # First get an access token for the Microsoft Graph API
   accessToken=$(az account get-access-token --resource https://graph.microsoft.com --query accessToken -o tsv)
   
   # Create a sign-up/sign-in user flow (requires a separate JSON payload file)
   curl -X POST \
     -H "Authorization: Bearer $accessToken" \
     -H "Content-Type: application/json" \
     -d @userflow-payload.json \
     "https://graph.microsoft.com/beta/identity/b2cUserFlows"
   ```

3. **Gather Configuration Values**
   - Entra Tenant Name (e.g., `yourtenant`)
   - Application (Client) ID from the app registration
   - User Flow (Policy) Name (e.g., `B2C_1_signupsignin`)

   **With Azure CLI:**
   ```bash
   # Get the application ID (client ID)
   clientId=$(az ad app list --display-name "A-Riff-In-React-Entra" --query "[0].appId" -o tsv)
   
   # Get the tenant ID
   tenantId=$(az account show --query tenantId -o tsv)
   
   # Export as environment variables
   export B2C_TENANT_NAME="your-b2c-tenant"
   export B2C_CLIENT_ID=$clientId
   export B2C_SIGNIN_POLICY="B2C_1_signupsignin"
   ```

## 2. Provision Azure Resources
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
EXTERNAL_TENANT_ID=your-external-tenant-id
EXTERNAL_CLIENT_ID=your-external-client-id
CONTAINER_IMAGE=ghcr.io/username/a-riff-in-react-api:latest
CONTAINER_REGISTRY=username
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
  containerRegistry=$CONTAINER_REGISTRY \
  externalTenantId=$EXTERNAL_TENANT_ID \
  externalClientId=$EXTERNAL_CLIENT_ID \
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

## 3. Update Configuration Files
Ensure your application can use both local development settings and deployed settings:

1. **Create a `.env.local` file for local development**
   ```
   VITE_ENTRA_CLIENT_ID=your-client-id
   VITE_ENTRA_TENANT_ID=your-external-tenant-id
   VITE_REDIRECT_URI=http://localhost:5173
   VITE_POST_LOGOUT_URI=http://localhost:5173
   VITE_API_URL=http://localhost:3001
   
   # For docker-compose.yml
   SQL_CONNECTION_STRING=Server=localhost;Database=ARiffInReact;User Id=sa;Password=YourPassword;TrustServerCertificate=True;
   COSMOS_ENDPOINT=https://localhost:8081
   COSMOS_KEY=your-local-cosmos-key
   COSMOS_DATABASE=ARiffInReact
   ```

2. **Update `src/config/authConfig.ts` to use Entra configuration**
   Update your configuration to use the Entra settings as shown in the `05-authentication-msal.md` documentation.

3. **Create a `staticwebapp.config.json` file**
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
   This configuration file is essential for:
   - Proper SPA routing (falling back to index.html for client-side routes)
   - Setting correct MIME types for JavaScript modules
   - Configuring security headers

## 4. Deploy the App
The project includes two GitHub Actions workflows for CI/CD:

*   **`container-deploy.yml`**: Builds and deploys the API container to Azure Container Apps
*   **`static-web-deploy.yml`**: Builds and deploys the React frontend to Azure Static Web Apps

These workflows are triggered on pushes to the `main` or `fresh-start` branches. They perform the following steps:

1.  **Container Deploy Workflow**:
    *   Builds the Docker image for the API
    *   Pushes the image to GitHub Container Registry
    *   Deploys the Bicep infrastructure including Container Apps
    *   Verifies the deployment by testing the health endpoint

2.  **Static Web Deploy Workflow**:
    *   Builds the React application with production environment variables
    *   Deploys the built assets to Azure Static Web Apps

See `docs/09-github-actions-ci-cd.md` for detailed pipeline setup instructions.

## 5. Monitor and Maintain

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

---

> _For detailed deployment steps and troubleshooting, see the Flask template's [azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_
````
