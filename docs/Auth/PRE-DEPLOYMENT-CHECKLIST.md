# Pre-Deployment Checklist

## ? Code Status

### Backend
- [x] Dependencies installed (bcrypt, jsonwebtoken)
- [x] TypeScript compiles without errors
- [x] API server starts successfully
- [x] Auth routes implemented
- [x] Middleware created
- [x] Database schema updated

### Frontend
- [x] MSAL dependencies removed
- [x] Axios dependency added
- [x] Auth service updated
- [x] Login component created
- [x] Register component updated
- [x] Protected route created
- [x] CSS styling added

### Infrastructure
- [x] Bicep template JWT-ready
- [x] GitHub workflow JWT-ready
- [x] JWT_SECRET in GitHub Secrets
- [x] CORS_ORIGINS configured

## ?? Critical Pre-Deployment Tasks

### 1. Database Migration (MUST DO BEFORE PUSH)

The database schema MUST be updated before deploying. Run this on your Azure SQL Database:

```sql
-- File: api/schema.sql
-- Run this BEFORE pushing to GitHub

USE ARiffInReact;
GO

-- Add new columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'passwordHash')
BEGIN
    ALTER TABLE Users ADD passwordHash NVARCHAR(255) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'name')
BEGIN
    ALTER TABLE Users ADD name NVARCHAR(255) NULL;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'role')
BEGIN
    ALTER TABLE Users ADD role NVARCHAR(50) NOT NULL DEFAULT 'member';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'emailVerified')
BEGIN
    ALTER TABLE Users ADD emailVerified BIT NOT NULL DEFAULT 0;
END
GO
```

**How to run**:
```bash
# Option 1: Azure Data Studio
# 1. Connect to sequitur-sql-server.database.windows.net
# 2. Select database: riff-react-db
# 3. Open api/schema.sql
# 4. Execute the migration section

# Option 2: Azure CLI
az sql db show-connection-string --server sequitur-sql-server --name riff-react-db --client sqlcmd
# Use the connection string with sqlcmd to run the script
```

### 2. Verify GitHub Secrets

Run this to confirm secrets are set:
```bash
gh secret list --repo HarryJamesGreenblatt/A-Riff-In-React
```

Expected output should include:
- ? JWT_SECRET
- ? AZURE_CREDENTIALS
- ? SQL_ADMIN_PASSWORD

### 3. Review Changed Files

```bash
git status
```

Expected changes:
- api/package.json (bcrypt, jsonwebtoken added)
- api/src/middleware/auth.ts (NEW)
- api/src/routes/authRoutes.ts (NEW)
- api/src/services/sqlService.ts (query function added)
- api/src/index.ts (auth routes added)
- api/schema.sql (updated)
- package.json (MSAL removed, axios added)
- src/services/auth/authService.ts (JWT implementation)
- src/components/auth/LoginForm.tsx (NEW)
- src/components/auth/RegisterForm.tsx (updated)
- src/components/auth/ProtectedRoute.tsx (NEW)
- src/components/auth/AuthForms.css (NEW)
- docs/Auth/REFACTOR-COMPLETE.md (NEW)
- docs/Auth/TESTING-GUIDE.md (NEW)

## ?? STOP! Before Pushing

### Critical Question: Is the database migrated?
- [ ] NO - **DO NOT PUSH YET**. Run the migration first.
- [ ] YES - Proceed to commit and push

### Why This Matters
If you push without migrating the database:
1. ? Container Apps will deploy successfully
2. ? API will start
3. ? Health check will pass
4. ? BUT: Registration will fail with SQL errors (missing columns)
5. ? Login will fail
6. ? Auth routes will be broken

## ? Ready to Deploy

Once database is migrated, proceed with:

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: implement JWT authentication

BREAKING CHANGE: Migrates from MSAL/Entra External ID to JWT authentication

Backend:
- Add bcrypt password hashing (10 rounds)
- Add JWT token generation and validation
- Create auth routes: /api/auth/register, /api/auth/login, /api/auth/me
- Add auth middleware for token validation
- Update database schema with passwordHash, name, role, emailVerified

Frontend:
- Remove MSAL dependencies (@azure/msal-browser, @azure/msal-react)
- Add axios for HTTP requests
- Replace AuthService with JWT implementation
- Create LoginForm and update RegisterForm components
- Add ProtectedRoute component for route protection
- Add modern authentication UI styling

Infrastructure:
- No changes needed (already JWT-ready)
- Uses JWT_SECRET from GitHub Secrets
- CORS configured for frontend URLs

Prerequisites:
- Database schema migration completed (api/schema.sql)
- JWT_SECRET exists in GitHub Secrets

Docs:
- Add REFACTOR-COMPLETE.md
- Add TESTING-GUIDE.md"

# Push to trigger deployment
git push origin main
```

## ?? Deployment Monitoring

After pushing, monitor the deployment:

```bash
# Watch the GitHub Actions workflow
gh run watch

# Or view in browser
# https://github.com/HarryJamesGreenblatt/A-Riff-In-React/actions
```

Expected deployment flow:
1. ? Checkout code
2. ? Build Docker image with new dependencies
3. ? Push to Azure Container Registry
4. ? Deploy Bicep infrastructure (no changes, but validates)
5. ? Update Container App with new image
6. ? Health check passes

## ?? Post-Deployment Verification

Once deployed, verify:

```bash
# 1. Check health endpoint
curl https://ca-api-a-riff-in-react.westus.azurecontainerapps.io/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2024-12-...",
#   "environment": "production",
#   "authStrategy": "JWT",  <-- THIS IS KEY
#   "version": "1.0.2"
# }

# 2. Test registration (replace with your domain)
curl -X POST https://ca-api-a-riff-in-react.westus.azurecontainerapps.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'

# 3. Test login
curl -X POST https://ca-api-a-riff-in-react.westus.azurecontainerapps.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

## ?? Rollback Plan

If deployment fails or breaks:

```bash
# Option 1: Revert the commit
git revert HEAD
git push origin main

# Option 2: Redeploy previous working version
git log --oneline  # Find last working commit
git reset --hard <commit-sha>
git push origin main --force  # CAREFUL with --force
```

## ?? Decision Point

**Are you ready to deploy?**

? **YES** - Database is migrated:
```bash
git add .
git commit -m "feat: implement JWT authentication"
git push origin main
```

? **NO** - Database NOT migrated yet:
1. First, migrate the database (see section 1 above)
2. Then come back and run the git commands

## ?? Next Steps After Successful Deployment

1. **Update App.tsx** to add routes for /login, /register
2. **Test end-to-end** authentication flow
3. **Update README** with new authentication info
4. **Archive MSAL docs** completely (move to archive folder)
5. **Clean up GitHub Secrets** (remove obsolete ENTRA/MSAL secrets)

---

**Current Status**: ?? Ready to Deploy (Pending Database Migration)
**Blocker**: Database schema must be updated first
**Next Action**: Migrate database, then push to trigger deployment
