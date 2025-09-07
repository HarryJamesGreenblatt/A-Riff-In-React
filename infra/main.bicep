@description('The environment name. This will be used as a prefix for all resources.')
param environmentName string = 'a-riff-in-react'

@description('The Azure region for all resources.')
param location string = resourceGroup().location

@description('The container image to deploy')
param containerImage string = '${containerRegistry}/${environmentName}-api:latest'

@description('Azure Container Registry URL')
param containerRegistry string = 'ariffacr.azurecr.io'

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

@description('The name of the existing Cosmos DB account')
param existingCosmosDbAccountName string = 'cosmos-a-riff-in-react'

// Variables for resource naming
var containerAppEnvName = 'env-${environmentName}'
var containerAppName = 'api-${environmentName}'
var logAnalyticsName = 'log-${environmentName}'
var applicationInsightsName = 'ai-${environmentName}'
var keyVaultName = 'kv-${take(replace(environmentName, '-', ''), 20)}-${uniqueString(resourceGroup().id)}'
var staticWebAppName = '${environmentName}'
var managedIdentityName = 'id-${environmentName}'

// Tags for all resources
var tags = {
  application: 'A-Riff-In-React'
  environment: environmentName
  azd_env_name: environmentName
}

// Reference to existing SQL Server
resource existingSqlServer 'Microsoft.Sql/servers@2021-11-01' existing = {
  name: existingSqlServerName
  scope: resourceGroup(existingSqlServerResourceGroup)
}

// Reference to existing Cosmos DB
resource existingCosmosDb 'Microsoft.DocumentDB/databaseAccounts@2022-08-15' existing = {
  name: existingCosmosDbAccountName
}

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

// Application Insights for monitoring
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
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
        cors: {
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
          value: 'Server=${existingSqlServer.properties.fullyQualifiedDomainName};Database=${existingSqlDatabaseName};Authentication=Active Directory Default;'
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
            cpu: '0.5'
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
              value: existingSqlServer.properties.fullyQualifiedDomainName
            }
            {
              name: 'SQL_DATABASE'
              value: existingSqlDatabaseName
            }
            {
              name: 'COSMOS_ENDPOINT'
              value: existingCosmosDb.properties.documentEndpoint
            }
            {
              name: 'COSMOS_DATABASE_ID'
              value: 'ARiffInReact'
            }
            {
              name: 'COSMOS_CONTAINER_ID'
              value: 'activities'
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

// Static Web App for frontend
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    provider: 'GitHub'
    repositoryUrl: 'https://github.com/HarryJamesGreenblatt/A-Riff-In-React'
    branch: 'fresh-start'
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: 'dist'
    }
  }
}

// Key Vault for secrets
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: managedIdentity.properties.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
    enableRbacAuthorization: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    publicNetworkAccess: 'Enabled'
  }
}

// Key Vault secrets
resource keyVaultSecretExternal 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'EXTERNAL-CLIENT-ID'
  properties: {
    value: externalClientId
  }
}

// SQL Database access for managed identity
module sqlRoleAssignment 'modules/sqlRoleAssignment.bicep' = {
  name: 'sqlRoleAssignment'
  scope: resourceGroup(existingSqlServerResourceGroup)
  params: {
    sqlServerName: existingSqlServerName
    principalId: managedIdentity.properties.principalId
    roleName: 'db_datareader'
  }
}

// Cosmos DB access for managed identity
module cosmosRoleAssignment 'modules/cosmosRoleAssignment.bicep' = {
  name: 'cosmosRoleAssignment'
  params: {
    cosmosDbAccountName: existingCosmosDbAccountName
    principalId: managedIdentity.properties.principalId
    roleDefinitionId: 'fbdf93bf-df7d-467e-a4d2-9458aa1360c8' // Cosmos DB Data Contributor
  }
}

// Outputs
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output managedIdentityId string = managedIdentity.id
