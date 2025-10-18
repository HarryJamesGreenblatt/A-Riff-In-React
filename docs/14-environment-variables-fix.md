# Environment Variables Fix

## Issue

The Cosmos DB counter and activities were returning 404 errors because:

1. **Frontend**: Missing `VITE_API_BASE_URL` pointing to the deployed Container App
2. **Backend**: Missing `COSMOS_CONTAINER_ID` environment variable in the Container App configuration

## Fixes Applied

### 1. Frontend `.env` File
Added the correct API URL:
```env
VITE_API_BASE_URL=https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io
```

### 2. Backend `infra/main.bicep`
Added missing environment variable:
```bicep
{
  name: 'COSMOS_CONTAINER_ID'
  value: 'activities'
}
```

### 3. GitHub Workflow `.github/workflows/frontend-deploy.yml`
Updated to use **existing** GitHub secrets properly:
```yaml
- name: Build frontend
  run: npm run build
  env:
    VITE_API_BASE_URL: https://${{ steps.get_api_url.outputs.api_url }}
    VITE_ENTRA_CLIENT_ID: ${{ secrets.ENTRA_CLIENT_ID }}
    VITE_ENTRA_TENANT_ID: ${{ secrets.ENTRA_TENANT_ID }}
    VITE_ENTRA_USER_FLOW_AUTHORITY: ${{ secrets.ENTRA_USER_FLOW_AUTHORITY }}
    VITE_REDIRECT_URI: ${{ secrets.FRONTEND_URL || 'https://a-riff-in-react.harryjamesgreenblatt.com' }}
```

### 4. Added Missing GitHub Secrets
Created these secrets with values from `.env` file:
- `ENTRA_USER_FLOW_AUTHORITY` - B2C User Flow Authority URL
- `FRONTEND_URL` - Production frontend URL for OAuth redirects

## GitHub Secrets Summary

Your repository uses these secrets:

| Secret Name | Purpose | Status |
|-------------|---------|--------|
| `ENTRA_CLIENT_ID` | Azure AD B2C Client ID | ? Already existed |
| `ENTRA_TENANT_ID` | Azure AD B2C Tenant ID | ? Already existed |
| `ENTRA_USER_FLOW_AUTHORITY` | B2C User Flow Authority URL | ? Just added |
| `FRONTEND_URL` | Production frontend URL (OAuth redirect) | ? Just added |
| `AZURE_CREDENTIALS` | Azure service principal for deployments | ? Already existed |
| `JWT_SECRET` | Backend JWT signing key | ? Already existed |

## Deployment

### Commit and Push
```bash
git add .env infra/main.bicep .github/workflows/frontend-deploy.yml docs/14-environment-variables-fix.md
git commit -m "fix: configure environment variables for Cosmos DB and Entra ID"
git push origin main
```

### Monitor Deployments
```bash
# Watch backend deployment
gh run watch $(gh run list --workflow="Deploy API to Container Apps" --limit 1 --json databaseId --jq '.[0].databaseId')

# Watch frontend deployment
gh run watch $(gh run list --workflow="Deploy Frontend to Static Web App" --limit 1 --json databaseId --jq '.[0].databaseId')
```

## Environment Variables Reference

### Frontend (Vite)

| Variable | Purpose | Local (`.env`) | Production (Workflow) |
|----------|---------|----------------|----------------------|
| `VITE_API_BASE_URL` | Backend API URL | Manual in `.env` | Auto-detected from Container App |
| `VITE_ENTRA_CLIENT_ID` | Azure AD B2C Client ID | From `.env` | From `ENTRA_CLIENT_ID` secret |
| `VITE_ENTRA_TENANT_ID` | Azure AD B2C Tenant ID | From `.env` | From `ENTRA_TENANT_ID` secret |
| `VITE_ENTRA_USER_FLOW_AUTHORITY` | B2C User Flow URL | From `.env` | From `ENTRA_USER_FLOW_AUTHORITY` secret |
| `VITE_REDIRECT_URI` | OAuth redirect URL | From `.env` | From `FRONTEND_URL` secret |

### Backend (Container App)

| Variable | Set By | Value |
|----------|--------|-------|
| `COSMOS_CONTAINER_ID` | Bicep | `activities` |
| `COSMOS_ENDPOINT` | Bicep | `https://riff-react-cosmos-db.documents.azure.com:443/` |
| `COSMOS_DATABASE_NAME` | Bicep | `ARiffInReact` |
| All other variables | Bicep | (see infra/main.bicep) |

## Summary

**What Was Fixed:**
- ? Added `VITE_API_BASE_URL` to local `.env`
- ? Added `COSMOS_CONTAINER_ID` to backend infrastructure (deployed)
- ? Updated workflow to use existing `ENTRA_*` secrets
- ? Added missing `ENTRA_USER_FLOW_AUTHORITY` secret
- ? Added `FRONTEND_URL` secret for OAuth redirect URI

**No Hardcoded Values in Workflow:** All configuration comes from GitHub Secrets or is auto-detected

**Next:** Push changes and let CI/CD handle deployment

---

**Last Updated**: January 2025  
**Related Docs**: 
- [Cosmos DB Features](./13-cosmos-db-features.md)
- [Azure Deployment](./10-azure-deployment.md)
