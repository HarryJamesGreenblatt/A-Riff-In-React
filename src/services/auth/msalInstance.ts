import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../../config/authConfig";
import { store } from "../../store";
import { setCurrentUser } from "../../features/users/slice";

// Create a PublicClientApplication instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize the MSAL instance
export const initializeMsal = async () => {
  try {
    console.debug("MSAL config (resolved):", {
      clientId: msalInstance.getConfiguration().auth.clientId,
      authority: msalInstance.getConfiguration().auth.authority,
      redirectUri: msalInstance.getConfiguration().auth.redirectUri,
      postLogoutRedirectUri: msalInstance.getConfiguration().auth.postLogoutRedirectUri,
    })
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
      
      /* 
      // COMMENTED OUT UNTIL BACKEND IS FIXED
      try {
        // Attempt to create the user. The backend should handle "upsert" logic.
        const backendUser = await store.dispatch(usersApi.endpoints.createUser.initiate({
          name: entraUser.name,
          email: entraUser.username,
        })).unwrap();
        
        store.dispatch(setCurrentUser(backendUser));

      } catch (error: unknown) {
        // If user already exists, backend might return 409 Conflict.
        // In that case, fetch the existing user's data.
        if (error && typeof error === 'object' && 'status' in error && error.status === 409 && entraUser.username) {
          console.warn("User already exists, fetching existing user data.");
          const existingUser = await store.dispatch(usersApi.endpoints.getUserByEmail.initiate(entraUser.username)).unwrap();
          store.dispatch(setCurrentUser(existingUser));
        } else {
          console.error("Error creating/fetching user:", error);
        }
      }
      */
    }
    
    // Set active account if there's one in the cache
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  } catch (error) {
    console.error("MSAL initialization error:", error);
  }
};
