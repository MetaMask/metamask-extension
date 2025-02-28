import { Dispatch } from '@reduxjs/toolkit';
import { _setCounter, setError } from './sample-reducer';

// --- Thunk (with validation) ---

export const setCounter = (amount: number) => {
  return (dispatch: Dispatch) => {
    if (amount < 0) {
      dispatch(setError('Counter cannot be negative.'));
      return;
    }
    dispatch(_setCounter(amount));
  };
};
