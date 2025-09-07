# Azure Resource Provider Registration

## Why Provider Registration is Needed

Azure Resource Providers must be registered in your subscription before you can create resources of that type. This is a one-time setup per subscription.

## Required Providers for A-Riff-In-React

- `Microsoft.App` - Container Apps
- `Microsoft.ContainerRegistry` - Container Registry
- `Microsoft.OperationalInsights` - Log Analytics
- `Microsoft.DocumentDB` - Cosmos DB
- `Microsoft.ManagedIdentity` - User-Assigned Managed Identity
- `Microsoft.KeyVault` - Key Vault
- `Microsoft.Insights` - Application Insights
- `Microsoft.Web` - Static Web Apps
- `Microsoft.Resources` - Deployment Scripts
- `Microsoft.Sql` - SQL Database
- `Microsoft.Storage` - Storage Account

## Registration Methods

### Option 1: Automated Script (Recommended)

Run our automated registration script:

**PowerShell (Windows):**
```powershell
.\scripts\register-providers.ps1
```

**Bash (Linux/macOS/WSL):**
```bash
./scripts/register-providers.sh
```

### Option 2: Manual Registration

```bash
# Register all required providers manually
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.ContainerRegistry --wait
az provider register --namespace Microsoft.OperationalInsights --wait
az provider register --namespace Microsoft.DocumentDB --wait
az provider register --namespace Microsoft.ManagedIdentity --wait
az provider register --namespace Microsoft.KeyVault --wait
az provider register --namespace Microsoft.Insights --wait
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.Resources --wait
az provider register --namespace Microsoft.Sql --wait
az provider register --namespace Microsoft.Storage --wait
```

### Option 3: GitHub Actions (Automatic)

The GitHub Actions workflow automatically registers providers during deployment:

```yaml
- name: Register Azure Resource Providers
  run: |
    az provider register --namespace Microsoft.App --wait
    az provider register --namespace Microsoft.ContainerRegistry --wait
    # ... (all providers)
```

## Verification

Check registration status:

```bash
# Check specific provider
az provider show --namespace Microsoft.App --query registrationState

# Check all providers
az provider list --query "[?namespace=='Microsoft.App' || namespace=='Microsoft.ContainerRegistry'].{Namespace:namespace, RegistrationState:registrationState}" --output table
```

## Troubleshooting

**Issue**: `The subscription is not registered to use namespace 'Microsoft.App'`

**Solution**: Run the registration script or manually register the provider:
```bash
az provider register --namespace Microsoft.App --wait
```

**Issue**: Registration appears to hang

**Solution**: Provider registration can take up to 15 minutes. You can check progress:
```bash
az provider show --namespace Microsoft.App --query registrationState
```

**Issue**: Insufficient permissions to register providers

**Solution**: You need `Contributor` or `Owner` role at the subscription level to register providers.

## Notes

- Provider registration is **idempotent** - safe to run multiple times
- Registration is **subscription-wide** - only needs to be done once per subscription
- Some providers auto-register when you create resources through the portal
- CLI/API/Bicep deployments require explicit registration
