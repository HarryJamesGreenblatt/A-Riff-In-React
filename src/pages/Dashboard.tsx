import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { CounterWidget } from '../components/counter/CounterWidget';

const Dashboard: React.FC = () => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome, {currentUser?.name}!
        </h1>
        <p className="text-gray-600">
          Your personal dashboard with Cosmos DB-powered features
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Counter Widget */}
        <div>
          <CounterWidget />
        </div>

        {/* User Info Card */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-gray-900">{currentUser?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Name</p>
              <p className="text-gray-900">{currentUser?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Role</p>
              <p className="text-gray-900 capitalize">{currentUser?.role || 'member'}</p>
            </div>
            {currentUser?.phone && (
              <div>
                <p className="text-sm font-medium text-gray-600">Phone</p>
                <p className="text-gray-900">{currentUser.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder for future features */}
        <div className="md:col-span-2 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            ?? Coming Soon: Notifications
          </h3>
          <p className="text-gray-600 text-sm">
            A Cosmos DB-backed notification system will appear here, showing real-time alerts and messages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
