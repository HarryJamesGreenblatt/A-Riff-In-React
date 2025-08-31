import type { Configuration, PopupRequest } from "@azure/msal-browser";

// MSAL configuration for Microsoft Entra External ID
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID || "your-client-id",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID}`,
    knownAuthorities: [],
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: import.meta.env.DEV ? 3 : 0,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error(message);
            return;
          case 1:
            console.warn(message);
            return;
          case 2:
            console.info(message);
            return;
          case 3:
            console.debug(message);
            return;
        }
      },
    },
  },
};

// Scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest: PopupRequest = {
  scopes: ["openid", "profile", "email"],
  redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

// API scopes for your backend
export const apiConfig = {
  scopes: [import.meta.env.VITE_API_SCOPE || "api://your-api-client-id/access_as_user"],
  apiEndpoint: import.meta.env.VITE_API_BASE_URL || "/api",
};
