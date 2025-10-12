@description('The name of the Cosmos DB account')
param cosmosDbAccountName string

@description('The principal ID of the managed identity')
param principalId string

@description('The role definition ID to assign to the managed identity (use built-in role IDs like 00000000-0000-0000-0000-000000000002 for Data Contributor)')
param roleDefinitionId string

resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2022-08-15' existing = {
  name: cosmosDbAccountName
}

// Create a role assignment for the managed identity
// For built-in roles, the roleDefinitionId needs to be the full resource path
resource roleAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2022-08-15' = {
  name: guid(cosmosDbAccount.id, principalId, roleDefinitionId)
  parent: cosmosDbAccount
  properties: {
    principalId: principalId
    roleDefinitionId: '${cosmosDbAccount.id}/sqlRoleDefinitions/${roleDefinitionId}'
    scope: cosmosDbAccount.id
  }
}

output roleAssignmentId string = roleAssignment.id
