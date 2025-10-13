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

@description('JWT secret for signing authentication tokens (min 32 characters)')
@secure()
param jwtSecret string

@description('Allowed CORS origins (comma-separated)')
param corsOrigins string = 'https://a-riff-in-react.harryjamesgreenblatt.com,http://localhost:5173'

// Existing resources to reference
@description('The name of the existing SQL Server')
param existingSqlServerName string = 'sequitur-sql-server'

@description('The resource group of the existing SQL Server')
param existingSqlServerResourceGroup string = 'db-rg'

@description('The name of the existing SQL Database')
param existingSqlDatabaseName string = 'riff-react-db'

@description('The name of the existing Cosmos DB account')
param existingCosmosDbAccountName string = 'riff-react-cosmos-db'

@description('The resource group of the existing Cosmos DB account. Following the Scaffolding architecture pattern, all database resources (SQL and Cosmos DB) should be in the db-rg resource group.')
param existingCosmosDbResourceGroup string = 'db-rg'

// Variables for resource naming
var containerAppEnvName = 'env-${environmentName}'
var containerAppName = 'ca-api-${environmentName}'
var logAnalyticsName = 'log-${environmentName}'
var managedIdentityName = 'id-${environmentName}'

// Tags for all resources
var tags = {
  application: 'A-Riff-In-React'
  environment: environmentName
  azd_env_name: environmentName
  authStrategy: 'JWT'
}

// Reference to existing SQL Server - using environment() function for cloud compatibility
// Use replace to collapse accidental double-dots if any component produces an extra '.'
var sqlServerFqdn = replace('${existingSqlServerName}.${environment().suffixes.sqlServerHostname}', '..', '.')

// Parse CORS origins from comma-separated string
var corsOriginsArray = split(corsOrigins, ',')

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

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${environmentName}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 30
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
        corsPolicy: {
          allowedOrigins: corsOriginsArray
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
          exposeHeaders: ['*']
          maxAge: 3600
          allowCredentials: true
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
          name: 'jwt-secret'
          value: jwtSecret
        }
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
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'JWT_EXPIRY'
              value: '7d'
            }
            // Canonical SQL env names used by the application. Keep these; do not rely on legacy aliases.
            {
              name: 'SQL_SERVER'
              value: sqlServerFqdn
            }
            {
              name: 'SQL_DATABASE'
              value: existingSqlDatabaseName
            }
            // Expose the managed identity client id using the standard AZURE_CLIENT_ID name
            {
              name: 'AZURE_CLIENT_ID'
              value: managedIdentity.properties.clientId
            }
            {
              name: 'COSMOS_ENDPOINT'
              value: 'https://${existingCosmosDbAccountName}.documents.azure.com:443/'
            }
            {
              name: 'COSMOS_DATABASE_NAME'
              value: 'ARiffInReact'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              secretRef: 'ai-connection-string'
            }
            {
              name: 'CORS_ORIGINS'
              value: corsOrigins
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

// ============================================================================
// STATIC WEB APP - MANAGED SEPARATELY VIA FRONTEND WORKFLOW
// ============================================================================
// The Static Web App (swa-a-riff-in-react) is NOT managed by this Bicep template.
// 
// Reason: Azure ARM has limitations when updating GitHub-integrated Static Web Apps
// via Bicep, causing "content already consumed" deployment errors.
//
// Frontend Deployment:
//   - Managed by: .github/workflows/frontend-deploy.yml
//   - Triggers on: Changes to src/**, public/**, etc.
//   - Deployment Method: Azure CLI + Static Web Apps Deploy action
//   - Auto-creates Static Web App if it doesn't exist
//
// This separation provides:
//   ? Reliable infrastructure deployments (no ARM conflicts)
//   ? Independent frontend/backend deployment cycles
//   ? Cleaner separation of concerns
//
// See: docs/Auth/ROOT-CAUSE-VERIFIED.md for detailed explanation
// ============================================================================

// SQL Database role assignment module - DISABLED
// Moved to GitHub workflow post-deployment step
// Reason: Deployment script resources have limitations:
//   1. Need managed identity with SQL admin permissions
//   2. Cross-resource-group authentication complexity
//   3. Additional Azure costs for deployment script executions
//   4. Simpler to handle in workflow with proper error handling
//
// Current approach: GitHub workflow attempts automated setup, falls back to clear manual instructions
// See: .github/workflows/container-deploy.yml (Setup SQL Managed Identity Access step)
//
// module sqlRoleAssignment 'modules/sqlRoleAssignment.bicep' = {
//   name: 'sqlRoleAssignment'
//   scope: resourceGroup(existingSqlServerResourceGroup)
//   params: {
//     sqlServerName: existingSqlServerName
//     principalId: managedIdentity.properties.principalId
//     roleName: 'db_datareader'
//   }
// }

// Cosmos DB role assignment module
module cosmosRoleAssignment 'modules/cosmosRoleAssignment.bicep' = {
  name: 'cosmosRoleAssignment'
  scope: resourceGroup(existingCosmosDbResourceGroup)
  params: {
    cosmosDbAccountName: existingCosmosDbAccountName
    principalId: managedIdentity.properties.principalId
    roleDefinitionId: '00000000-0000-0000-0000-000000000002' // Built-in Cosmos DB Data Contributor role
  }
}

// Outputs
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output managedIdentityId string = managedIdentity.id
output managedIdentityClientId string = managedIdentity.properties.clientId
output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString

// NOTE: Static Web App URL is not output here because the resource is managed separately.
// To get the Static Web App URL, use:
//   az staticwebapp show --name swa-a-riff-in-react --resource-group riffinreact-rg --query defaultHostname -o tsv
