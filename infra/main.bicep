@description('The environment name. This will be used as a prefix for all resources.')
param environmentName string = 'a-riff-in-react'

@description('The Azure region for all resources.')
param location string = resourceGroup().location

@description('The container image to deploy')
param containerImage string = '${containerRegistry}/${environmentName}-api:latest'

@description('Azure Container Registry URL')
param containerRegistry string = 'ariffreactacr.azurecr.io'

@description('Azure Container Registry username')
param containerRegistryUsername string

@description('Azure Container Registry password')
@secure()
param containerRegistryPassword string

@description('The Microsoft Entra External ID tenant ID')
param externalTenantId string

@description('The Microsoft Entra External ID client ID')
param externalClientId string

// Existing resources to reference
@description('The name of the existing SQL Server')
param existingSqlServerName string = 'sequitur-sql-server'

@description('The resource group of the existing SQL Server')
param existingSqlServerResourceGroup string = 'db-rg'

@description('The name of the existing SQL Database')
param existingSqlDatabaseName string = 'riff-react-db'

// Note: Cosmos DB is mentioned in docs but not implemented in current infrastructure
// This parameter is commented out as it's not currently used
// @description('The name of the existing Cosmos DB account')
// param existingCosmosDbAccountName string = 'cosmos-a-riff-in-react'

// Variables for resource naming
var containerAppEnvName = 'env-${environmentName}'
var containerAppName = 'ca-api-${environmentName}' // Changed prefix to prevent conflicts with existing App Service
var logAnalyticsName = 'log-${environmentName}'
var managedIdentityName = 'id-${environmentName}'

// Tags for all resources
var tags = {
  application: 'A-Riff-In-React'
  environment: environmentName
  azd_env_name: environmentName
}

// Reference to existing SQL Server
var sqlServerFqdn = '${existingSqlServerName}.database.windows.net'

// Note: Cosmos DB is mentioned in docs but not implemented in current infrastructure
// We'll remove references to Cosmos DB for now to simplify deployment

// Create a user-assigned managed identity for the Container App
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
  tags: tags
}

// Log Analytics workspace for container app logs
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 1
    }
  }
}

// Reference existing Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: 'appi-${environmentName}'
}

// Container Apps Environment
resource containerAppEnvironment 'Microsoft.App/managedEnvironments@2022-10-01' = {
  name: containerAppEnvName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Container App for API
resource containerApp 'Microsoft.App/containerApps@2022-10-01' = {
  name: containerAppName
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnvironment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
        corsPolicy: {
          allowedOrigins: ['*']
        }
      }
      registries: [
        {
          server: containerRegistry
          username: containerRegistryUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'sql-connection-string'
          value: 'Server=${sqlServerFqdn};Database=${existingSqlDatabaseName};Authentication=Active Directory Default;'
        }
        {
          name: 'ai-connection-string'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'acr-password'
          value: containerRegistryPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '8080'
            }
            {
              name: 'SQL_SERVER'
              value: sqlServerFqdn
            }
            {
              name: 'SQL_DATABASE'
              value: existingSqlDatabaseName
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'ai-connection-string'
            }
            {
              name: 'EXTERNAL_TENANT_ID'
              value: externalTenantId
            }
            {
              name: 'EXTERNAL_CLIENT_ID'
              value: externalClientId
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling-rule'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

// Reference existing App Service (not Static Web App)
@description('The name of the existing web app')
param webAppName string = 'a-riff-in-react'

// Reference existing Key Vault
@description('The name of the existing key vault')
param keyVaultName string = 'kv-a-riff-in-react'

// Update Key Vault access policy - done manually
output keyVaultAccessInstructions string = '''
To manually grant the managed identity access to Key Vault:
1. Navigate to the Key Vault: ${keyVaultName} in the Azure Portal
2. Go to "Access policies"
3. Add a new access policy with the following details:
   - Principal: ${managedIdentity.properties.principalId}
   - Secret permissions: Get, List
'''

// SQL Database access - simplified approach without deployment script
// We'll just output instructions for manual role assignment since
// the identity doesn't have sufficient permissions to execute the script
output sqlRoleAssignmentInstructions string = '''
To manually assign the necessary SQL permissions:
1. Use the Azure Portal to navigate to the SQL Server: ${existingSqlServerName} in resource group ${existingSqlServerResourceGroup}
2. Go to "Azure Active Directory" and ensure the server has an Azure AD admin configured
3. Connect to the database ${existingSqlDatabaseName} using that admin
4. Execute the following T-SQL:
   CREATE USER [${managedIdentity.properties.principalId}] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [${managedIdentity.properties.principalId}];
'''

// Remove Cosmos DB role assignment since we're not creating Cosmos DB yet

// Outputs
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output webAppUrl string = 'https://${webAppName}.azurewebsites.net'
output managedIdentityId string = managedIdentity.id
