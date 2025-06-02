import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { AuthService } from '../services/auth/authService'

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    prepareHeaders: async (headers) => {
      try {
        // Try to get fresh token from MSAL
        const tokenResponse = await AuthService.getApiToken();
        if (tokenResponse) {
          headers.set('authorization', `Bearer ${tokenResponse.accessToken}`);
        }
      } catch (error) {
        // Fallback to stored token if MSAL fails
        const token = localStorage.getItem('authToken');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Activity'],
  endpoints: () => ({}),
})
