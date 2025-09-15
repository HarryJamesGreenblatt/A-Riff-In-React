import { msalInstance, initializeMsal } from "./msalInstance";
// ...existing code...
import { loginRequest, userFlowAuthority } from "../../config/authConfig";
import { store } from "../../store";
import { setCurrentUser } from "../../features/users/slice";

export class AuthService {
  /**
   * Sign in using popup
   */
  static async signIn(provider: 'microsoft' | 'google' | 'facebook' = 'microsoft') {
    try {
      // Ensure the shared MSAL instance is initialized before using it.
      await initializeMsal();

      if (provider === 'microsoft') {
        // Use redirect for Microsoft login
  console.debug('[AuthService] Initiating Microsoft login with authority:', msalInstance!.getConfiguration().auth.authority);
  await msalInstance!.loginRedirect(loginRequest);
      } else if (provider === 'google') {
        // Determine a working authority by probing OpenID metadata.
  const configured = (userFlowAuthority && userFlowAuthority.length > 0) ? userFlowAuthority : msalInstance!.getConfiguration().auth.authority;
        console.debug('[AuthService] Configured user flow authority:', configured);

        // Helper to test whether an authority has a valid OpenID configuration.
        const testOpenId = async (authority: string) => {
          try {
            const metadataUrl = authority.replace(/\/+$/, '') + '/.well-known/openid-configuration';
            console.debug('[AuthService] Testing OpenID metadata URL:', metadataUrl);
            const res = await fetch(metadataUrl, { method: 'GET' });
            if (res.ok) {
              const body = await res.json().catch(() => null);
              if (body && body.issuer) return true;
            }
            return false;
          } catch (err) {
            console.warn('[AuthService] OpenID metadata fetch failed for', authority, err);
            return false;
          }
        };

        const candidates: string[] = [];
        candidates.push(configured);
        // If configured lacks '/tfp/' try a tfp variant and vice-versa
        if (!configured.includes('/tfp/')) {
          try {
            const url = new URL(configured);
            const tfpAuthority = `${url.origin}/tfp/${url.pathname.replace(/^\//, '')}`.replace(/\/+/g, '/');
            // Ensure policy present at the end; if pathname already includes policy, tfp variant will align.
            candidates.push(tfpAuthority);
          } catch (e) {
            // ignore
          }
        } else {
          // try removing '/tfp' if present
          candidates.push(configured.replace('/tfp/', '/'));
        }

        // Deduplicate candidates
        const unique = Array.from(new Set(candidates));
        let workingAuthority: string | null = null;
        for (const c of unique) {
          // normalize to not have trailing '/'
          const candidate = c.replace(/\/+$/, '');
          // append /v2.0 if missing — MSAL expects the base ending with /v2.0
          let candidateWithV2 = candidate;
          if (!candidate.endsWith('/v2.0')) candidateWithV2 = `${candidate}/v2.0`;
          // test candidateWithV2
          if (await testOpenId(candidateWithV2)) {
            workingAuthority = candidateWithV2;
            break;
          }
        }

        if (!workingAuthority) {
          const tried = unique.join(', ');
          const errMsg = `No valid OpenID configuration found for candidates: ${tried}`;
          console.error('[AuthService] ' + errMsg);
          throw new Error(errMsg);
        }

        console.debug('[AuthService] Found working authority:', workingAuthority);
        // Ensure the client id used for the request matches the user-flow's registered client.
  const expectedClientId = import.meta.env.VITE_ENTRA_CLIENT_ID || msalInstance!.getConfiguration().auth.clientId;
  const currentClientId = msalInstance!.getConfiguration().auth.clientId;
        console.info('[AuthService] Using shared MSAL instance for Google sign-in. expectedClientId:', expectedClientId, 'currentClientId:', currentClientId, 'authority:', workingAuthority);

        if (expectedClientId !== currentClientId) {
          // Creating a temporary MSAL instance causes initialization conflicts with msal-browser
          // in single-page apps. Recommend restarting the dev server so Vite injects the
          // updated `VITE_ENTRA_CLIENT_ID`, or ensure the SPA app registration matches the
          // client id that the policy expects.
          const errMsg = `MSAL client id mismatch: runtime clientId='${currentClientId}' does not match expected='${expectedClientId}'. Restart the dev server or ensure the SPA uses the policy-registered client id.`;
          console.error('[AuthService] ' + errMsg);
          throw new Error(errMsg);
        }

        // Use the shared instance and override authority for this request.
  await msalInstance!.loginRedirect({ ...loginRequest, authority: workingAuthority });
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
    // Ensure MSAL is initialized before attempting sign out
  await initializeMsal();
  const currentAccount = msalInstance!.getActiveAccount();
    store.dispatch(setCurrentUser(null));
    await msalInstance!.logoutRedirect({
      account: currentAccount,
      postLogoutRedirectUri: import.meta.env.VITE_POST_LOGOUT_URI,
    });
  }

  /**
   * Get access token for API calls
   */
  static async getApiToken() {
    // Ensure MSAL is initialized before attempting to get tokens
  await initializeMsal();
  const account = msalInstance!.getActiveAccount();
    if (!account) {
      throw new Error("No active account! Please sign in.");
    }

    try {
      // For now, just use the basic scopes since we don't have API scopes configured
      const response = await msalInstance!.acquireTokenSilent({
        scopes: ["openid", "profile", "email"],
        account,
      });
      return response.accessToken;
    } catch (error) {
      console.warn("Silent token acquisition failed. Falling back to popup.", error);
      try {
        const response = await msalInstance!.acquireTokenPopup({
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
