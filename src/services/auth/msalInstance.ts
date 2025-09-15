import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../../config/authConfig";
import { store } from "../../store";
import { setCurrentUser } from "../../features/users/slice";

// Export a lazily-created MSAL instance. The instance will be constructed inside
// `initializeMsal()` so runtime environment changes (or dev-server restarts) can
// take effect without creating multiple instances at module load time.
export let msalInstance: PublicClientApplication | null = null;

// Initialize the MSAL instance (create if not created yet)
export const initializeMsal = async () => {
  try {
    if (!msalInstance) {
      msalInstance = new PublicClientApplication(msalConfig as any);
    }

    console.debug("MSAL config (resolved):", {
      clientId: msalInstance.getConfiguration().auth.clientId,
      authority: msalInstance.getConfiguration().auth.authority,
      redirectUri: msalInstance.getConfiguration().auth.redirectUri,
      postLogoutRedirectUri: msalInstance.getConfiguration().auth.postLogoutRedirectUri,
    });

    await msalInstance.initialize();

    // Handle redirect promise
    const response = await msalInstance.handleRedirectPromise();
    if (response && response.account) {
      console.log("Redirect response:", response);

      // Set the active account
      msalInstance.setActiveAccount(response.account);

      // Create/fetch user in backend after successful login
      const entraUser = response.account;

      // TODO: Re-enable once backend API is deployed and working
      console.log("✅ Authentication successful! User:", entraUser.name, entraUser.username);

      // For now, just set a mock user object based on Entra ID data
      const mockUser = {
        id: entraUser.localAccountId,
        name: entraUser.name || "Unknown User",
        email: entraUser.username || "unknown@example.com",
        role: "user" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.dispatch(setCurrentUser(mockUser));
    }

    // Set active account if there's one in the cache
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
      msalInstance.setActiveAccount(accounts[0]);
    }
    // DEV: expose the instance on window for quick inspection in the browser console.
    // This is intentionally gated to avoid leaking in production builds.
    try {
      if (import.meta.env.DEV && typeof window !== "undefined") {
        // @ts-ignore - attach debug helper in dev only
        window.__msalInstanceDebug = msalInstance;
      }
    } catch (e) {
      // ignore any environment-related issues when running in non-browser contexts
    }
  } catch (error) {
    console.error("MSAL initialization error:", error);
  }
};
