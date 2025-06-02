import type { AccountInfo } from "@azure/msal-browser";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { msalInstance } from "./msalInstance";
import { loginRequest, apiConfig, graphConfig } from "../../config/authConfig";
import { store } from "../../store";
import { setCurrentUser, logout as logoutAction } from "../../features/users/slice";
import type { User } from "../../features/users/slice";

export class AuthService {
  /**
   * Sign in using popup
   */
  static async signIn() {
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      msalInstance.setActiveAccount(response.account);
        // Fetch user profile from Graph API
      const userProfile = await this.getUserProfile(response.account);
      
      // Convert MSAL account to our User type, enriched with Graph API data
      const user: User = {
        id: response.account.localAccountId,
        email: response.account.username,
        name: userProfile?.displayName || response.account.name || "Unknown User",
        role: "user", // Default role, should be fetched from backend
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Update Redux store
      store.dispatch(setCurrentUser(user));
      
      // Store auth token for API calls
      const tokenResponse = await this.getApiToken();
      if (tokenResponse) {
        localStorage.setItem("authToken", tokenResponse.accessToken);
      }
      
      return response;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  static async signOut() {
    try {
      // Clear Redux store
      store.dispatch(logoutAction());
      
      // Clear stored tokens
      localStorage.removeItem("authToken");
      
      // Sign out from MSAL
      await msalInstance.logoutPopup();
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  /**
   * Get access token for API calls
   */
  static async getApiToken() {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      throw new Error("No active account");
    }

    const request = {
      scopes: apiConfig.scopes,
      account: account,
    };

    try {
      // Try to acquire token silently first
      const response = await msalInstance.acquireTokenSilent(request);
      return response;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Fallback to interactive method if silent fails
        return await msalInstance.acquireTokenPopup(request);
      }
      throw error;
    }
  }

  /**
   * Get user profile from Microsoft Graph
   */
  static async getUserProfile(account: AccountInfo) {
    try {
      const response = await msalInstance.acquireTokenSilent({
        scopes: ["User.Read"],
        account: account,
      });

      const headers = new Headers();
      headers.append("Authorization", `Bearer ${response.accessToken}`);

      const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
        method: "GET",
        headers: headers,
      });

      return await graphResponse.json();
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return msalInstance.getAllAccounts().length > 0;
  }

  /**
   * Get current account
   */
  static getCurrentAccount(): AccountInfo | null {
    return msalInstance.getActiveAccount();
  }
}
