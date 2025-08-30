import { msalInstance } from "./msalInstance";
import { loginRequest, apiConfig } from "../../config/authConfig";
import { store } from "../../store";
import { setCurrentUser, usersApi } from "../../features/users/slice";

export class AuthService {
  /**
   * Sign in using popup
   */
  static async signIn() {
    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      
      if (loginResponse.account) {
        const entraUser = loginResponse.account;

        try {
          // Attempt to create the user. The backend should handle "upsert" logic.
          const backendUser = await store.dispatch(usersApi.endpoints.createUser.initiate({
            name: entraUser.name,
            email: entraUser.username,
          })).unwrap();
          
          store.dispatch(setCurrentUser(backendUser));

        } catch (error: any) {
          // If user already exists, backend might return 409 Conflict.
          // In that case, fetch the existing user's data.
          if (error.status === 409 && entraUser.username) {
            console.warn("User already exists, fetching existing user data.");
            const existingUser = await store.dispatch(usersApi.endpoints.getUserByEmail.initiate(entraUser.username)).unwrap();
            store.dispatch(setCurrentUser(existingUser));
          } else {
            throw error; // Re-throw other errors
          }
        }
        
        msalInstance.setActiveAccount(loginResponse.account);
      }
    } catch (error) {
      console.error("MSAL sign-in error:", error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  static async signOut() {
    const currentAccount = msalInstance.getActiveAccount();
    store.dispatch(setCurrentUser(null));
    await msalInstance.logoutRedirect({
      account: currentAccount,
      postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_URI,
    });
  }

  /**
   * Get access token for API calls
   */
  static async getApiToken() {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error("No active account! Please sign in.");
    }

    try {
      const response = await msalInstance.acquireTokenSilent({
        ...apiConfig,
        scopes: apiConfig.scopes,
        account,
      });
      return response.accessToken;
    } catch (error) {
      console.warn("Silent token acquisition failed. Falling back to popup.", error);
      try {
        const response = await msalInstance.acquireTokenPopup({
          ...apiConfig,
          scopes: apiConfig.scopes,
          account,
        });
        return response.accessToken;
      } catch (popupError) {
        console.error("Interactive token acquisition failed.", popupError);
        throw popupError;
      }
    }
  }
}
