import { createSelector } from 'reselect';

export const getIsFiatPrimary = createSelector(
  (state: {
    metamask: { preferences: { useNativeCurrencyAsPrimaryCurrency: boolean } };
    appState: { sendInputCurrencySwitched: boolean };
  }) => state.metamask.preferences,
  (state) => state.appState.sendInputCurrencySwitched,
  ({ useNativeCurrencyAsPrimaryCurrency }, sendInputCurrencySwitched) => {
    const isFiatPrimary = Boolean(
      (useNativeCurrencyAsPrimaryCurrency && sendInputCurrencySwitched) ||
        (!useNativeCurrencyAsPrimaryCurrency && !sendInputCurrencySwitched),
    );

    return isFiatPrimary;
  },
);
