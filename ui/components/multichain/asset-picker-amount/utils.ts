import { createSelector } from 'reselect';

import type { AppSliceState } from '../../../ducks/app/app';

function getSendInputCurrencySwitched(state: AppSliceState) {
  return state.appState.sendInputCurrencySwitched;
}

export const getIsFiatPrimary = createSelector(
  getSendInputCurrencySwitched,
  (sendInputCurrencySwitched) => {
    const isFiatPrimary = Boolean(sendInputCurrencySwitched);
    return isFiatPrimary;
  },
);
