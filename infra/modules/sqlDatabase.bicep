// sqlDatabase.bicep - Module for deploying SQL Database to shared server
targetScope = 'resourceGroup'

// Parameters
@description('The name of the existing SQL Server')
param sqlServerName string

@description('The SQL Database name')
param sqlDatabaseName string

@description('The location for the database')
param location string

@description('Tags to apply to the database')
param tags object

// Reference to the existing SQL Server (same resource group as this module deployment)
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' existing = {
  name: sqlServerName
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

// Outputs
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseName string = sqlDatabase.name
