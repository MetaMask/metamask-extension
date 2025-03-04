import { createSelector } from '@reduxjs/toolkit';
import { SLICE_NAME, SampleState } from './sample-slice';

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
