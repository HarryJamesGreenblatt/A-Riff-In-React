import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

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
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
