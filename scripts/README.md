# Scripts Directory

Automation scripts for A-Riff-In-React deployment and testing.

## Database Management

### ?? `deploy-schema.ps1`

**Automatically deploys schema changes to Azure SQL Database**

Fetches SQL admin credentials from Key Vault and applies `api/schema.sql` to production.

**Usage:**
```powershell
# Deploy with defaults (recommended)
.\scripts\deploy-schema.ps1

# Custom Key Vault
.\scripts\deploy-schema.ps1 -KeyVaultName "my-kv"

# Custom schema file
.\scripts\deploy-schema.ps1 -SchemaFile "custom-schema.sql"
```

**Prerequisites:**
- Azure CLI installed and authenticated (`az login`)
- `sqlcmd` installed ([download](https://aka.ms/sqlcmd))
- Key Vault access (secret GET permissions)

**What it does:**
1. Verifies prerequisites (Azure CLI, sqlcmd)
2. Fetches SQL admin credentials from Key Vault
3. Applies `api/schema.sql` to production database
4. Verifies schema changes were applied
5. Provides next steps

**Safe to run multiple times** — `api/schema.sql` is idempotent with `IF NOT EXISTS` guards.

---

### ?? `deploy-database.sql`

Legacy SQL deployment script (alternative to `api/schema.sql`).

**Not recommended for new deployments** — use `api/schema.sql` via `deploy-schema.ps1` instead.

This file is kept for backward compatibility and reference.

---

## Testing

### ? `test-registration.ps1`

**End-to-end registration and authentication test**

Tests the complete auth flow against the deployed API.

**Usage:**
```powershell
.\scripts\test-registration.ps1
```

**What it tests:**
1. Health endpoint (`/health`)
2. User registration (`POST /api/auth/register`)
3. User login (`POST /api/auth/login`)
4. Authenticated endpoint (`GET /api/auth/me`)

**Expected output:**
```
? Health check passed
? Registration successful
? Login successful
? /api/auth/me passed
? All tests passed!
```

---

## Azure Setup

### ?? `register-providers.ps1` / `register-providers.sh`

**Registers required Azure Resource Providers**

Must be run once per subscription before deploying infrastructure.

**Usage:**
```powershell
# Windows
.\scripts\register-providers.ps1

# Linux/macOS
./scripts/register-providers.sh
```

**Providers registered:**
- `Microsoft.App` (Container Apps)
- `Microsoft.ContainerRegistry` (ACR)
- `Microsoft.OperationalInsights` (Log Analytics)
- `Microsoft.DocumentDB` (Cosmos DB)
- `Microsoft.ManagedIdentity`
- `Microsoft.KeyVault`
- `Microsoft.Insights`
- `Microsoft.Web` (Static Web Apps)

---

## Common Workflows

### Initial Deployment

1. **Register Azure providers** (one-time):
   ```powershell
   .\scripts\register-providers.ps1
   ```

2. **Push code to trigger CI/CD**:
   ```bash
   git push origin main
   ```

3. **Apply schema to database**:
   ```powershell
   .\scripts\deploy-schema.ps1
   ```

4. **Test the deployment**:
   ```powershell
   .\scripts\test-registration.ps1
   ```

### After Schema Changes

1. **Update `api/schema.sql`** with new migrations

2. **Apply to production**:
   ```powershell
   .\scripts\deploy-schema.ps1
   ```

3. **Verify**:
   ```powershell
   .\scripts\test-registration.ps1
   ```

---

## Troubleshooting

### `deploy-schema.ps1` fails with "Key Vault not found"

**Solution:** Grant yourself Key Vault access:
```powershell
az keyvault set-policy --name kv-a-riff-in-react --upn YOUR_EMAIL --secret-permissions get
```

### `sqlcmd: command not found`

**Solution:** Install SQL Server command-line tools:
- **Windows:** [Download installer](https://aka.ms/sqlcmd)
- **Linux:** `sudo apt-get install mssql-tools`
- **macOS:** `brew install sqlcmd`

### `test-registration.ps1` fails with 500 error

**Likely cause:** Database schema not applied or managed identity not configured.

**Solutions:**
1. Run `.\scripts\deploy-schema.ps1`
2. Check Container App logs: `az containerapp logs show -n ca-api-a-riff-in-react -g riffinreact-rg --follow`
3. Verify managed identity has database access (see [docs/Auth/SQL-SETUP-STEP-BY-STEP.md](../docs/Auth/SQL-SETUP-STEP-BY-STEP.md))

---

## File Structure

```
scripts/
??? deploy-schema.ps1          # ? Primary schema deployment tool
??? deploy-database.sql        # ?? Legacy SQL script
??? test-registration.ps1      # ? Auth flow testing
??? test-registration.sh       # ? Auth flow testing (Linux/macOS)
??? register-providers.ps1     # ?? Azure provider registration
??? register-providers.sh      # ?? Azure provider registration (Linux/macOS)
??? README.md                  # ?? This file
```

---

## See Also

- [Authentication Documentation](../docs/07-authentication.md)
- [Azure Deployment Guide](../docs/10-azure-deployment.md)
- [SQL Setup Step-by-Step](../docs/Auth/SQL-SETUP-STEP-BY-STEP.md)
- [Session Handoff Notes](../docs/SESSION-HANDOFF.md)
