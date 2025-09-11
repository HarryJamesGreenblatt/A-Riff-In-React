import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../store/api';

export interface Activity {
  id: string;
  userId: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
  };
}

interface ActivityState {
  recentActivities: Activity[];
  isLoading: boolean;
}

const initialState: ActivityState = {
  recentActivities: [],
  isLoading: false,
};

// Define API endpoints for activities (Cosmos DB)
export const activityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getActivities: builder.query<Activity[], { userId?: string; limit?: number }>({
      query: ({ userId, limit = 50 }) => {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        params.append('limit', limit.toString());
        return `/activities?${params.toString()}`;
      },
      providesTags: ['Activity'],
    }),
    createActivity: builder.mutation<Activity, Omit<Activity, 'id' | 'timestamp'>>({
      query: (activity) => ({
        url: '/activities',
        method: 'POST',
        body: activity,
      }),
      invalidatesTags: ['Activity'],
    }),
    getActivityStream: builder.query<Activity[], void>({
      query: () => '/activities/stream',
      // This could be enhanced with WebSocket support for real-time updates
      providesTags: ['Activity'],
    }),
  }),
});

export const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    addRecentActivity: (state, action: PayloadAction<Activity>) => {
      state.recentActivities = [action.payload, ...state.recentActivities.slice(0, 49)];
    },
    clearRecentActivities: (state) => {
      state.recentActivities = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { addRecentActivity, clearRecentActivities, setLoading } = activitySlice.actions;
export const { useGetActivitiesQuery, useCreateActivityMutation, useGetActivityStreamQuery } = activityApi;
export default activitySlice.reducer;
