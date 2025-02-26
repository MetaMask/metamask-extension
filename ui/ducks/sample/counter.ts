import {
  createSelector,
  createSlice,
  Dispatch,
  PayloadAction,
} from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import { MetaMaskReduxDispatch } from '../../store/store';

const SLICE_NAME = 'sample';

export type SampleState = {
  counter: number;
  error: string | null;
};

const INITIAL_STATE: SampleState = {
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

export const { increment, setError } = counterSlice.actions;

// --- Thunk (with validation) ---

export const setCounter = (amount: number) => {
  return (dispatch: Dispatch) => {
    if (amount < 0) {
      dispatch(setError('Counter cannot be negative.'));
      return;
    }
    dispatch(counterSlice.actions._setCounter(amount));
  };
};

export default counterSlice.reducer;

// --- Selectors ---

type HasCounterSlice = {
  [SLICE_NAME]: SampleState;
};

export const selectCounterState = (state: HasCounterSlice) => state[SLICE_NAME];

export const selectCounterValue = createSelector(
  selectCounterState,
  (counter) => counter.counter,
);

export const selectCounterError = createSelector(
  selectCounterState,
  (counter) => counter.error,
);

// Hook
export function useCounter() {
  const value = useSelector(selectCounterValue);
  const error = useSelector(selectCounterError);
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  return {
    value,
    increment: () => dispatch(increment()),
    setCounter: (amount: number) => dispatch(setCounter(amount)),
    error,
  };
}
