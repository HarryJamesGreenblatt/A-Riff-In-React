# Authentication with MSAL (Microsoft Authentication Library)

This document describes the MSAL authentication implementation in **A Riff In React**.

## Current Status: ✅ FULLY WORKING

As of August 31, 2025, the Microsoft Entra External ID authentication system is **fully functional**:

- ✅ **User Authentication**: Microsoft login/logout working perfectly
- ✅ **Token Management**: Access token acquisition and refresh working
- ✅ **Redux Integration**: User state properly managed in Redux store
- ✅ **Redirect Flow**: Secure redirect-based authentication (no popup issues)
- ✅ **Environment Configuration**: Proper port handling and redirect URIs
- ✅ **TypeScript Compliance**: All type imports properly configured

## Overview

The application uses MSAL (Microsoft Authentication Library) for React to provide secure authentication through Microsoft Entra External ID. This enables:

- Single Sign-On (SSO) with Microsoft accounts
- Secure token management with automatic refresh
- User profile extraction from Microsoft identity
- Protected API access preparation (backend deployment pending)

## Architecture

### MSAL Configuration

The MSAL configuration is centralized in `src/config/authConfig.ts`:

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: "your-client-id",
    authority: "https://login.microsoftonline.com/your-tenant-id",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

### Authentication Service

The `AuthService` class in `src/services/auth/authService.ts` provides:

- Sign in/out functionality
- Token acquisition for API calls
- User profile fetching from Microsoft Graph
- Integration with Redux store

### React Integration

MSAL is integrated at multiple levels:

1. **MsalProvider**: Wraps the entire app in `src/main.tsx`
2. **useAuth Hook**: Provides authentication state and methods to components
3. **AuthGuard Component**: Protects routes that require authentication
4. **API Integration**: Automatically injects tokens into API requests

## Setup Instructions

### 1. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Click "New registration"
4. Configure:
   - Name: "A Riff In React"
   - Supported account types: Choose based on your needs
   - Redirect URI: `http://localhost:5173` (for development)
5. Note the Application (client) ID and Directory (tenant) ID

### 2. Configure API Permissions

In your app registration:
1. Go to "API permissions"
2. Add permissions:
   - Microsoft Graph: `User.Read` (for user profile)
   - Your API: Add any custom API scopes

### Environment Configuration

Create a `.env` file in the project root:

```bash
# Working configuration as of August 31, 2025
VITE_ENTRA_CLIENT_ID="8e217770-697f-497e-b30b-27b214e87db1"
VITE_ENTRA_TENANT_ID="813307d1-6d39-4c75-8a38-2e34128203bc"
VITE_REDIRECT_URI="http://localhost:5173"
VITE_POST_LOGOUT_URI="http://localhost:5173"
VITE_API_BASE_URL="https://a-riff-in-react.azurewebsites.net/api"
VITE_API_SCOPE="api://a-riff-in-react/access_as_user"
```

**Important Notes:**
- The app is configured to run on port 5173 to match redirect URIs
- API scope is currently not used (basic scopes work fine)
- Backend API URL is configured but deployment is pending

### 4. Install Dependencies

```bash
npm install @azure/msal-browser @azure/msal-react
```

## Usage

### Basic Authentication

```typescript
import { useAuth } from '../../hooks/useAuth';

const MyComponent = () => {
  const { isAuthenticated, currentUser, signIn, signOut } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <div>
          Welcome, {currentUser?.name}!
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={signIn}>Sign In</button>
      )}
    </div>
  );
};
```

### Protected Routes

Use the `AuthGuard` component to protect routes:

```typescript
import { AuthGuard } from './components/auth/AuthGuard';

const App = () => {
  return (
    <AuthGuard>
      <ProtectedContent />
    </AuthGuard>
  );
};
```

### API Calls with Authentication

RTK Query automatically includes the authentication token:

```typescript
// Tokens are automatically added by the baseQuery configuration
const { data } = useGetUsersQuery();
```

### Manual Token Acquisition

For custom API calls:

```typescript
const { getAccessToken } = useAuth();

const makeApiCall = async () => {
  const token = await getAccessToken();
  const response = await fetch('/api/data', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};
```

## Microsoft Entra External ID Authentication

Microsoft Entra External ID provides external user authentication with modern identity features. Your React app uses MSAL to connect to your Entra tenant for user authentication.

### 1. Register Your App in Microsoft Entra

1. In the Azure Portal, go to **Azure Active Directory** > **App registrations** > **New registration**
2. Name: `A-Riff-In-React`, Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**, Redirect URI: `http://localhost:5173`
3. Note the **Application (client) ID** and **Directory (tenant) ID**

### 2. Configure Authentication

1. Under **Authentication**, add additional redirect URIs for your deployed app (e.g., `https://yourapp.azurewebsites.net`)
2. Enable **ID tokens** under **Implicit grant and hybrid flows**

### 3. Environment Variables

Create a `.env.local` file:

```env
VITE_ENTRA_CLIENT_ID=<your-client-id>
VITE_ENTRA_TENANT_ID=<your-tenant-id>
VITE_REDIRECT_URI=http://localhost:5173
VITE_POST_LOGOUT_URI=http://localhost:5173
```

### 4. Authentication Configuration

The `src/config/authConfig.ts` is already configured to use Microsoft Entra External ID with the environment variables above.

## Security Best Practices

1. **Token Storage**: Tokens are stored in sessionStorage (not localStorage) for better security
2. **HTTPS Only**: Always use HTTPS in production
3. **Scope Minimization**: Only request necessary permissions
4. **Token Validation**: Validate tokens on the backend
5. **Error Handling**: Implement proper error handling for auth failures

## Current Implementation Details

### Authentication Flow (Working)

1. **User clicks "Login"** → Triggers `AuthService.signIn()`
2. **MSAL redirect flow** → User redirected to Microsoft login
3. **Successful authentication** → User redirected back to app with tokens
4. **Token validation** → MSAL validates and caches tokens
5. **User state update** → Redux store updated with user profile
6. **UI update** → App shows authenticated state with user info

### Token Management (Working)

- **Basic scopes**: `['openid', 'profile', 'email']` - Working perfectly
- **API scopes**: Currently disabled (will be re-enabled when backend is deployed)
- **Token storage**: Session storage (secure)
- **Automatic refresh**: MSAL handles token refresh automatically

### Known Working Configuration

**Azure AD App Registration:**
- Client ID: `8e217770-697f-497e-b30b-27b214e87db1`
- Tenant ID: `813307d1-6d39-4c75-8a38-2e34128203bc`
- Redirect URIs: `http://localhost:5173`, `https://a-riff-in-react.azurewebsites.net`
- Platform: Single Page Application (SPA)

### Troubleshooting - Issues Fixed

1. **✅ Fixed: Invalid API Scope Error**
   - **Problem**: 400 Bad Request when requesting `api://a-riff-in-react/access_as_user`
   - **Cause**: API scope not configured in Azure AD app registration
   - **Solution**: Temporarily use basic scopes until backend API is deployed

2. **✅ Fixed: Port Mismatch**
   - **Problem**: App running on port 5174 but redirect URI set to 5173
   - **Cause**: Vite port auto-increment and environment variable mismatch
   - **Solution**: Consistent port configuration in .env files

3. **✅ Fixed: Popup Authentication Issues**
   - **Problem**: Popup authentication blocked/unreliable
   - **Solution**: Switched to redirect-based authentication flow

4. **✅ Fixed: TypeScript Errors**
   - **Problem**: `AuthenticationResult` import error with verbatimModuleSyntax
   - **Solution**: Used type-only import: `import type { AuthenticationResult }`

## Integration with Backend

The frontend authentication flow is tightly integrated with the backend API to ensure a persistent user record is created upon first login.

1.  **MSAL Login**: The user initiates a login via the `LoginButton`, which triggers the MSAL popup flow.
2.  **Token Acquisition**: Upon successful authentication with Microsoft Entra, MSAL provides an account object and an ID token.
3.  **Backend Sync (`authService.ts`)**: The `signIn` method in `src/services/auth/authService.ts` is called. This service orchestrates the communication with our backend:
    *   It first calls the `createUser` endpoint on our Node.js API (`POST /api/users`), sending the user's name and email from the MSAL account.
    *   The backend API checks if a user with that email already exists.
        *   If not, it creates a new record in the Azure SQL database and returns a `201 Created` status.
        *   If the user already exists, it returns a `409 Conflict` status, which is handled gracefully by the frontend.
    *   The `signIn` service then dispatches a Redux action to store the user's data in the local state.

This ensures that every user who logs in via MSAL has a corresponding, persistent user profile in the application's database, which can be enriched with application-specific roles and data.

The backend API (`api/src/routes/userRoutes.ts`) is an Express.js application running on Azure Functions. It handles the database logic for creating and retrieving users from the Azure SQL database. The API itself is stateless and does not handle token validation in this flow, as it is currently designed to be called by the trusted frontend immediately after a successful MSAL login. For direct API calls from external clients, token validation would be a necessary security addition.

## Next Steps

- [ ] Implement role-based access control (RBAC)
- [ ] Add multi-factor authentication (MFA) support
- [ ] Configure conditional access policies
- [ ] Implement token caching strategies
- [ ] Add B2C support for external users

---

> _For more information on MSAL, see the [official documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)_
