# Authentication with MSAL (Microsoft Authentication Library)

This document describes the MSAL authentication implementation in **A Riff In React**.

## Overview

The application uses MSAL (Microsoft Authentication Library) for React to provide secure authentication through Azure Active Directory. This enables:

- Single Sign-On (SSO) with Microsoft accounts
- Secure token management
- Integration with Microsoft Graph API
- Protected API access with OAuth 2.0

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

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_API_SCOPE=api://your-api-client-id/access_as_user
```

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

## Switching to Azure AD B2C for Consumer Sign-up/Sign-in

If you want public-facing email/password and social login (Google, Facebook, Microsoft, etc.) without requiring existing Microsoft accounts, Azure AD B2C is the recommended option. Your React app continues to use MSAL, but points at a B2C tenant and user flows (policies).

### 1. Create an Azure AD B2C Tenant
1. In the Azure Portal, search for **Azure AD B2C** and follow the wizard to create a new B2C directory.
2. Switch your portal session to the new B2C directory (top-right corner).

### 2. Register the SPA App in B2C
1. Under **App registrations**, click **New registration**.
2. Name: `A-Riff-In-React-B2C`, Supported account types: **Accounts in any identity provider or organizational directory (for authenticating users with user flows)**, Redirect URI: `http://localhost:5173`
3. Note the **Application (client) ID**.

### 3. Configure Identity Providers & User Flows (Policies)
1. Under **Identity providers**, register any social providers you need (Google, Facebook, Microsoft personal).
2. Under **User flows**, create a **Sign up and sign in** flow (e.g. `B2C_1_signupsignin`) enabling Local Accounts (Email + Password) and any social providers.
3. Copy the **User flow name** (policy) and the metadata endpoint, which looks like:
   ```text
   https://<your-b2c-tenant>.b2clogin.com/<your-b2c-tenant>.onmicrosoft.com/B2C_1_signupsignin/v2.0/.well-known/openid-configuration
   ```

### 4. Update Environment Variables
Create or update your `.env`:
```bash
VITE_B2C_CLIENT_ID=<your-client-id>
VITE_B2C_TENANT_NAME=<your-b2c-tenant>
VITE_B2C_SIGNIN_POLICY=B2C_1_signupsignin
VITE_REDIRECT_URI=http://localhost:5173
VITE_POST_LOGOUT_URI=http://localhost:5173
```

### 5. Update MSAL Configuration
Modify `src/config/authConfig.ts` to point at B2C:
```ts
import type { Configuration, PopupRequest } from '@azure/msal-browser'

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_B2C_CLIENT_ID!,
    authority: `https://${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com/${import.meta.env.VITE_B2C_TENANT_NAME}.onmicrosoft.com/${import.meta.env.VITE_B2C_SIGNIN_POLICY}`,
    knownAuthorities: [
      `${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com`
    ],
    redirectUri: import.meta.env.VITE_REDIRECT_URI,
    postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_URI,
  },
  // ...existing cache & system configs...
}

export const loginRequest: PopupRequest = {
  scopes: ['openid', 'profile']
}
```

### 6. Use MSAL in Your React App
Everything else in your React code (MsalProvider, hooks, AuthGuard, API calls) remains unchanged. MSAL will now show a combined email/password form and social buttons defined in your B2C user flow.

## Security Best Practices

1. **Token Storage**: Tokens are stored in sessionStorage (not localStorage) for better security
2. **HTTPS Only**: Always use HTTPS in production
3. **Scope Minimization**: Only request necessary permissions
4. **Token Validation**: Validate tokens on the backend
5. **Error Handling**: Implement proper error handling for auth failures

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Ensure the redirect URI in Azure matches your app URL exactly
   - Add both `http://localhost:5173` (dev) and your production URL

2. **Popup Blocked**
   - The app uses popup authentication by default
   - Users may need to allow popups for your domain

3. **Token Expiration**
   - MSAL automatically handles token refresh
   - If issues persist, check token lifetimes in Azure AD

4. **CORS Errors**
   - Ensure your API is configured to accept requests from your app domain
   - Check that the API validates tokens properly

## Integration with Backend

Your backend API should:

1. Validate JWT tokens from Azure AD
2. Extract user information from tokens
3. Implement proper authorization based on roles/claims

Example backend validation (Node.js):

```javascript
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const client = jwksRsa({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function validateToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: clientId,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`
    }, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}
```

## Next Steps

- [ ] Implement role-based access control (RBAC)
- [ ] Add multi-factor authentication (MFA) support
- [ ] Configure conditional access policies
- [ ] Implement token caching strategies
- [ ] Add B2C support for external users

---

> _For more information on MSAL, see the [official documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)_
