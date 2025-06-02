import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, signIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading authentication state...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {fallback || (
          <>
            <h2 className="text-2xl font-bold">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to access this content.</p>
            <Button onClick={signIn}>Sign In with Microsoft</Button>
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
