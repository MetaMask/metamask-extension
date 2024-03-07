import { createSelector } from '@reduxjs/toolkit';
import {
  getPreferences,
  getSendInputCurrencySwitched,
} from '../../../selectors';

export const getIsFiatPrimary = createSelector(
  getPreferences,
  getSendInputCurrencySwitched,
  ({ useNativeCurrencyAsPrimaryCurrency }, sendInputCurrencySwitched) => {
    const isFiatPrimary = Boolean(
      (useNativeCurrencyAsPrimaryCurrency && sendInputCurrencySwitched) ||
        (!useNativeCurrencyAsPrimaryCurrency && !sendInputCurrencySwitched),
    );

    return isFiatPrimary;
  },
);
