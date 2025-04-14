import {
  createSlice,
  PayloadAction,
  createSelector,
  Dispatch,
} from '@reduxjs/toolkit';

// --- Constants ---
export const SLICE_NAME = 'sample';

// --- Types ---
export type SampleState = {
  counter: number;
  error: string | null;
};

type HasCounterSlice = {
  [SLICE_NAME]: SampleState;
};

// --- Initial State ---
export const INITIAL_STATE: SampleState = {
  counter: 0,
  error: null,
};

// --- Slice Definition ---
const sampleSlice = createSlice({
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

// --- Actions ---
export const { increment, setError, _setCounter } = sampleSlice.actions;

// --- Thunks ---
export const setCounter = (amount: number) => {
  return (dispatch: Dispatch) => {
    if (amount < 0) {
      dispatch(setError('Counter cannot be negative.'));
      return;
    }
    dispatch(_setCounter(amount));
  };
};

// --- Selectors ---
export const selectCounterState = (state: HasCounterSlice) => state[SLICE_NAME];

export const selectCounterValue = createSelector(
  selectCounterState,
  (counter) => counter.counter,
);

export const selectCounterError = createSelector(
  selectCounterState,
  (counter) => counter.error,
);

// --- Default Export ---
export default sampleSlice.reducer;
