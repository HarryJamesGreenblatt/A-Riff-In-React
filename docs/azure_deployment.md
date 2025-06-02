# Azure Deployment Guide

This guide explains how to deploy **A Riff In React** to Azure, following best practices for App Service, Azure SQL, Cosmos DB, Key Vault, and Application Insights, with a focus on the Azure AD B2C authentication setup.

> _Deployment strategies and rationale are adapted from [A Fugue In Flask: azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_

## Prerequisites
- Azure account
- Azure CLI installed
- Resource group created

## 1. Azure B2C Tenant Setup

To enable external user authentication with B2C, you can set up an Azure AD B2C tenant either through the Azure portal or programmatically:

### Option A: Azure Portal (Manual Setup)

1. **Create an Azure AD B2C Tenant**
   - In the Azure Portal, search for **Azure AD B2C** and follow the wizard to create a new B2C directory
   - Switch your portal session to the new B2C directory after creation (using the top-right directory switcher)

2. **Register the SPA Application**
   - In your B2C tenant, go to **App registrations** and click **New registration**
   - Name: `A-Riff-In-React-B2C`
   - Supported account types: **Accounts in any identity provider or organizational directory**
   - Redirect URI: Add both your development URL (e.g., `http://localhost:5173`) and production URL

### Option B: Programmatic Setup (Azure CLI)

1. **Create an Azure AD B2C Tenant**
   ```bash
   # Login to Azure
   az login
   
   # Create B2C tenant (one-time operation)
   az ad b2c tenant create \
     --organization-name "YourB2CTenant" \
     --initial-domain-name "your-b2c-tenant" \
     --sku-name "PremiumP1"
   
   # Switch to the B2C tenant
   az login --tenant your-b2c-tenant.onmicrosoft.com
   ```

2. **Register the SPA Application**
   ```bash
   # Create app registration
   az ad app create \
     --display-name "A-Riff-In-React-B2C" \
     --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
     --web-redirect-uris "http://localhost:5173" "https://your-production-url"
   
   # Get the application ID (client ID)
   az ad app list --display-name "A-Riff-In-React-B2C" --query "[].appId" -o tsv
   ```

3. **Configure User Flows**
   - In your B2C tenant, go to **User flows**
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

4. **Gather Configuration Values**
   - B2C Tenant Name (e.g., `yourtenant`)
   - Application (Client) ID from the app registration
   - User Flow (Policy) Name (e.g., `B2C_1_signupsignin`)

   **With Azure CLI:**
   ```bash
   # Get the application ID (client ID)
   clientId=$(az ad app list --display-name "A-Riff-In-React-B2C" --query "[0].appId" -o tsv)
   
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
LOCATION=eastus
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
- `AZURE_LOCATION`: Azure region (e.g., `eastus`)
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
   VITE_B2C_CLIENT_ID=your-client-id
   VITE_B2C_TENANT_NAME=your-b2c-tenant
   VITE_B2C_SIGNIN_POLICY=B2C_1_signupsignin
   VITE_REDIRECT_URI=http://localhost:5173
   VITE_POST_LOGOUT_URI=http://localhost:5173
   
   # Database connection strings (for local development)
   SQL_CONNECTION_STRING=Server=localhost;Database=ARiffInReact;User Id=sa;Password=YourPassword;TrustServerCertificate=True;
   COSMOS_ENDPOINT=https://localhost:8081
   COSMOS_KEY=your-local-cosmos-key
   COSMOS_DATABASE=ARiffInReact
   ```

2. **Update `src/config/authConfig.ts` to use B2C configuration**
   Update your configuration to use the B2C settings as shown in the `05-authentication-msal.md` documentation.

## 4. Deploy the App
- Two GitHub Actions workflows have been set up for CI/CD:
  - `deploy-infrastructure.yml`: Deploys the Azure infrastructure using Bicep
  - `deploy-app.yml`: Builds and deploys the React application
- See `docs/github_actions_azure.md` for detailed pipeline setup instructions

## 4. Monitor and Maintain
- Use Application Insights for telemetry
- Regularly update dependencies and review security

---

> _For detailed deployment steps and troubleshooting, see the Flask template’s [azure_deployment.md](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask/blob/main/docs/azure_deployment.md)_
