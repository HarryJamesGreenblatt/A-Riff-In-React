import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Simple: just return the base URL as-is, or default to empty string for same-origin
function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

  // If no env var set, return empty string (same-origin requests)
  if (!envUrl) return '';

  // Otherwise use the configured URL (should be just the host)
  return envUrl.trim().replace(/\/+$/, ''); // remove trailing slashes
}

const baseUrl = getBaseUrl();

// Log for debugging
if (typeof window !== 'undefined') {
  console.info('[api] Using baseUrl:', baseUrl || '(same-origin)');
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Activity', 'Counter'],
  endpoints: () => ({}),
});
