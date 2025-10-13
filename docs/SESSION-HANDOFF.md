# Session Handoff — Next Session Agent Context

**Date**: 2025-10-13  
**Last Updated**: End of session (post SQL fix, frontend deployment fix, phone schema issue identified)

---

## Summary

The **A-Riff-In-React** template is deployed to Azure with JWT authentication. Registration and login work end-to-end. A phone-collection modal was causing a 500 error; root cause: `Users` table lacks a `phone` column.

---

## Current Status (What Works)

? **Infrastructure deployed successfully**:
- Container App: `ca-api-a-riff-in-react` (API running, health endpoint OK)
- Static Web App: `swa-a-riff-in-react` (frontend deployed, correct API URL baked in)
- Managed Identity: `id-a-riff-in-react` (clientId: `994510d1-c3e8-422f-8dc9-ba517cce51ea`)
- Azure SQL: `sequitur-sql-server.database.windows.net` / `riff-react-db`
- Cosmos DB: `riff-react-cosmos-db`

? **Authentication working**:
- Registration: `POST /api/auth/register` ? creates user in SQL, returns success
- Login: `POST /api/auth/login` ? verifies password, returns JWT token
- Protected routes: JWT middleware validates tokens correctly
- Test script (`scripts/test-registration.ps1`) runs successfully (health ?, register ?, login ?, /api/auth/me ?)

? **Database connectivity fixed**:
- Container App env var `SQL_SERVER` corrected from `sequitur-sql-server..database.windows.net` (double-dot typo) to `sequitur-sql-server.database.windows.net`
- Managed identity (`id-a-riff-in-react`) granted `db_datareader` + `db_datawriter` roles in SQL DB
- SQL principal created as `EXTERNAL_USER` using display name (GUID-based creation failed; display name worked)

? **Frontend deployment fixed**:
- Workflow (`.github/workflows/frontend-deploy.yml`) now sets `VITE_API_BASE_URL` (was `VITE_API_URL`, causing localhost fallback)
- Production frontend now correctly calls Container App API

---

## Outstanding Issue (What Needs Fixing)

?? **Phone collection fails with 500 error**:
- User completes registration, then sees "We need one more thing" modal asking for phone number.
- Clicking "Save" POSTs to `PUT /api/users/:id` with `{ phone: "..." }` body.
- Backend throws 500 (unhandled error).
- **Root cause**: `Users` table schema (in `api/schema.sql`) has no `phone` column.
- Current columns: `id`, `email`, `passwordHash`, `name`, `role`, `emailVerified`, `createdAt`, `updatedAt`.

---

## Recommended Fix (Next Agent: Start Here)

### Option A: Add `phone` column to `Users` table (simplest, recommended)

1. **Update schema** (`api/schema.sql`):
   ```sql
   -- Add phone column (nullable, optional field)
   IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'phone')
   BEGIN
       ALTER TABLE Users ADD phone NVARCHAR(20) NULL;
   END
   GO
   ```

2. **Run schema update on production DB**:
   - Connect as SQL admin or AAD admin (`Harry Greenblatt`, objectId: `e7829b96-0ba1-464f-b529-62fcba7aa683`).
   - Execute the ALTER TABLE statement.
   - Or: run full `api/schema.sql` (it's idempotent with IF NOT EXISTS guards).

3. **Update backend code** (if needed):
   - `api/src/services/sqlService.ts` ? `createUser` and `updateUser` already handle `phone` param (check existing code; may already be compatible).
   - `api/src/routes/authRoutes.ts` ? registration route accepts `{ email, password, name }` but not phone yet. If you want phone at registration, add it to the request body validation and pass to `sqlService.createUser({ ..., phone })`.
   - `api/src/routes/userRoutes.ts` ? `PUT /api/users/:id` route already calls `sqlService.updateUser(id, { phone })`. Once column exists, this should work.

4. **Update frontend registration form** (optional, if collecting phone upfront):
   - `src/components/auth/RegisterForm.tsx` ? add phone input field.
   - `src/services/auth/authService.ts` ? `register(email, password, name, phone?)` method.
   - Or: keep the modal approach; just ensure the PUT endpoint works after adding the column.

5. **Test**:
   - Re-run registration test: `.\scripts\test-registration.ps1` ? should succeed.
   - Test phone save via UI modal ? should succeed (no more 500).

6. **Deploy**:
   - Commit schema change, backend changes (if any), frontend changes (if any).
   - Push ? CI/CD will redeploy backend (Container App) and frontend (Static Web App).

---

## Key Files & Locations

**Infrastructure**:
- Bicep template: `infra/main.bicep` (Container App, managed identity, SQL config)
- Workflows: `.github/workflows/container-deploy.yml` (backend), `.github/workflows/frontend-deploy.yml` (frontend)

**Backend (API)**:
- Schema: `api/schema.sql` (SQL table definitions)
- Auth routes: `api/src/routes/authRoutes.ts` (register, login, /me)
- User routes: `api/src/routes/userRoutes.ts` (GET/POST/PUT /api/users)
- SQL service: `api/src/services/sqlService.ts` (DB query logic)

**Frontend**:
- Auth service: `src/services/auth/authService.ts` (register, login, savePhoneForUser)
- Register form: `src/components/auth/RegisterForm.tsx`
- Phone modal: `src/components/auth/PhoneCollectModal.tsx` (triggers PUT /api/users/:id)
- RTK Query base: `src/store/api.ts` (sets `baseUrl: import.meta.env.VITE_API_BASE_URL`)

**Testing**:
- `scripts/test-registration.ps1` ? automated registration test (health, register, login, /me)
- `scripts/setup-sql-permissions.ps1` ? grant DB permissions to managed identity

---

## Environment Configuration

**Container App Environment Variables** (set in `infra/main.bicep` and deployed):
- `SQL_SERVER`: `sequitur-sql-server.database.windows.net` ? (fixed from `..` typo)
- `SQL_DATABASE`: `riff-react-db`
- `AZURE_CLIENT_ID`: `994510d1-c3e8-422f-8dc9-ba517cce51ea` (managed identity)
- `JWT_SECRET`: (secretRef) ?
- `CORS_ORIGINS`: `https://a-riff-in-react.harryjamesgreenblatt.com,http://localhost:5173`

**Static Web App Build Environment** (set in `.github/workflows/frontend-deploy.yml`):
- `VITE_API_BASE_URL`: `https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io` ? (fixed from `VITE_API_URL`)

**Key Vault Secrets** (fallback/admin access):
- `kv-a-riff-in-react` ? `SQL-CONNECTION-STRING` (SQL admin credentials for manual DB access)

---

## Quick Commands (PowerShell / Cloud Shell)

**Verify Container App env**:
```powershell
az containerapp show -n ca-api-a-riff-in-react -g riffinreact-rg --query "properties.template.containers[0].env" -o json
```

**Run registration test**:
```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\test-registration.ps1
```

**Tail Container App logs**:
```powershell
az containerapp logs show -n ca-api-a-riff-in-react -g riffinreact-rg --follow
```

**Connect to SQL DB as admin** (to run schema updates):
```powershell
# Get SQL admin credentials from Key Vault
$kv = az keyvault secret show --vault-name kv-a-riff-in-react --name SQL-CONNECTION-STRING -o json | ConvertFrom-Json
$conn = $kv.value
$pw = ([regex]::Match($conn,'Password\s*=\s*([^;]+)','IgnoreCase')).Groups[1].Value
$user = ([regex]::Match($conn,'(User\s*Id|User|Uid)\s*=\s*([^;]+)','IgnoreCase')).Groups[2].Value

# Run sqlcmd
sqlcmd -S "sequitur-sql-server.database.windows.net" -d "riff-react-db" -U $user -P $pw -i api\schema.sql
```

Or use Azure Data Studio / SSMS with AAD auth (`Harry Greenblatt` account).

---

## Known Issues & Workarounds

**Issue**: Azure CLI in some environments hits intermittent SSL/connection resets when calling Container Apps APIs.  
**Workaround**: Use Azure Portal for env edits, or run commands in Cloud Shell.

**Issue**: SQL principal creation by GUID failed; display name worked.  
**Workaround**: Use managed identity display name (`id-a-riff-in-react`) instead of GUID when creating SQL principals.

**Issue**: Frontend was hitting `localhost:8080` in production.  
**Fixed**: Changed workflow env var from `VITE_API_URL` to `VITE_API_BASE_URL`.

**Issue**: Phone save fails with 500.  
**Root cause**: `Users` table missing `phone` column.  
**Fix**: Add column (see "Recommended Fix" above).

---

## Architecture Overview (for context)

```
???????????????????????????????????????????????????????????
?        React Frontend (Azure Static Web Apps)          ?
?  - Vite bundled SPA                                     ?
?  - JWT token in localStorage                            ?
?  - Env: VITE_API_BASE_URL (baked in at build time)     ?
???????????????????????????????????????????????????????????
                     ? HTTPS
                     ?
???????????????????????????????????????????????????????????
?     Express API (Azure Container Apps)                  ?
?  - Node.js 18 + TypeScript                             ?
?  - JWT authentication (bcrypt + jsonwebtoken)          ?
?  - Managed Identity auth to SQL/Cosmos                 ?
?  - Endpoints: /api/auth/*, /api/users/*               ?
???????????????????????????????????????????????????????????
         ?                        ?
         ?                        ?
????????????????????      ???????????????????
?  Azure SQL DB    ?      ?   Cosmos DB     ?
?  - Users table   ?      ?   - Activities  ?
?  - Managed ID    ?      ?   - Logs        ?
?    access        ?      ?                 ?
????????????????????      ???????????????????
```

---

## Next Steps for Next Agent

1. **Add `phone` column to `Users` table** (run schema update on prod DB).
2. **Verify phone save works** (re-test registration flow in UI).
3. **Optional**: Move phone input to registration form (remove modal).
4. **Commit & deploy** changes.
5. **Update docs** (if needed) to reflect phone field availability.

---

## Contact / Handoff Notes

- **Template owner**: Harry James Greenblatt (HJG@sequitur.solutions)
- **Azure subscription**: (see `az account show`)
- **Repo**: https://github.com/HarryJamesGreenblatt/A-Riff-In-React
- **Branch**: `main` (production)

All critical deployment issues resolved except phone schema. Registration/login fully functional. Frontend-backend integration complete.

---

**End of handoff. Good luck!**
