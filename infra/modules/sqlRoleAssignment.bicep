@description('The name of the SQL Server')
param sqlServerName string

@description('The principal ID of the managed identity')
param principalId string

@description('The role to assign to the managed identity')
param roleName string

// We need this reference for the name but don't use the resource directly
// This is intentional and required for the script to work
var sqlServerNameVar = sqlServerName

// Use deploymentScript to execute T-SQL to grant database role to the managed identity
// This is necessary because Bicep doesn't directly support SQL role assignments
resource grantRoleScript 'Microsoft.Resources/deploymentScripts@2020-10-01' = {
  name: 'grant-sql-role-${uniqueString(sqlServerName, principalId, roleName)}'
  location: resourceGroup().location
  kind: 'AzureCLI'
  properties: {
    azCliVersion: '2.37.0'
    retentionInterval: 'P1D'
    timeout: 'PT30M'
    cleanupPreference: 'OnSuccess'
    environmentVariables: [
      {
        name: 'SQL_SERVER'
        value: sqlServerName
      }
      {
        name: 'PRINCIPAL_ID'
        value: principalId
      }
      {
        name: 'ROLE_NAME'
        value: roleName
      }
    ]
    scriptContent: '''
      #!/bin/bash
      
      # Log in with the managed identity
      az login --identity
      
      # Get the SQL Server resource ID
      RESOURCE_ID=$(az sql server show -n $SQL_SERVER -g $(az group show --query name -o tsv) --query id -o tsv)
      
      # Create an Azure AD-only authentication administrator if it doesn't exist
      ADMIN_EXISTS=$(az sql server ad-admin show --server $SQL_SERVER --query id --output tsv || echo "")
      
      if [ -z "$ADMIN_EXISTS" ]; then
        # Get the current user's object ID
        CURRENT_USER_ID=$(az ad signed-in-user show --query id -o tsv)
        
        # Set the current user as the AD admin
        az sql server ad-admin create --server $SQL_SERVER --display-name "AzureAD Admin" --object-id $CURRENT_USER_ID
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
      az sql db query --server $SQL_SERVER --database master --query-file script.sql
      
      echo "SQL role assignment completed"
    '''
  }
}

output scriptStatus string = grantRoleScript.properties.provisioningState
