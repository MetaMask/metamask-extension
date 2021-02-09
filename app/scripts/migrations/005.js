/*

This migration moves state from the flat state trie into KeyringController substate

*/

import { cloneDeep } from 'lodash';

const version = 5;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data;
      const newState = selectSubstateForKeyringController(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #5${err.stack}`);
    }
    return Promise.resolve(versionedData);
  },
};

function selectSubstateForKeyringController(state) {
  const { config } = state;
  const newState = {
    ...state,
    KeyringController: {
      vault: state.vault,
      selectedAccount: config.selectedAccount,
      walletNicknames: state.walletNicknames,
    },
  };
  delete newState.vault;
  delete newState.walletNicknames;
  delete newState.config.selectedAccount;

  return newState;
}
