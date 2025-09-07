@description('Bicep template to ensure all required resource providers are registered')
targetScope = 'subscription'

@description('Array of resource providers to register')
param resourceProviders array = [
  'Microsoft.App'
  'Microsoft.ContainerRegistry'
  'Microsoft.OperationalInsights'
  'Microsoft.DocumentDB'
  'Microsoft.ManagedIdentity'
  'Microsoft.KeyVault'
  'Microsoft.Insights'
  'Microsoft.Web'
  'Microsoft.Resources'
  'Microsoft.Sql'
  'Microsoft.Storage'
]

// Note: Bicep doesn't have native support for provider registration
// This is a placeholder template that documents required providers
// Provider registration should be handled in GitHub Actions workflow

output requiredProviders array = resourceProviders
output registrationCommand string = 'az provider register --namespace'
