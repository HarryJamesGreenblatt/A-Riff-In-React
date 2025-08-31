import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: (() => {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      console.log('🔍 API Base URL:', apiUrl);
      console.log('🔍 Environment variables:', import.meta.env);
      return apiUrl;
    })(),
    prepareHeaders: async (headers) => {
      try {
        // Dynamically import AuthService to avoid circular dependency
        const { AuthService } = await import('../services/auth/authService')
        // Try to get fresh token from MSAL
        const accessToken = await AuthService.getApiToken()
        if (accessToken) {
          headers.set('authorization', `Bearer ${accessToken}`);
        }
      } catch {
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
