import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const LoginButton: React.FC = () => {
  const { isAuthenticated, currentUser, signIn, signOut, isLoading } = useAuth();

  if (isAuthenticated && currentUser) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Hello, {currentUser.name}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          disabled={isLoading}
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="default"
      onClick={signIn}
      disabled={isLoading}
    >
      {isLoading ? 'Signing in...' : 'Sign In with Microsoft'}
    </Button>
  );
};
