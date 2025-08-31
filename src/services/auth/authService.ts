import { msalInstance } from "./msalInstance";
import { loginRequest } from "../../config/authConfig";
import { store } from "../../store";
import { setCurrentUser } from "../../features/users/slice";

export class AuthService {
  /**
   * Sign in using popup
   */
  static async signIn() {
    try {
      // Use redirect instead of popup for more reliable authentication
      await msalInstance.loginRedirect(loginRequest);
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
      // For now, just use the basic scopes since we don't have API scopes configured
      const response = await msalInstance.acquireTokenSilent({
        scopes: ["openid", "profile", "email"],
        account,
      });
      return response.accessToken;
    } catch (error) {
      console.warn("Silent token acquisition failed. Falling back to popup.", error);
      try {
        const response = await msalInstance.acquireTokenPopup({
          scopes: ["openid", "profile", "email"],
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
