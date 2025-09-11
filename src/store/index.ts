import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import usersReducer from '../features/users/slice';
import activityReducer from '../features/activity/slice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    users: usersReducer,
    activity: activityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
