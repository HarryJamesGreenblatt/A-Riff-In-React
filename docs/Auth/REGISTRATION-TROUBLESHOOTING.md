# Registration Troubleshooting Guide

**Issue**: Registration fails when attempting to create a new account from the frontend  
**Context**: Running `npm run dev` locally (not production site)  
**Date**: December 2024

---

## ?? Root Cause Analysis

The registration is failing because the **frontend is not configured to connect to the deployed API**.

### What's Happening:

1. Frontend is running locally via `npm run dev` on `http://localhost:5173`
2. Frontend `authService.ts` is configured to use:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
   ```
3. **No `.env.local` file exists** with the production API URL
4. Frontend defaults to `http://localhost:8080` (which is not running)
5. Registration request fails because no API is listening on that port

### Expected Configuration:

The frontend should be configured to connect to your deployed Azure Container App API:
```
https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io
```

---

## ? Solution: Configure Frontend to Use Production API

### Step 1: Create `.env.local` File

In the **project root directory** (not in `/api`), create a file named `.env.local`:

```env
# Frontend Environment Variables for Local Development

# Production API (deployed to Azure Container Apps)
VITE_API_BASE_URL=https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io
```

### Step 2: Restart the Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

The Vite dev server will now load the environment variables and connect to the production API.

### Step 3: Test Registration Again

1. Open `http://localhost:5173` in your browser
2. Navigate to `/register`
3. Fill in the registration form:
   - **Full Name**: Harry James Greenblatt
   - **Email**: harryjamesgreenblatt@outlook.com
   - **Password**: (minimum 8 characters)
   - **Confirm Password**: (same as password)
4. Click **Create Account**

### Expected Result:

? Registration succeeds  
? User is created in the Azure SQL database  
? JWT token is returned and stored in localStorage  
? User is automatically logged in  
? Redirected to dashboard/home page

---

## ?? How to Verify It's Working

### Check Browser Network Tab:

1. Open Chrome DevTools (F12)
2. Go to the **Network** tab
3. Submit the registration form
4. Look for a request to:
   ```
   POST https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io/api/auth/register
   ```

### Successful Response (201 Created):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "harryjamesgreenblatt@outlook.com",
    "name": "Harry James Greenblatt",
    "role": "member",
    "createdAt": "2024-12-12T..."
  }
}
```

### After Registration:

Check localStorage in the browser console:
```javascript
// Open Console (F12)
localStorage.getItem('authToken')  // Should show JWT token
localStorage.getItem('user')       // Should show user object
```

---

## ?? Prerequisites

Before testing registration, ensure:

### 1. Database Schema is Applied

The `Users` table must exist in your Azure SQL database. Check by running:

```bash
# Azure Cloud Shell
sqlcmd -S sequitur-sql-server.database.windows.net -d riff-react-db -G

SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users';
GO
```

If the table doesn't exist, create it:

```sql
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NULL,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'member',
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO
```

### 2. Managed Identity Has SQL Permissions

The Container App's managed identity needs database access. Run:

```bash
# Azure Cloud Shell
sqlcmd -S sequitur-sql-server.database.windows.net -d riff-react-db -G

-- Get the managed identity principal ID from GitHub Actions output
-- or run: az identity show --name id-a-riff-in-react --resource-group riffinreact-rg --query principalId -o tsv

CREATE USER [<PRINCIPAL_ID>] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [<PRINCIPAL_ID>];
ALTER ROLE db_datawriter ADD MEMBER [<PRINCIPAL_ID>];
GO
```

**See**: `docs/Auth/SQL-SETUP-STEP-BY-STEP.md`

### 3. CORS is Configured

Verify that the Container App's CORS settings include `http://localhost:5173`:

```bash
az containerapp show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query "properties.template.containers[0].env[?name=='CORS_ORIGINS'].value" \
  --output tsv
```

Should include:
```
https://a-riff-in-react.harryjamesgreenblatt.com,http://localhost:5173
```

This is already configured in `.github/workflows/container-deploy.yml` ?

---

## ?? Common Errors and Solutions

### Error: "Registration failed. Please try again."

**Possible Causes:**

1. **No `.env.local` file** ? Create it with `VITE_API_BASE_URL`
2. **Wrong API URL** ? Verify the Container App URL
3. **Dev server not restarted** ? Restart after creating `.env.local`

### Error: Network request failed / ERR_CONNECTION_REFUSED

**Cause**: Frontend is trying to connect to `http://localhost:8080` (not running)

**Solution**: Create `.env.local` with production API URL

### Error: CORS policy blocked the request

**Cause**: Container App CORS doesn't include `http://localhost:5173`

**Solution**: CORS is already configured in the workflow ?  
If needed, update `CORS_ORIGINS` in `.github/workflows/container-deploy.yml`

### Error: 500 Internal Server Error

**Possible Causes:**

1. **Database not accessible** ? Check managed identity permissions
2. **Users table doesn't exist** ? Create the table (see Prerequisites)
3. **SQL connection failed** ? Check Container App logs

**Check logs:**
```bash
az containerapp logs show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --follow
```

### Error: 409 Conflict - Email already registered

**Cause**: User with this email already exists in the database

**Solution**: Use a different email or delete the existing user:
```sql
-- Azure Cloud Shell
sqlcmd -S sequitur-sql-server.database.windows.net -d riff-react-db -G

DELETE FROM Users WHERE email = 'harryjamesgreenblatt@outlook.com';
GO
```

---

## ?? Development vs Production Configuration

### Local Development (Current Setup):
```
Frontend: http://localhost:5173 (npm run dev)
API: https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io (Azure)
Database: Azure SQL (production)
```

**Benefits:**
- ? No local API setup needed
- ? Test against real production API
- ? Same database as production

**Considerations:**
- ?? Uses production database (be careful with test data)
- ?? Slower than local API (network latency)

### Full Local Stack (Alternative):
```
Frontend: http://localhost:5173 (npm run dev)
API: http://localhost:8080 (npm run dev in /api)
Database: Local SQL Server (Docker)
```

**Setup for Full Local Stack:**
```bash
# Terminal 1: Start local API
cd api
npm run dev

# Terminal 2: Start frontend with local API
# Create .env.local:
echo "VITE_API_BASE_URL=http://localhost:8080" > .env.local
npm run dev
```

---

## ? Quick Reference

### Current Configuration:
```env
# .env.local (create in project root)
VITE_API_BASE_URL=https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io
```

### Container App URL:
```
https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io
```

### Health Check:
```bash
curl https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io/health
```

### GitHub Workflow:
```
.github/workflows/container-deploy.yml
```

---

## ?? Next Steps

After registration works:

1. ? Test login flow (`/login`)
2. ? Test protected routes
3. ? Test logout functionality
4. ? Verify token persistence across page refreshes
5. ? Test token expiration handling (after 7 days)

**See**: `docs/Auth/TESTING-JWT-AUTHENTICATION.md`

---

**Status**: Ready to test after creating `.env.local` ?  
**Last Updated**: December 2024
