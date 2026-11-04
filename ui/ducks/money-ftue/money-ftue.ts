import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Hex } from '@metamask/utils';
import type { MoneyAccountDepositIntent } from '../../helpers/money/deposit-intent';

export type MoneyFtueSource = 'moneyHome' | 'deposit';

export type MoneyFtuePendingDeposit = {
  preferredPaymentToken?: {
    address: Hex;
    chainId: Hex;
  };
  intent?: MoneyAccountDepositIntent;
};

export type MoneyFtueState = {
  isOpen: boolean;
  source: MoneyFtueSource | null;
  pendingDeposit: MoneyFtuePendingDeposit | null;
};

export const initialState: MoneyFtueState = {
  isOpen: false,
  source: null,
  pendingDeposit: null,
};

const moneyFtueSlice = createSlice({
  name: 'moneyFtue',
  initialState,
  reducers: {
    openMoneyFtue: (
      state,
      action: PayloadAction<
        { source: MoneyFtueSource } & MoneyFtuePendingDeposit
      >,
    ) => {
      // A splash may already be open (for example a deposit intent opened from
      // the token list while the Money home auto-open is in flight). Keep the
      // first intent so the pending deposit is never overwritten.
      if (state.isOpen) {
        return;
      }

      const { source, preferredPaymentToken, intent } = action.payload;

      state.isOpen = true;
      state.source = source;
      state.pendingDeposit =
        source === 'deposit'
          ? {
              ...(preferredPaymentToken ? { preferredPaymentToken } : {}),
              ...(intent ? { intent } : {}),
            }
          : null;
    },
    closeMoneyFtue: (state) => {
      state.isOpen = false;
      state.source = null;
      state.pendingDeposit = null;
    },
  },
});

export const { openMoneyFtue, closeMoneyFtue } = moneyFtueSlice.actions;

export default moneyFtueSlice.reducer;
