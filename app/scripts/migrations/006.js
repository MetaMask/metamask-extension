/*

This migration moves KeyringController.selectedAddress to PreferencesController.selectedAddress

*/

import { cloneDeep } from 'lodash';

const version = 6;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data;
      const newState = migrateState(state);
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

function migrateState(state) {
  const keyringSubstate = state.KeyringController;

  // add new state
  const newState = {
    ...state,
    PreferencesController: {
      selectedAddress: keyringSubstate.selectedAccount,
    },
  };

  // rm old state
  delete newState.KeyringController.selectedAccount;

  return newState;
}
