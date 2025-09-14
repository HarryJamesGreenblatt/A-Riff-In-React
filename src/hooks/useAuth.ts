import { useMsal } from "@azure/msal-react";
import { useState, useCallback } from "react";
import { AuthService } from "../services/auth/authService";
import { useAppSelector } from "../store/hooks";

export const useAuth = () => {
  const { instance, accounts, inProgress } = useMsal();
  const { currentUser, isAuthenticated } = useAppSelector((state) => state.users);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.signIn();
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

  const register = useCallback(async (payload: { name: string; email: string; password?: string }) => {
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
