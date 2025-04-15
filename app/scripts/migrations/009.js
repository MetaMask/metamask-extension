/*

This migration breaks out the CurrencyController substate

*/

import { cloneDeep, merge } from 'lodash';

const version = 9;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data;
      const newState = transformState(state);
      versionedData.data = newState;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
      // eslint-disable-next-line id-denylist
    } catch (err) {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
      // eslint-disable-next-line id-denylist
      console.warn(`MetaMask Migration #${version}${err.stack}`);
    }
    return Promise.resolve(versionedData);
  },
};

function transformState(state) {
  const newState = merge({}, state, {
    CurrencyController: {
      currentCurrency: state.currentFiat || state.fiatCurrency || 'USD',
      conversionRate: state.conversionRate,
      conversionDate: state.conversionDate,
    },
  });
  delete newState.currentFiat;
  delete newState.fiatCurrency;
  delete newState.conversionRate;
  delete newState.conversionDate;

  return newState;
}
