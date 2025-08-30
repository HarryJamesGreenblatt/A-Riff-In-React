# Azure Deployment Guide

**Status**: ✅ **SUCCESSFULLY DEPLOYED** to https://a-riff-in-react.azurewebsites.net

This guide documents the deployment of **A Riff In React** to Azure, including the complete infrastructure setup with Microsoft Entra External ID authentication and a shared database server architecture.

> _Successfully migrated from Azure AD B2C to Microsoft Entra External ID and refactored to use a shared SQL Server for cost optimization._

## 🎉 Current Deployment Status

- ✅ **Azure Infrastructure**: Deployed via Bicep templates using a shared SQL Server.
- ✅ **Web Application**: Live at https://a-riff-in-react.azurewebsites.net
- ✅ **Authentication**: Microsoft Entra External ID configured.
- ✅ **CI/CD Pipeline**: GitHub Actions workflow is fully operational.
- ✅ **Cost Optimized**: Uses a shared SQL server and has Application Insights disabled by default.

## Deployed Resources

| Resource | Name | Purpose | Status |
|----------|------|---------|--------|
| Web App | `a-riff-in-react` | React app hosting | ✅ Active |
| SQL Server | `sequitur-sql-server` (Shared) | Relational database server | ✅ Active |
| SQL Database | `riff-react-db` | Application-specific database | ✅ Active |
| Cosmos DB | `cosmos-a-riff-in-react` | NoSQL database | ✅ Active |
| Key Vault | `kv-a-riff-in-react` | Secrets management | ✅ Active |
| Log Analytics | `log-a-riff-in-react` | Monitoring | ✅ Active |

# Azure Deployment Guide

This guide explains how to deploy **A Riff In React** to Azure, following best practices for App Service, Azure SQL, Cosmos DB, Key Vault, and Application Insights, with a focus on the Microsoft Entra External ID authentication setup.

> _Deployment strategies and rationale are adapted from [A Fugue In Flask: azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_

## Prerequisites
- Azure account
- Azure CLI installed
- Resource group created

## 1. Microsoft Entra Tenant Setup

To enable external user authentication with Microsoft Entra External ID, you can set up app registration either through the Azure portal or programmatically:

## Manual Setup (Azure Portal)

1. **Register Your App in Microsoft Entra**
   - In the Azure Portal, go to **Azure Active Directory** > **App registrations** > **New registration**
   - Configure redirect URIs and authentication settings
   - Note the Application (client) ID and Directory (tenant) ID

## Programmatic Setup

1. **Register Your App in Microsoft Entra**
   ```bash
   # Login to Azure
   az login
   
   # Create app registration
   az ad app create \
     --display-name "A-Riff-In-React-Entra" \
     --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
     --web-redirect-uris "http://localhost:5173" "https://your-production-url"
   
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

- Azure App Service (for frontend hosting)
- Azure Function App (for backend Node.js API)
- Azure Key Vault (for secure storage of credentials)
- **Azure SQL Database** (for structured data, deployed to a shared server)
- Azure Cosmos DB (for flexible data)
- Application Insights (for monitoring, disabled by default)

### Deploy Infrastructure Using Bicep

The Bicep template is designed to deploy the application's database to a pre-existing, shared SQL server to optimize costs.

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP=your-resource-group
LOCATION=westus
ENV_NAME=a-riff-in-react
EXTERNAL_TENANT_ID=your-external-tenant-id
EXTERNAL_CLIENT_ID=your-external-client-id
SHARED_SQL_SERVER_NAME=sequitur-sql-server
SHARED_SQL_SERVER_RG=db-rg
SQL_ADMIN_PASSWORD=your-complex-password # Must meet SQL complexity requirements

# Create resource group if needed
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy Bicep template
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file ./infra/main.bicep \
  --parameters environmentName=$ENV_NAME \
  --parameters location=$LOCATION \
  --parameters externalTenantId=$EXTERNAL_TENANT_ID \
  --parameters externalClientId=$EXTERNAL_CLIENT_ID \
  --parameters sharedSqlServerName=$SHARED_SQL_SERVER_NAME \
  --parameters sharedSqlServerResourceGroupName=$SHARED_SQL_SERVER_RG \
  --parameters sqlAdminPassword=$SQL_ADMIN_PASSWORD
```

### Using Terraform (Alternative)

If you prefer Terraform, you can create equivalent infrastructure:

1. Create a `main.tf` file in the `infra` folder:

```hcl
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.environment_name}"
  location = var.location
}

resource "azurerm_key_vault" "kv" {
  name                = "kv-${var.environment_name}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
}

# Add B2C secrets
resource "azurerm_key_vault_secret" "b2c_client_id" {
  name         = "B2C-CLIENT-ID"
  value        = var.b2c_client_id
  key_vault_id = azurerm_key_vault.kv.id
}

# Continue with App Service, SQL, Cosmos DB etc.
```

2. Deploy with Terraform:

```bash
cd infra
terraform init
terraform apply -var="environment_name=$ENV_NAME" \
  -var="location=$LOCATION" \
  -var="b2c_tenant_name=$B2C_TENANT_NAME" \
  -var="b2c_client_id=$B2C_CLIENT_ID" \
  -var="b2c_signin_policy=$B2C_SIGNIN_POLICY" \
  -var="sql_admin_password=$SQL_ADMIN_PASSWORD"
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
   
   # Database connection strings (for local development)
   SQL_CONNECTION_STRING=Server=localhost;Database=ARiffInReact;User Id=sa;Password=YourPassword;TrustServerCertificate=True;
   COSMOS_ENDPOINT=https://localhost:8081
   COSMOS_KEY=your-local-cosmos-key
   COSMOS_DATABASE=ARiffInReact
   ```

2. **Update `src/config/authConfig.ts` to use Entra configuration**
   Update your configuration to use the Entra settings as shown in the `05-authentication-msal.md` documentation.

## 4. Deploy the App
The project includes a primary GitHub Actions workflow for CI/CD:

*   **`azure-deploy.yml`**: A comprehensive workflow that deploys both the Azure infrastructure via Bicep and builds/deploys the React application to App Service.

This workflow is triggered on pushes to the `main` branch. It performs the following steps:

1.  **Provision Infrastructure**: Runs the Bicep templates from the `infra/` directory to create or update all necessary Azure resources, including the App Service for the frontend and the Function App for the backend.
2.  **Build & Deploy Backend**:
    *   Navigates to the `api/` directory.
    *   Builds the Node.js/TypeScript project.
    *   Deploys the compiled code to the Azure Function App.
3.  **Build & Deploy Frontend**:
    *   Navigates to the root directory.
    *   Builds the React application.
    *   Deploys the static assets to the Azure App Service.

See `docs/github_actions_azure.md` for detailed pipeline setup instructions.


## 4. Monitor and Maintain
- Use Application Insights for telemetry
- Regularly update dependencies and review security

---

> _For detailed deployment steps and troubleshooting, see the Flask template’s [azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_
