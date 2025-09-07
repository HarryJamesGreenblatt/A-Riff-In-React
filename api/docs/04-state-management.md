# State Management with Redux Toolkit

This document describes the state management implementation using Redux Toolkit (RTK) and RTK Query in **A Riff In React**.

## Overview

Redux Toolkit is the official, opinionated, batteries-included toolset for efficient Redux development. It includes utilities that help simplify common Redux use cases, including store setup, defining reducers, immutable update logic, and creating entire "slices" of state.

## Architecture

### Store Configuration

The Redux store is configured in `src/store/index.ts` with the following features:

- **Centralized State Management**: Single source of truth for application state
- **RTK Query Integration**: API state management with caching and invalidation
- **TypeScript Support**: Fully typed state and actions
- **DevTools Integration**: Redux DevTools enabled in development

```typescript
// src/store/index.ts
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    users: usersReducer,
    activity: activityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})
```

### RTK Query API Setup

RTK Query is configured in `src/store/api.ts` to handle API calls:

- **Base Configuration**: Centralized API endpoint configuration
- **Authentication**: Automatic token injection in headers
- **Tag System**: Cache invalidation through tag-based system
- **Endpoints**: Injected per feature for modularity

```typescript
// src/store/api.ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['User', 'Activity'],
  endpoints: () => ({}),
})
```

### Typed Hooks

Custom typed hooks are provided in `src/store/hooks.ts` for type-safe Redux usage:

```typescript
// Use these throughout the app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
```

## Feature Implementation

### Users Feature (Azure SQL Example)

The users feature demonstrates structured data management patterns suitable for Azure SQL Database:

```typescript
// src/features/users/slice.ts
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}
```

**API Endpoints**:
- `getUsers`: Fetch all users
- `getUserById`: Fetch specific user
- `createUser`: Create new user
- `updateUser`: Update existing user

**Local State**:
- `currentUser`: Currently authenticated user
- `isAuthenticated`: Authentication status

### Activity Feature (Cosmos DB Example)

The activity feature demonstrates flexible document storage patterns suitable for Cosmos DB:

```typescript
// src/features/activity/slice.ts
interface Activity {
  id: string
  userId: string
  type: string
  data: Record<string, any>  // Flexible schema
  timestamp: string
  metadata?: {
    ip?: string
    userAgent?: string
    [key: string]: any
  }
}
```

**API Endpoints**:
- `getActivities`: Query activities with filtering
- `createActivity`: Log new activity
- `getActivityStream`: Real-time activity stream

**Local State**:
- `recentActivities`: Cached recent activities
- `isLoading`: Loading state

## Usage Examples

### Using Typed Hooks

```typescript
import { useAppSelector, useAppDispatch } from '../../store/hooks'

const MyComponent = () => {
  const dispatch = useAppDispatch()
  const { currentUser, isAuthenticated } = useAppSelector((state) => state.users)
  
  // Component logic...
}
```

### Making API Calls with RTK Query

```typescript
import { useGetUsersQuery, useCreateUserMutation } from '../../features/users/slice'

const UserList = () => {
  const { data: users, isLoading, error } = useGetUsersQuery()
  const [createUser] = useCreateUserMutation()
  
  const handleCreateUser = async () => {
    await createUser({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    })
  }
  
  // Component rendering...
}
```

### Dispatching Actions

```typescript
import { setCurrentUser, logout } from '../../features/users/slice'

const AuthComponent = () => {
  const dispatch = useAppDispatch()
  
  const handleLogin = (user: User) => {
    dispatch(setCurrentUser(user))
  }
  
  const handleLogout = () => {
    dispatch(logout())
  }
}
```

## Best Practices for Azure Integration

### 1. API Endpoint Design

When connecting to Azure backends:
- Use environment variables for API base URLs
- Implement proper error handling for network failures
- Use RTK Query's retry mechanisms for resilience

### 2. Authentication with MSAL

Future MSAL integration will:
- Store tokens securely
- Automatically refresh tokens
- Inject tokens into API headers

### 3. Optimistic Updates

For better UX with Azure services:
```typescript
createUser: builder.mutation({
  query: (user) => ({
    url: '/users',
    method: 'POST',
    body: user,
  }),
  // Optimistic update
  async onQueryStarted(user, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      api.util.updateQueryData('getUsers', undefined, (draft) => {
        draft.push({ ...user, id: 'temp-id' })
      })
    )
    try {
      await queryFulfilled
    } catch {
      patchResult.undo()
    }
  },
})
```

### 4. Cache Management

RTK Query provides powerful caching:
- Automatic cache invalidation with tags
- Configurable cache lifetimes
- Manual cache updates when needed

## Migration Guide

If migrating from Context API or other state management:

1. **Identify Global State**: Determine what needs Redux
2. **Create Feature Slices**: One slice per domain area
3. **Define API Endpoints**: Use RTK Query for all API calls
4. **Update Components**: Replace Context with Redux hooks
5. **Test Thoroughly**: Ensure state updates work correctly

## Performance Considerations

- **Normalized State**: Use entity adapters for large datasets
- **Selective Subscriptions**: Use `useAppSelector` with specific selectors
- **Memoization**: Use `createSelector` for expensive computations
- **Code Splitting**: Load feature slices dynamically when needed

## Next Steps

- [ ] Integrate MSAL for authentication
- [ ] Add WebSocket support for real-time updates
- [ ] Implement offline support with persistence
- [ ] Add Redux DevTools configuration

---

> _For comparison with other state management approaches, see the Flask template's session management in [A Fugue In Flask](https://github.com/HarryJamesGreenblatt/A-Fugue-In-Flask)_
