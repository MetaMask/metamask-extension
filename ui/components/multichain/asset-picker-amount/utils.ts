import { createSelector } from 'reselect';

function getSendInputCurrencySwitched(state) {
  return state.appState.sendInputCurrencySwitched;
}

export const getIsFiatPrimary = createSelector(
  getSendInputCurrencySwitched,
  (sendInputCurrencySwitched) => {
    const isFiatPrimary = Boolean(sendInputCurrencySwitched);
    return isFiatPrimary;
  },
);
