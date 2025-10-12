import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const LoginButton: React.FC = () => {
  const { isAuthenticated, currentUser, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

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
      variant="primary"
      onClick={() => navigate('/login')}
      disabled={isLoading}
    >
      Sign In
    </Button>
  );
};
