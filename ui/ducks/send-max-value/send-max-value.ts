import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MetaMaskReduxState } from '../../store/store';

export type SendMaxValueState = {
  maxValueMode: Record<string, boolean>;
};

export const initialState: SendMaxValueState = {
  maxValueMode: {},
};

const sendMaxValueSlice = createSlice({
  name: 'sendMaxValue',
  initialState,
  reducers: {
    setMaxValueMode: (
      state,
      action: PayloadAction<{ transactionId: string; enabled: boolean }>,
    ) => {
      state.maxValueMode[action.payload.transactionId] = action.payload.enabled;
    },
  },
});

export const { setMaxValueMode } = sendMaxValueSlice.actions;

export function selectMaxValueModeForTransaction(
  state: MetaMaskReduxState,
  transactionId?: string,
): boolean {
  if (!transactionId) {
    return false;
  }

  return Boolean(state.sendMaxValue.maxValueMode[transactionId]);
}

export default sendMaxValueSlice.reducer;
