/*

This migration moves KeyringController.selectedAddress to PreferencesController.selectedAddress

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 6;

type LegacyState = MigrationState['data'] &
  Record<
    'KeyringController',
    {
      selectedAccount?: string;
      vault?: string;
      walletNicknames?: Record<string, string>;
    }
  >;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyState;
      const newState = migrateState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${(err as Error).stack}`);
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;

function migrateState(state: LegacyState) {
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
