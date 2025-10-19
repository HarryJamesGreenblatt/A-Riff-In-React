import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../store/api';

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  metadata?: {
    link?: string;
    actionLabel?: string;
    [key: string]: unknown;
  };
}

interface NotificationsState {
  unreadCount: number;
  lastChecked: string | null;
}

const initialState: NotificationsState = {
  unreadCount: 0,
  lastChecked: null,
};

// Define API endpoints for notifications
export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], { unreadOnly?: boolean }>({
      query: ({ unreadOnly = false }) => 
        `/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`,
      providesTags: ['Notification'],
      // Update unread count when data is fetched
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          const unreadCount = data.filter(n => !n.read).length;
          dispatch(setUnreadCount(unreadCount));
        } catch (error) {
          // Handle error silently
        }
      },
    }),
    markAsRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/api/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData('getNotifications', { unreadOnly: false }, (draft) => {
            const notification = draft.find(n => n.id === id);
            if (notification) {
              notification.read = true;
            }
          })
        );
        try {
          await queryFulfilled;
          dispatch(decrementUnreadCount());
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData('getNotifications', { unreadOnly: false }, (draft) => {
            return draft.filter(n => n.id !== id);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    createNotification: builder.mutation<Notification, Omit<Notification, 'id' | 'createdAt'>>({
      query: (notification) => ({
        url: '/api/notifications',
        method: 'POST',
        body: notification,
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
      state.lastChecked = new Date().toISOString();
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
  },
});

export const { setUnreadCount, decrementUnreadCount, incrementUnreadCount } = notificationsSlice.actions;
export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
  useCreateNotificationMutation,
} = notificationsApi;
export default notificationsSlice.reducer;
