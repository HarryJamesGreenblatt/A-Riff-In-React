import React from 'react'
import { useAppSelector } from '../../store/hooks'
import { useGetUsersQuery } from '../../features/users/slice'
import { useCreateActivityMutation } from '../../features/activity/slice'
import { Button } from './Button'

/**
 * UserExample Component
 * 
 * Demonstrates Redux Toolkit integration with both Azure SQL (users) and 
 * Cosmos DB (activities) through RTK Query.
 */
const UserExample: React.FC = () => {
  const { currentUser, isAuthenticated } = useAppSelector((state) => state.users)
  const { data: users, isLoading, error } = useGetUsersQuery(undefined)
  const [createActivity] = useCreateActivityMutation()

  const handleUserAction = async (action: string) => {
    if (currentUser) {
      await createActivity({
        userId: currentUser.id,
        type: 'user_action',
        data: { action },
      })
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Redux State Management Example
      </h2>
      
      {/* Authentication State */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Authentication State</h3>
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        {currentUser && (
          <p>Current User: {currentUser.name} ({currentUser.email})</p>
        )}
      </div>

      {/* Users List (from Azure SQL) */}
      <div className="bg-blue-50 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Users (Azure SQL Database)</h3>
        {isLoading && <p>Loading users...</p>}
        {error && <p className="text-red-600">Error loading users</p>}
        {users && (
          <ul className="space-y-1">
            {users.map((user: any) => (
              <li key={user.id}>
                {user.name} - {user.email} ({user.role})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Activity Tracking (to Cosmos DB) */}
      <div className="bg-green-50 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Activity Tracking (Cosmos DB)</h3>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUserAction('view_dashboard')}
          >
            Track View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUserAction('update_profile')}
          >
            Track Update
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UserExample
