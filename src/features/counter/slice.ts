import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../store/api';

export interface UserCounter {
  id: string;
  userId: string;
  count: number;
  lastUpdated: string;
  type: 'user_counter';
}

interface CounterState {
  currentCount: number;
  lastUpdated: string | null;
  isLoading: boolean;
}

const initialState: CounterState = {
  currentCount: 0,
  lastUpdated: null,
  isLoading: false,
};

// Define API endpoints for counter
export const counterApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCounter: builder.query<UserCounter, void>({
      query: () => '/api/counter',
      providesTags: ['Counter'],
    }),
    incrementCounter: builder.mutation<UserCounter, { amount?: number }>({
      query: (body) => ({
        url: '/api/counter/increment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Counter'],
      // Optimistic update
      async onQueryStarted({ amount = 1 }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          counterApi.util.updateQueryData('getCounter', undefined, (draft) => {
            draft.count += amount;
            draft.lastUpdated = new Date().toISOString();
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    resetCounter: builder.mutation<UserCounter, void>({
      query: () => ({
        url: '/api/counter/reset',
        method: 'POST',
      }),
      invalidatesTags: ['Counter'],
    }),
  }),
});

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    setCount: (state, action: PayloadAction<number>) => {
      state.currentCount = action.payload;
    },
    incrementLocal: (state, action: PayloadAction<number>) => {
      state.currentCount += action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    resetLocal: (state) => {
      state.currentCount = 0;
      state.lastUpdated = new Date().toISOString();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCount, incrementLocal, resetLocal, setLoading } = counterSlice.actions;
export const { useGetCounterQuery, useIncrementCounterMutation, useResetCounterMutation } = counterApi;
export default counterSlice.reducer;
