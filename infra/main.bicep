// main.bicep - Main Bicep template for A Riff In React
targetScope = 'resourceGroup'

// Parameters
@description('The environment name')
param environmentName string

@description('The location for all resources')
param location string = resourceGroup().location

@description('The name of the Azure Static Web App')
param staticWebAppName string = 'swa-${environmentName}'

@description('The Azure AD B2C Tenant Name (e.g., "yourtenant")')
param b2cTenantName string

@description('The Azure AD B2C Client ID')
@secure()
param b2cClientId string

@description('The Azure AD B2C Sign-in Policy Name')
param b2cSigninPolicy string = 'B2C_1_signupsignin'

@description('The Azure App service plan name')
param appServicePlanName string = 'asp-${environmentName}'

@description('The Azure Key Vault name')
param keyVaultName string = 'kv-${environmentName}'

// Tags
var tags = {
  environment: environmentName
  application: 'A-Riff-In-React'
  azd-env-name: environmentName
}

// Key Vault to store secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    tenantId: subscription().tenantId
    accessPolicies: []
    sku: {
      name: 'standard'
      family: 'A'
    }
  }
}

// Add B2C configuration to Key Vault
resource b2cClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'B2C-CLIENT-ID'
  properties: {
    value: b2cClientId
  }
}

resource b2cTenantNameSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'B2C-TENANT-NAME'
  properties: {
    value: b2cTenantName
  }
}

resource b2cSigninPolicySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'B2C-SIGNIN-POLICY'
  properties: {
    value: b2cSigninPolicy
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

// Static Web App for hosting the React application
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    // Link to GitHub repository would go here in a production deployment
  }
}

// App Configuration for environment variables
resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: 'app-${environmentName}'
  location: location
  tags: union(tags, { 'azd-service-name': 'web' })
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'VITE_B2C_CLIENT_ID'
          value: '@Microsoft.KeyVault(SecretUri=${b2cClientIdSecret.properties.secretUri})'
        }
        {
          name: 'VITE_B2C_TENANT_NAME'
          value: '@Microsoft.KeyVault(SecretUri=${b2cTenantNameSecret.properties.secretUri})'
        }
        {
          name: 'VITE_B2C_SIGNIN_POLICY'
          value: '@Microsoft.KeyVault(SecretUri=${b2cSigninPolicySecret.properties.secretUri})'
        }
        {
          name: 'VITE_REDIRECT_URI'
          value: 'https://app-${environmentName}.azurewebsites.net'
        }
        {
          name: 'VITE_POST_LOGOUT_URI'
          value: 'https://app-${environmentName}.azurewebsites.net'
        }
      ]
    }
  }
}

// Output the web app URL
output webAppUrl string = webApp.properties.defaultHostName
output staticWebAppUrl string = staticWebApp.properties.defaultHostName
