import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const SLICE_NAME = 'sample';

export type SampleState = {
  counter: number;
  error: string | null;
};

export const INITIAL_STATE: SampleState = {
  counter: 0,
  error: null,
};

const counterSlice = createSlice({
  name: SLICE_NAME,
  initialState: INITIAL_STATE,
  reducers: {
    increment: (state) => {
      state.counter += 1;
      state.error = null;
    },
    // Internal reducer. Not exported.
    _setCounter: (state, action: PayloadAction<number>) => {
      state.counter = action.payload;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { increment, setError, _setCounter } = counterSlice.actions;

export default counterSlice.reducer;
