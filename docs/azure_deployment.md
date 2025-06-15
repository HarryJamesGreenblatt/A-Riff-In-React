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
- Azure Key Vault (for secure storage of B2C credentials)
- Azure Static Web App (alternative hosting option)
- Azure SQL Database (for structured data)
- Azure Cosmos DB (for flexible data)
- Application Insights (for monitoring)

### Deploy Infrastructure Using Bicep

```bash
# Login to Azure
az login

# Set variables
RESOURCE_GROUP=your-resource-group
LOCATION=westus
ENV_NAME=a-riff-in-react
B2C_TENANT_NAME=your-b2c-tenant
B2C_CLIENT_ID=your-client-id
B2C_SIGNIN_POLICY=B2C_1_signupsignin
SQL_ADMIN_PASSWORD=your-complex-password # Must meet SQL complexity requirements

# Create resource group if needed
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy Bicep template
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file ./infra/main.bicep \
  --parameters environmentName=$ENV_NAME \
  --parameters location=$LOCATION \
  --parameters b2cTenantName=$B2C_TENANT_NAME \
  --parameters b2cClientId=$B2C_CLIENT_ID \
  --parameters b2cSigninPolicy=$B2C_SIGNIN_POLICY \
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

Add these secrets to your GitHub repository:
- `AZURE_CREDENTIALS`: JSON credentials from Service Principal
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID
- `AZURE_RESOURCE_GROUP`: Resource group name
- `AZURE_ENV_NAME`: Environment name (e.g., `a-riff-in-react`)
- `AZURE_LOCATION`: Azure region (e.g., `westus`)
- `B2C_TENANT_NAME`: Your B2C tenant name
- `B2C_CLIENT_ID`: Your B2C client ID
- `B2C_SIGNIN_POLICY`: Your B2C policy name
- `SQL_ADMIN_PASSWORD`: SQL Server admin password

To create the `AZURE_CREDENTIALS` secret, run the following command:

```bash
# Create a service principal for GitHub Actions
az ad sp create-for-rbac --name "github-actions-a-riff-in-react" --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth

# The output is a JSON object that should be stored in the AZURE_CREDENTIALS GitHub secret
```

## 3. Update Configuration Files
Ensure your application can use both local development settings and deployed settings:

1. **Create a `.env.local` file for local development**
   ```
   VITE_ENTRA_CLIENT_ID=your-client-id
   VITE_ENTRA_TENANT_ID=your-b2c-tenant
   VITE_B2C_SIGNIN_POLICY=B2C_1_signupsignin
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
The project includes three GitHub Actions workflows for CI/CD:

1. **deploy-infrastructure.yml**: Deploys only the Azure infrastructure using Bicep
2. **deploy-app.yml**: Builds and deploys only the React application
3. **azure-deploy.yml**: Combined workflow that deploys both infrastructure and application

You can choose which workflow best fits your deployment needs:

- For initial setup, use the combined `azure-deploy.yml` workflow
- For ongoing development, use the separate workflows to deploy only what has changed

See `docs/github_actions_azure.md` for detailed pipeline setup instructions.

## 4. Monitor and Maintain
- Use Application Insights for telemetry
- Regularly update dependencies and review security

---

> _For detailed deployment steps and troubleshooting, see the Flask template’s [azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_
