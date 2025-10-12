import { useState, useCallback } from "react";
import { AuthService } from "../services/auth/authService";
import { useAppSelector } from "../store/hooks";

export const useAuth = () => {
  const { currentUser, isAuthenticated } = useAppSelector((state) => state.users);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await AuthService.login(email, password);
    } catch (err) {
      setError(err as Error);
      throw err;
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

  const register = useCallback(async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await AuthService.register(email, password, name);
      return user;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    try {
      return AuthService.getToken();
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, []);

  return {
    isAuthenticated,
    currentUser,
    isLoading,
    error,
    signIn,
    signOut,
    register,
    getAccessToken,
  };
};
