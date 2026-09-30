/*

This migration moves state from the flat state trie into KeyringController substate

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 5;

type LegacyState = MigrationState['data'] & {
  config: {
    selectedAccount?: string;
  };
  vault?: string;
  walletNicknames?: Record<string, string>;
};

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyState;
      const newState = selectSubstateForKeyringController(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #5${(err as Error).stack}`);
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;

function selectSubstateForKeyringController(state: LegacyState) {
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
