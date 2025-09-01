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

// @description('The Application Insights name')
// param appInsightsName string = 'ai-${environmentName}'

@description('The Log Analytics workspace name')
param logAnalyticsName string = 'log-${environmentName}'

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
  name: 'st${replace(environmentName, '-', '')}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// Function App for Backend API
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: 'func-${environmentName}'
  location: location
  tags: union(tags, { 'azd-service-name': 'api' })
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'Node|20'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower('func-${environmentName}')
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'SQL_CONNECTION_STRING'
          value: 'Server=tcp:${sqlDatabaseModule.outputs.sqlServerFqdn},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
        }
        {
          name: 'COSMOS_ENDPOINT'
          value: cosmosAccount.properties.documentEndpoint
        }
        {
          name: 'COSMOS_KEY'
          value: cosmosAccount.listKeys().primaryMasterKey
        }
        {
          name: 'COSMOS_DATABASE'
          value: cosmosDatabaseName
        }
      ]
      cors: {
        allowedOrigins: [
          'https://${environmentName}.azurewebsites.net'
          'http://localhost:5173'
          'https://localhost:5173'
        ]
        supportCredentials: true
      }
    }
  }
}

// Static Web App commented out for now to troubleshoot deployment issues
// resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
//   name: staticWebAppName
//   location: location
//   tags: tags
//   sku: {
//     name: 'Standard'
//     tier: 'Standard'
//   }
//   properties: {
//     // Link to GitHub repository would go here in a production deployment
//   }
// }

// App Configuration for environment variables
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
        {
          name: 'VITE_API_BASE_URL'
          value: 'https://func-${environmentName}.azurewebsites.net'
        }
      ]
    }
  }
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

// Application Insights for monitoring (commented out to reduce costs)
// Uncomment if you need application monitoring and telemetry
// resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
//   name: appInsightsName
//   location: location
//   tags: tags
//   kind: 'web'
//   properties: {
//     Application_Type: 'web'
//     WorkspaceResourceId: logAnalyticsWorkspace.id
//     publicNetworkAccessForIngestion: 'Enabled'
//     publicNetworkAccessForQuery: 'Enabled'
//   }
// }

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

// Update App Service to include connection strings for databases
resource webAppSettings 'Microsoft.Web/sites/config@2022-09-01' = {
  parent: webApp
  name: 'appsettings'
  properties: {
    // APPINSIGHTS_INSTRUMENTATIONKEY: appInsights.properties.InstrumentationKey
    // APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    SQL_CONNECTION_STRING: 'Server=tcp:${sqlDatabaseModule.outputs.sqlServerFqdn},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    COSMOS_ENDPOINT: cosmosAccount.properties.documentEndpoint
    COSMOS_KEY: cosmosAccount.listKeys().primaryMasterKey
    COSMOS_DATABASE: cosmosDatabaseName
    VITE_ENTRA_TENANT_ID: externalTenantId
    VITE_ENTRA_CLIENT_ID: externalClientId
    VITE_REDIRECT_URI: 'https://app-${environmentName}.azurewebsites.net'
    VITE_POST_LOGOUT_URI: 'https://app-${environmentName}.azurewebsites.net'
    VITE_API_BASE_URL: 'https://func-${environmentName}.azurewebsites.net'
  }
}

// Add database connection strings to Key Vault
resource sqlConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'SQL-CONNECTION-STRING'
  properties: {
    value: 'Server=tcp:${sqlDatabaseModule.outputs.sqlServerFqdn},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
  }
}

resource cosmosEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'COSMOS-ENDPOINT'
  properties: {
    value: cosmosAccount.properties.documentEndpoint
  }
}

resource cosmosKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'COSMOS-KEY'
  properties: {
    value: cosmosAccount.listKeys().primaryMasterKey
  }
}

// Output the web app URL
output webAppUrl string = webApp.properties.defaultHostName
output functionAppUrl string = functionApp.properties.defaultHostName
// output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output sqlServerFqdn string = sqlDatabaseModule.outputs.sqlServerFqdn
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
// output appInsightsConnectionString string = appInsights.properties.ConnectionString
