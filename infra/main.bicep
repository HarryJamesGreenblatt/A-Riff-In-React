// main.bicep - Main Bicep template for A Riff In React
targetScope = 'resourceGroup'

// Parameters
@description('The environment name')
param environmentName string

@description('The location for all resources')
param location string = 'westus'

@description('The name of the Azure Static Web App')
param staticWebAppName string = 'swa-${environmentName}'

@description('The Microsoft Entra tenant ID for External ID')
param externalTenantId string

@description('The Microsoft Entra External ID Application (client) ID')
param externalClientId string

@description('The Azure App service plan name')
param appServicePlanName string = 'asp-${environmentName}'

@description('The Azure Key Vault name')
param keyVaultName string = 'kv-${environmentName}'

@description('The SQL Server name')
param sqlServerName string = 'sql-${environmentName}'

@description('The SQL Database name')
param sqlDatabaseName string = 'sqldb-${environmentName}'

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
param appInsightsName string = 'ai-${environmentName}'

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
  name: 'app-${environmentName}'
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

// SQL Server for structured data
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    publicNetworkAccess: 'Enabled' // Consider setting to 'Disabled' for production
  }
}

// Allow Azure services to access the SQL Server
resource sqlServerFirewallRule 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAllAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// SQL Database
resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  tags: tags
  sku: {
    name: 'Basic'
    tier: 'Basic'
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 1073741824 // 1GB
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

// Update App Service to include connection strings for databases and Application Insights
resource webAppSettings 'Microsoft.Web/sites/config@2022-09-01' = {
  parent: webApp
  name: 'appsettings'
  properties: {
    APPINSIGHTS_INSTRUMENTATIONKEY: appInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    SQL_CONNECTION_STRING: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
    COSMOS_ENDPOINT: cosmosAccount.properties.documentEndpoint
    COSMOS_KEY: cosmosAccount.listKeys().primaryMasterKey
    COSMOS_DATABASE: cosmosDatabaseName
    VITE_ENTRA_TENANT_ID: externalTenantId
    VITE_ENTRA_CLIENT_ID: externalClientId
    VITE_REDIRECT_URI: 'https://app-${environmentName}.azurewebsites.net'
    VITE_POST_LOGOUT_URI: 'https://app-${environmentName}.azurewebsites.net'
  }
}

// Add database connection strings to Key Vault
resource sqlConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'SQL-CONNECTION-STRING'
  properties: {
    value: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
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
// output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output appInsightsConnectionString string = appInsights.properties.ConnectionString
