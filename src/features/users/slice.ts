import { createSlice } from '@reduxjs/toolkit'
import { api } from '../../store/api'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: string
  updatedAt: string
}

interface UsersState {
  currentUser: User | null
  isAuthenticated: boolean
}

const initialState: UsersState = {
  currentUser: null,
  isAuthenticated: false,
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload
      state.isAuthenticated = !!action.payload
    },
    logout: (state) => {
      state.currentUser = null
      state.isAuthenticated = false
    },
  },
})

export const { setCurrentUser, logout } = usersSlice.actions
export default usersSlice.reducer

// RTK Query endpoints
export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getUserById: builder.query({
      query: (id: string) => `/users/${id}`,
      providesTags: (_result: any, _error: any, id: string) => [{ type: 'User', id }],
    }),
    getUserByEmail: builder.query({
      query: (email: string) => `/users/email/${email}`,
      providesTags: (_result: any, _error: any, email: string) => [{ type: 'User', email }],
    }),
    createUser: builder.mutation({
      query: (user: Partial<User>) => ({
        url: '/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, updates }: { id: string; updates: Partial<User> }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const { useGetUsersQuery, useCreateUserMutation } = usersApi
