@description('The name of the Cosmos DB account')
param cosmosDbAccountName string

@description('The name of the database to create or ensure exists')
param databaseName string = 'ARiffInReact'

@description('The name of the container to create or ensure exists')
param containerName string = 'activities'

@description('Throughput for the container (RU/s)')
param throughput int = 400

// Reference existing Cosmos DB account
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' existing = {
  name: cosmosDbAccountName
}

// Create or ensure database exists
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosDbAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Create or ensure container exists with correct partition key
resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: containerName
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: [
          '/userId'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
    options: {
      throughput: throughput
    }
  }
}

output databaseName string = database.name
output containerName string = container.name
output partitionKey string = '/userId'
