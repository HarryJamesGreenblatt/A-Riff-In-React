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
