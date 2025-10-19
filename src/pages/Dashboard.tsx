import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { CounterWidget } from '../components/counter/CounterWidget';
import { useGetNotificationsQuery, useMarkAsReadMutation, useDeleteNotificationMutation } from '../features/notifications/slice';

const Dashboard: React.FC = () => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  // Fetch notifications for current user (non-unread-only to show history)
  const { data: notifications = [], isLoading: notificationsLoading } = useGetNotificationsQuery({ unreadOnly: false });
  const [markAsRead] = useMarkAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

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

  const unreadCount = notifications.filter((n: any) => !n.read).length;

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

        {/* Notifications panel (minimal) */}
        <div className="md:col-span-2 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">?? Notifications</h3>
            <div className="text-sm text-gray-600">Unread: <span className="font-medium">{unreadCount}</span></div>
          </div>

          {notificationsLoading ? (
            <p className="text-gray-600 text-sm">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-600 text-sm">No notifications</p>
          ) : (
            <ul className="space-y-3">
              {notifications.slice(0, 5).map((n: any) => (
                <li key={n.id} className="p-3 bg-white rounded shadow-sm flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{n.title}</div>
                    <div className="text-xs text-gray-600">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{n.createdAt}</div>
                  </div>
                  <div className="flex flex-col items-end ml-4 space-y-2">
                    {!n.read && (
                      <button
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                        onClick={async () => {
                          try { await markAsRead(n.id).unwrap(); } catch (e) { console.error(e); }
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                      onClick={async () => {
                        try { await deleteNotification(n.id).unwrap(); } catch (e) { console.error(e); }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="text-gray-600 text-sm mt-4">Full notification UI coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
