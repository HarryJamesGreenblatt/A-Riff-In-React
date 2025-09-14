import { msalInstance } from "./msalInstance";
import { loginRequest, userFlowAuthority } from "../../config/authConfig";
import { store } from "../../store";
import { setCurrentUser } from "../../features/users/slice";

export class AuthService {
  /**
   * Sign in using popup
   */
  static async signIn(provider: 'microsoft' | 'google' | 'facebook' = 'microsoft') {
    try {
      if (provider === 'microsoft') {
        // Use redirect for Microsoft login
        await msalInstance.loginRedirect(loginRequest);
      } else if (provider === 'google') {
        // If a user-flow authority is configured (VITE_ENTRA_USER_FLOW_AUTHORITY)
        // then use it for this redirect. That forces MSAL to call the hosted
        // user-flow endpoint (b2clogin) which will present social providers
        // like Google. If not set, fall back to the default loginRequest.
        if (userFlowAuthority && userFlowAuthority.length > 0) {
          await msalInstance.loginRedirect({ ...loginRequest, authority: userFlowAuthority });
        } else {
          await msalInstance.loginRedirect(loginRequest);
        }
      } else if (provider === 'facebook') {
        // TODO: Implement Facebook login flow (MSAL or custom OAuth)
        alert('Facebook login is not yet implemented.');
      }
    } catch (error) {
      console.error("Sign-in error:", error);
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

  static async savePhoneForUser(userId: string, phone: string) {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const res = await fetch(`${apiBase}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to save phone')
      }

      const user = await res.json()
      return user
    } catch (err) {
      console.error('savePhoneForUser error', err)
      throw err
    }
  }

  /**
   * Register a new user via backend API
   */
  static async register(payload: { firstName: string; lastName: string; phone?: string; email: string }) {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'
      const res = await fetch(`${apiBase}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          email: payload.email
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Registration failed')
      }

      const user = await res.json()
      // Dispatch to store so frontend knows about the created user
      store.dispatch(setCurrentUser(user))
      return user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }
}
