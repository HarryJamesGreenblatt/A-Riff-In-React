// main.bicep - Main Bicep template for A Riff In React
targetScope = 'resourceGroup'

// Parameters
@description('The environment name')
param environmentName string

@description('The location for all resources')
param location string = 'westus'

@description('The Microsoft Entra tenant ID for External ID')
param externalTenantId string

@description('The Microsoft Entra External ID Application (client) ID')
param externalClientId string

@description('The Azure App service plan name')
param appServicePlanName string = 'asp-${environmentName}'

@description('The Azure Key Vault name')
param keyVaultName string = 'kv-${environmentName}'

@description('The name of the shared SQL Server to use')
param sharedSqlServerName string = 'sequitur-sql-server'

@description('The name of the resource group containing the shared SQL Server')
param sharedSqlServerResourceGroupName string = 'db-rg'

@description('The SQL Database name')
param sqlDatabaseName string = 'riff-react-db'

@description('The SQL Server administrator login')
param sqlAdminLogin string = 'sqladmin'

@description('The SQL Server administrator password')
@secure()
param sqlAdminPassword string

@description('The Cosmos DB account name')
param cosmosAccountName string = 'cosmos-${environmentName}'

@description('The Cosmos DB database name')
param cosmosDatabaseName string = 'cosmosdb-${environmentName}'

@description('The Application Insights name')
param appInsightsName string = 'appi-${environmentName}'

@description('The Log Analytics workspace name')
param logAnalyticsName string = 'log-${environmentName}'

@description('The Storage Account name for the Function App')
param storageAccountName string = 'st${replace(environmentName, '-', '')}'


// Tags
var tags = {
  environment: environmentName
  application: 'A-Riff-In-React'
  azd_env_name: environmentName
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

// Storage Account for Function App
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}

// Log Analytics Workspace for Application Insights
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
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
  }
}

// Application Insights for monitoring
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Frontend Web App
resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: environmentName
  location: location
  tags: union(tags, { 'azd-service-name': 'web' })
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'VITE_ENTRA_TENANT_ID'
          value: externalTenantId
        }
        {
          name: 'VITE_ENTRA_CLIENT_ID'
          value: externalClientId
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

// Backend Function App
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: 'func-${environmentName}'
  location: location
  kind: 'functionapp,linux'
  tags: union(tags, { 'azd-service-name': 'api' })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https,AccountName=${storageAccount.name},EndpointSuffix=${environment().suffixes.storage},AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'AZURE_SQL_CONNECTIONSTRING'
          value: '@Microsoft.KeyVault(SecretUri=${sqlConnectionStringSecret.properties.secretUri})'
        }
      ]
    }
  }
}

// Grant Function App access to Key Vault
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-02-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: functionApp.identity.principalId
        permissions: {
          secrets: [
            'get'
          ]
        }
      }
    ]
  }
}


// Deploy SQL Database to shared server using module
module sqlDatabaseModule 'modules/sqlDatabase.bicep' = {
  name: 'sql-database-deployment'
  scope: resourceGroup(sharedSqlServerResourceGroupName)
  params: {
    sqlServerName: sharedSqlServerName
    sqlDatabaseName: sqlDatabaseName
    location: location
    tags: tags
  }
}

// Cosmos DB Account for flexible data
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless' // Use serverless for cost optimization
      }
    ]
  }
}

// Cosmos DB Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: cosmosDatabaseName
  properties: {
    resource: {
      id: cosmosDatabaseName
    }
  }
}

// Cosmos DB Container for activity logs
resource activityContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'activity-logs'
  properties: {
    resource: {
      id: 'activity-logs'
      partitionKey: {
        paths: [
          '/userId'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
      defaultTtl: 2592000 // 30 days in seconds
    }
  }
}

// Add database connection strings to Key Vault
resource sqlConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'AZURE-SQL-CONNECTIONSTRING'
  properties: {
    value: 'Server=tcp:${sqlDatabaseModule.outputs.sqlServerFqdn},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
  }
}

// Output the web app URL
output webAppUrl string = webApp.properties.defaultHostName
output functionAppUrl string = functionApp.properties.defaultHostName
output sqlServerFqdn string = sqlDatabaseModule.outputs.sqlServerFqdn
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output appInsightsConnectionString string = appInsights.properties.ConnectionString
