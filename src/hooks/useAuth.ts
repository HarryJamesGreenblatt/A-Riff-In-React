import { useMsal } from "@azure/msal-react";
import { useState, useCallback } from "react";
import { AuthService } from "../services/auth/authService";
import { useAppSelector } from "../store/hooks";

export const useAuth = () => {
  const { instance, accounts, inProgress } = useMsal();
  const { currentUser, isAuthenticated } = useAppSelector((state) => state.users);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // signIn can be called either as `signIn('google')` or directly as an
  // onClick handler `onClick={signIn}`. To support both, accept a single
  // parameter that may be a provider string or a MouseEvent and normalize it.
  const signIn = useCallback(async (providerOrEvent?: any) => {
    // If the first arg is a string, treat it as the provider. Otherwise
    // assume the call came from an event handler and use the default.
    const provider = typeof providerOrEvent === 'string' ? providerOrEvent as 'microsoft' | 'google' | 'facebook' : undefined;
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.signIn(provider);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.signOut();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: { firstName: string; lastName: string; phone?: string; email: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      const user = await AuthService.register(payload)
      return user
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getAccessToken = useCallback(async () => {
    try {
      const accessToken = await AuthService.getApiToken();
      return accessToken || null;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, []);

  return {
    isAuthenticated,
    currentUser,
    accounts,
    isLoading: isLoading || inProgress === "login" || inProgress === "logout",
    error,
    signIn,
    signOut,
  register,
    getAccessToken,
    msalInstance: instance,
  };
};
