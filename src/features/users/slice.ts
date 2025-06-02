import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
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

// Define API endpoints for users (Azure SQL Database)
export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),    updateUser: builder.mutation<User, { id: string; updates: Partial<User> }>({
      query: ({ id, updates }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'User', id }],
    }),
  }),
})

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
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
export const { useGetUsersQuery, useGetUserByIdQuery, useCreateUserMutation, useUpdateUserMutation } = usersApi
export default usersSlice.reducer
