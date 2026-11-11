import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Hex } from '@metamask/utils';
import type { MoneyAccountDepositIntent } from '../../helpers/money/deposit-intent';
import type {
  MoneyComponentName,
  MoneyFtueEntryPoint,
} from '../../pages/money/constants/money-events';

export type MoneyFtueSource = 'moneyHome' | 'deposit';

export type MoneyFtueOrigin = {
  entryPoint: MoneyFtueEntryPoint;
  componentName?: MoneyComponentName;
};

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
  origin: MoneyFtueOrigin | null;
  pendingDeposit: MoneyFtuePendingDeposit | null;
  /**
   * Set for the rest of the UI session when the user acknowledges the splash,
   * so a deposit triggered before the persisted flag reaches the UI does not
   * reopen it.
   */
  acknowledged: boolean;
};

export const initialState: MoneyFtueState = {
  isOpen: false,
  source: null,
  origin: null,
  pendingDeposit: null,
  acknowledged: false,
};

const moneyFtueSlice = createSlice({
  name: 'moneyFtue',
  initialState,
  reducers: {
    openMoneyFtue: (
      state,
      action: PayloadAction<
        {
          source: MoneyFtueSource;
          origin: MoneyFtueOrigin;
        } & MoneyFtuePendingDeposit
      >,
    ) => {
      // A splash may already be open (for example a deposit intent opened from
      // the token list while the Money home auto-open is in flight). Keep the
      // first intent so the pending deposit is never overwritten.
      if (state.isOpen) {
        return;
      }

      const { source, origin, preferredPaymentToken, intent } = action.payload;

      state.isOpen = true;
      state.source = source;
      state.origin = origin;
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
      state.origin = null;
      state.pendingDeposit = null;
      state.acknowledged = true;
    },
  },
});

export const { openMoneyFtue, closeMoneyFtue } = moneyFtueSlice.actions;

export default moneyFtueSlice.reducer;
