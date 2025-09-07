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
var containerAppName = 'ca-api-${environmentName}' // Changed prefix to prevent conflicts with existing App Service
var logAnalyticsName = 'log-${environmentName}'
var staticWebAppName = environmentName
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

// Reference to existing Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: 'appi-a-riff-in-react'
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

// Reference to existing Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' existing = {
  name: staticWebAppName
}

// Reference to existing Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: 'kv-a-riff-in-react'
}

// Update Key Vault access policy to include new managed identity
resource keyVaultPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2022-07-01' = {
  name: '${keyVault.name}/add'
  properties: {
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
  }
}

// SQL Database access for managed identity - use inline deployment script instead of module
resource sqlRoleAssignmentScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'sql-role-assignment-script'
  location: location
  kind: 'AzureCLI'
  properties: {
    azCliVersion: '2.37.0'
    retentionInterval: 'P1D'
    timeout: 'PT30M'
    cleanupPreference: 'OnSuccess'
    environmentVariables: [
      {
        name: 'SQL_SERVER'
        value: existingSqlServerName
      }
      {
        name: 'SQL_SERVER_RG'
        value: existingSqlServerResourceGroup
      }
      {
        name: 'SQL_DATABASE'
        value: existingSqlDatabaseName
      }
      {
        name: 'PRINCIPAL_ID'
        value: managedIdentity.properties.principalId
      }
      {
        name: 'ROLE_NAME'
        value: 'db_datareader'
      }
    ]
    scriptContent: '''
      #!/bin/bash
      
      # Log in with the managed identity
      az login --identity
      
      # Get the SQL Server resource ID
      RESOURCE_ID=$(az sql server show -n $SQL_SERVER -g $SQL_SERVER_RG --query id -o tsv)
      
      # Create an Azure AD-only authentication administrator if it doesn't exist
      ADMIN_EXISTS=$(az sql server ad-admin show --server $SQL_SERVER --resource-group $SQL_SERVER_RG --query id --output tsv || echo "")
      
      if [ -z "$ADMIN_EXISTS" ]; then
        # Get the current user's object ID
        CURRENT_USER_ID=$(az ad signed-in-user show --query id -o tsv)
        
        # Set the current user as the AD admin
        az sql server ad-admin create --server $SQL_SERVER --resource-group $SQL_SERVER_RG --display-name "AzureAD Admin" --object-id $CURRENT_USER_ID
      fi
      
      # Execute SQL command to create the user and assign the role
      # This uses the sqlcmd utility with Azure AD authentication
      cat > script.sql << EOL
      -- Create user from external provider if it doesn't exist
      IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$PRINCIPAL_ID')
      BEGIN
          CREATE USER [${PRINCIPAL_ID}] FROM EXTERNAL PROVIDER;
      END
      
      -- Add user to role
      ALTER ROLE [$ROLE_NAME] ADD MEMBER [${PRINCIPAL_ID}];
      GO
      EOL
      
      # Use the Azure CLI to execute the SQL script
      az sql db query --server $SQL_SERVER --resource-group $SQL_SERVER_RG --database $SQL_DATABASE --query-file script.sql
      
      echo "SQL role assignment completed"
    '''
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
