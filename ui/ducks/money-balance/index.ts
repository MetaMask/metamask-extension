import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Hex } from '@metamask/utils';

export type PersistedMoneyBalance = {
  /** Money account address this balance belongs to. */
  address: Hex;
  /** Formatted fiat balance, e.g. "$2,384.34". */
  value: string;
  /** Epoch milliseconds when the balance was last successfully fetched. */
  updatedAt: number;
};

export type MoneyBalanceState = {
  lastKnownBalance: PersistedMoneyBalance | null;
};

export const initialState: MoneyBalanceState = {
  lastKnownBalance: null,
};

const moneyBalanceSlice = createSlice({
  name: 'moneyBalance',
  initialState,
  reducers: {
    setLastKnownMoneyBalance: (
      state,
      action: PayloadAction<PersistedMoneyBalance>,
    ) => {
      state.lastKnownBalance = action.payload;
    },

    clearLastKnownMoneyBalance: (state) => {
      state.lastKnownBalance = null;
    },
  },
});

export const { setLastKnownMoneyBalance, clearLastKnownMoneyBalance } =
  moneyBalanceSlice.actions;

export default moneyBalanceSlice.reducer;
