import type { Configuration, PopupRequest } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    // Support for both B2C and regular Azure AD configurations
    clientId: import.meta.env.VITE_B2C_CLIENT_ID || import.meta.env.VITE_AZURE_CLIENT_ID || "your-client-id",
    
    // If B2C tenant is specified, use B2C authority format, otherwise use regular AAD authority
    authority: import.meta.env.VITE_B2C_TENANT_NAME 
      ? `https://${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com/${import.meta.env.VITE_B2C_TENANT_NAME}.onmicrosoft.com/${import.meta.env.VITE_B2C_SIGNIN_POLICY || 'B2C_1_signupsignin'}`
      : import.meta.env.VITE_AZURE_AUTHORITY || `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
    
    // Add known authorities for B2C to prevent authority validation issues
    knownAuthorities: import.meta.env.VITE_B2C_TENANT_NAME 
      ? [`${import.meta.env.VITE_B2C_TENANT_NAME}.b2clogin.com`] 
      : [],
      
    redirectUri: import.meta.env.VITE_REDIRECT_URI || import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_URI || import.meta.env.VITE_AZURE_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      logLevel: import.meta.env.DEV ? 3 : 0, // LogLevel.Info in dev, LogLevel.Error in prod
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error(message);
            return;
          case 1: // Warning
            console.warn(message);
            return;
          case 2: // Info
            console.info(message);
            return;
          case 3: // Verbose
            console.debug(message);
            return;
        }
      },
    },
  },
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest: PopupRequest = {
  // For B2C, we typically only need openid, profile scopes
  scopes: import.meta.env.VITE_B2C_TENANT_NAME 
    ? ["openid", "profile", "email"] 
    : ["User.Read", "openid", "profile", "email"],
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

// API scopes for your backend
export const apiConfig = {
  scopes: [import.meta.env.VITE_API_SCOPE || "api://your-api-client-id/access_as_user"],
  apiEndpoint: import.meta.env.VITE_API_BASE_URL || "/api",
};
