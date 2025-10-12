# Testing JWT Authentication - Step-by-Step Guide

**Date**: December 12, 2024  
**Status**: Ready for Testing (after SQL setup)

---

## ?? Current Status

### ? What's Ready
- ? Backend API deployed with JWT routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)
- ? Frontend code updated with JWT authentication
- ? Database schema defined (`api/schema.sql`)
- ? Container App running at: `ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io`

### ?? What's Blocking Testing
- ? **SQL Schema Not Applied** - The Users table doesn't exist yet in the production database
- ? **SQL Permissions Not Set** - Container App managed identity can't access database yet

---

## ?? Prerequisites (Must Complete First!)

### Step 1: Set Up SQL Database Permissions (5 minutes)

The Container App needs permission to access your SQL database. Run these commands in Azure Cloud Shell:

```bash
# 1. Open Azure Cloud Shell
# Go to: https://shell.azure.com

# 2. Connect to the database with Azure AD authentication
sqlcmd -S sequitur-sql-server.database.windows.net -d riff-react-db -G

# 3. Grant permissions to the Container App's managed identity
CREATE USER [6b3d9f97-b02a-44d9-bace-253cd5efb20a] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [6b3d9f97-b02a-44d9-bace-253cd5efb20a];
ALTER ROLE db_datawriter ADD MEMBER [6b3d9f97-b02a-44d9-bace-253cd5efb20a];
GO

# 4. Exit
exit
```

**Verification:**
```bash
# Check if the user was created successfully
SELECT name, type_desc FROM sys.database_principals WHERE name = '6b3d9f97-b02a-44d9-bace-253cd5efb20a';
```

---

### Step 2: Apply Database Schema (2 minutes)

Now create the Users table by running the schema script:

```bash
# Still in Azure Cloud Shell
sqlcmd -S sequitur-sql-server.database.windows.net -d riff-react-db -G

# Copy and paste the schema from api/schema.sql
# Or run it line by line:
```

```sql
-- Create Users table
CREATE TABLE Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) NOT NULL UNIQUE,
    passwordHash NVARCHAR(255) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'member',
    emailVerified BIT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Create index on email
CREATE UNIQUE INDEX IX_Users_Email ON Users(email);
GO

-- Verify table was created
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users';
GO
```

**Expected output:**
```
TABLE_NAME
----------
Users
```

---

## ?? Testing Plan

Once the SQL setup is complete, you can test the authentication flow!

---

### Test 1: Health Check (Verify API is Running)

```bash
curl https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-12-12T...",
  "environment": "production",
  "authStrategy": "JWT",
  "version": "1.0.2"
}
```

? **Status**: This already works!

---

### Test 2: Register a New User

```bash
curl -X POST https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "abc123...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "member",
    "createdAt": "2024-12-12T..."
  }
}
```

**Possible Errors:**

1. **500 Internal Server Error** - SQL permissions not set
   ```json
   { "error": "Internal server error" }
   ```
   ? **Solution**: Complete Step 1 (SQL permissions)

2. **500 Internal Server Error** - Users table doesn't exist
   ```json
   { "error": "Internal server error" }
   ```
   ? **Solution**: Complete Step 2 (Apply schema)

3. **409 Conflict** - Email already registered
   ```json
   { "error": "Email already registered" }
   ```
   ? **Solution**: Use a different email address

---

### Test 3: Login with Credentials

```bash
curl -X POST https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "member"
  }
}
```

**Copy the token** - you'll need it for the next test!

**Possible Errors:**

1. **401 Unauthorized** - Invalid credentials
   ```json
   { "error": "Invalid credentials" }
   ```
   ? **Solution**: Check email/password, or register first

---

### Test 4: Access Protected Route

```bash
# Replace <YOUR_TOKEN> with the token from Test 3
curl -X GET https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io/api/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Expected Response (200 OK):**
```json
{
  "user": {
    "id": "abc123...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "member",
    "createdAt": "2024-12-12T..."
  }
}
```

**Possible Errors:**

1. **401 Unauthorized** - No token provided
   ```json
   { "error": "No token provided" }
   ```
   ? **Solution**: Include the Authorization header

2. **403 Forbidden** - Invalid or expired token
   ```json
   { "error": "Invalid token" }
   ```
   ? **Solution**: Get a new token by logging in again

---

## ??? Frontend Testing

Once the backend tests pass, test the frontend locally:

### Step 1: Configure Environment

Create `.env.local` in the project root:

```env
VITE_API_BASE_URL=https://ca-api-a-riff-in-react.bravecliff-56e777dd.westus.azurecontainerapps.io
```

### Step 2: Start Frontend

```bash
npm run dev
```

### Step 3: Test Registration Flow

1. Open http://localhost:5173 in your browser
2. Click "Register" or navigate to `/register`
3. Fill in:
   - Name: "Test User"
   - Email: "test2@example.com"
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
4. Click "Create Account"

**Expected:**
- ? Registration succeeds
- ? Automatically logged in
- ? Token stored in localStorage
- ? Redirected to dashboard/home

**Check Browser DevTools:**
```javascript
// Open Console and check localStorage
localStorage.getItem('authToken')  // Should show JWT token
localStorage.getItem('user')       // Should show user object
```

### Step 4: Test Login Flow

1. If logged in, click "Sign Out"
2. Click "Log In" or navigate to `/login`
3. Enter:
   - Email: "test2@example.com"
   - Password: "SecurePass123!"
4. Click "Sign In"

**Expected:**
- ? Login succeeds
- ? Token stored in localStorage
- ? Redirected to dashboard/home
- ? User name displayed in navbar

### Step 5: Test Protected Routes

1. While logged in, navigate to protected routes (if any)
2. Click "Sign Out"
3. Try to access protected routes

**Expected:**
- ? Can access protected routes when authenticated
- ? Redirected to /login when not authenticated

### Step 6: Test Token Expiration

The JWT token expires after 7 days, but you can test the expiration flow:

```javascript
// In Browser Console
// Corrupt the token to simulate expiration
localStorage.setItem('authToken', 'invalid-token')

// Try to access a protected route or refresh the page
// Should automatically redirect to /login
```

---

## ?? Troubleshooting

### Problem: "Internal server error" on registration/login

**Check Container App Logs:**
```bash
az containerapp logs show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --follow
```

**Common causes:**
1. SQL permissions not set ? Complete Step 1
2. Users table doesn't exist ? Complete Step 2
3. Database connection issue ? Check environment variables

### Problem: CORS errors in frontend

**Error:** `Access to XMLHttpRequest at '...' from origin 'http://localhost:5173' has been blocked by CORS policy`

**Solution:** Make sure CORS_ORIGINS includes `http://localhost:5173`

Check Container App environment variables:
```bash
az containerapp show \
  --name ca-api-a-riff-in-react \
  --resource-group riffinreact-rg \
  --query "properties.template.containers[0].env[?name=='CORS_ORIGINS'].value" \
  --output tsv
```

Should include: `http://localhost:5173,https://your-production-url`

### Problem: Token not being saved/loaded

**Check:**
1. Open Browser DevTools ? Application ? Local Storage
2. Verify `authToken` and `user` are present
3. Check for browser privacy settings blocking localStorage

---

## ? Success Criteria

You know authentication is working when:

- ? Can register a new user without errors
- ? Can login with valid credentials
- ? Receive a JWT token on login
- ? Token is stored in localStorage
- ? Can access protected routes with token
- ? Redirected to /login when token is invalid/missing
- ? Can logout and token is removed
- ? User info displays correctly in UI

---

## ?? Next Steps After Testing

Once all tests pass:

1. **Deploy Frontend** - Deploy the updated frontend to Azure Static Web Apps
2. **Update Production ENV** - Set VITE_API_BASE_URL to production URL
3. **Monitor Logs** - Watch for any production issues
4. **Security Audit** - Review JWT_SECRET strength, CORS origins
5. **Add Features** - Implement password reset, email verification, etc.

---

**Testing Priority:**
1. ? **High**: Complete SQL setup (Steps 1 & 2)
2. ? **High**: Test backend endpoints (Tests 1-4)
3. ?? **Medium**: Test frontend locally (Steps 1-6)
4. ?? **Low**: Deploy frontend to production

**Estimated Time:**
- SQL Setup: 5-7 minutes
- Backend Testing: 5 minutes
- Frontend Testing: 10 minutes
- **Total: ~20-25 minutes**

---

**Status**: Waiting for SQL setup to begin testing! ??
