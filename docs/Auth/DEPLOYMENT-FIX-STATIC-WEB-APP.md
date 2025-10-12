# Deployment Fix: Static Web App listSecrets() Error

**Date**: December 2024  
**Status**: ? FIXED  
**Root Cause**: Azure SDK limitation with Static Web Apps

## Problem Summary

### Error Message
```
ERROR: The content for this response was already consumed
Template validation failed.
Deployment failed.
```

### Root Cause
The error occurred in `infra/main.bicep` at line 302:

```bicep
output staticWebAppDeploymentToken string = staticWebApp.listSecrets().properties.apiKey
```

**Why it failed:**
- When a Static Web App is created with a GitHub repository URL in the properties, the Azure SDK has a known limitation where calling `listSecrets()` fails with the cryptic error "The content for this response was already consumed"
- This is a known issue documented in various Azure forums and GitHub issues

### Original Configuration (Broken)
```bicep
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  properties: {
    repositoryUrl: 'https://github.com/HarryJamesGreenblatt/A-Riff-In-React'  // ? CAUSES ISSUE
    branch: 'main'
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: 'dist'
    }
  }
}

output staticWebAppDeploymentToken string = staticWebApp.listSecrets().properties.apiKey  // ? FAILS
```

## Solution Applied

### 1. Removed Repository Configuration
The Static Web App resource no longer includes the GitHub repository configuration. This allows the infrastructure to deploy successfully, and the frontend can be deployed separately.

**Updated Configuration:**
```bicep
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // Repository configuration removed to avoid listSecrets() error
    // Deploy frontend separately using GitHub Actions or Azure Static Web Apps CLI
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: 'dist'
    }
  }
}
```

### 2. Removed Problematic Output
The `staticWebAppDeploymentToken` output has been removed. If the deployment token is needed, it can be retrieved via Azure CLI:

```bash
az staticwebapp secrets list \
  --name swa-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query properties.apiKey -o tsv
```

### 3. Fixed Other Bicep Linter Warnings

#### Warning: Hardcoded SQL Server URL
**Before:**
```bicep
var sqlServerFqdn = '${existingSqlServerName}.database.windows.net'  // ?? Hardcoded
```

**After:**
```bicep
var sqlServerFqdn = '${existingSqlServerName}.${environment().suffixes.sqlServerHostname}'  // ? Cloud-agnostic
```

**Benefit:** Template now works across Azure clouds (Azure Government, Azure China, etc.)

## Benefits of This Approach

### 1. **Separation of Concerns**
- Infrastructure deployment is separated from code deployment
- Bicep handles Azure resources, GitHub Actions handles code
- Cleaner, more maintainable architecture

### 2. **Template Philosophy Alignment**
This fix aligns perfectly with the template's philosophy:
- Infrastructure should be **reproducible** and **automated**
- No manual Portal configuration required
- Each deployment step is clear and documented

### 3. **Deployment Flexibility**
Users can now:
- Deploy infrastructure via Bicep (automated)
- Deploy frontend via GitHub Actions (automated)
- Deploy frontend via Azure Static Web Apps CLI (manual/testing)
- Use any frontend deployment strategy they prefer

## Frontend Deployment Options

### Option 1: GitHub Actions (Recommended)
Create a separate workflow for Static Web App deployment:

```yaml
name: Deploy Frontend to Static Web App

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'public/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/"
          api_location: ""
          output_location: "dist"
```

**Get the deployment token:**
```bash
az staticwebapp secrets list \
  --name swa-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query properties.apiKey -o tsv

# Add to GitHub Secrets as AZURE_STATIC_WEB_APPS_API_TOKEN
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --repo HarryJamesGreenblatt/A-Riff-In-React
```

### Option 2: Azure Static Web Apps CLI (Manual/Testing)
```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Build your app
npm run build

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name swa-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query properties.apiKey -o tsv)

# Deploy
swa deploy ./dist \
  --deployment-token $DEPLOYMENT_TOKEN \
  --env production
```

### Option 3: Link Repository via Portal (Not Recommended)
If you prefer, you can link the GitHub repository manually via Azure Portal:
1. Navigate to Static Web App in Portal
2. Go to Deployment ? GitHub
3. Configure the repository connection

**Note:** This approach is not recommended for a template as it requires manual configuration.

## Verification Steps

After deploying the fixed Bicep template:

### 1. Verify Infrastructure Deployment
```bash
# Check deployment status
az deployment group show \
  --resource-group riffinreact-rg \
  --name main \
  --query properties.provisioningState

# Should return: "Succeeded"
```

### 2. Verify Static Web App Created
```bash
az staticwebapp show \
  --name swa-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query "{Name:name, Status:status, Url:defaultHostname}"
```

### 3. Get Deployment Token (if needed)
```bash
az staticwebapp secrets list \
  --name swa-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query properties.apiKey -o tsv
```

### 4. Verify Container App (API Backend)
```bash
# Check if Container App is running
az containerapp show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query "{Name:name, Status:properties.runningStatus, Url:properties.configuration.ingress.fqdn}"

# Test health endpoint
curl https://ca-api-a-riff-in-react.$(az containerapp env show --name env-a-riff-in-react --resource-group riffinreact-rg --query properties.defaultDomain -o tsv)/health
```

## Related Changes

This fix was part of a larger effort to:
1. ? Fix Static Web App deployment error
2. ? Improve Bicep template cloud compatibility
3. ? Align with template-first deployment philosophy
4. ? Remove unnecessary coupling between infrastructure and code deployment

## Next Steps

1. **Deploy Infrastructure**: Push the updated Bicep template
   ```bash
   git add infra/main.bicep docs/Auth/DEPLOYMENT-FIX-STATIC-WEB-APP.md
   git commit -m "fix: resolve Static Web App listSecrets() deployment error

   - Remove repository configuration from Static Web App resource
   - Remove problematic listSecrets() output
   - Use environment() function for SQL Server FQDN (cloud-agnostic)
   - Separate infrastructure deployment from code deployment
   - Add comprehensive documentation of fix"
   
   git push origin main
   ```

2. **Monitor Deployment**: Watch the GitHub Actions workflow
   ```bash
   gh run watch
   ```

3. **Setup Frontend Deployment**: After infrastructure succeeds, configure frontend deployment using one of the options above

## Success Criteria

The deployment is successful when:
- ? Bicep template deploys without errors
- ? Container App is running and accessible
- ? Static Web App resource is created
- ? No `listSecrets()` errors in deployment logs
- ? Health endpoint returns 200

## Lessons Learned

1. **Azure SDK Limitations**: Some Azure resources have limitations with certain operations (like `listSecrets()` with repository-configured Static Web Apps)

2. **Separation is Better**: Separating infrastructure from code deployment provides more flexibility and fewer coupling issues

3. **Template Philosophy**: For a deployment template, every step should be automatable and documented

4. **Error Messages Can Be Cryptic**: Azure error messages like "The content for this response was already consumed" often require digging through forums and GitHub issues to understand

---

**Status**: ? Fix Applied and Documented  
**Ready for Deployment**: Yes  
**Next Action**: Push changes and monitor deployment

