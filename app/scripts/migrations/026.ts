/*

This migration moves the identities stored in the KeyringController
 into the PreferencesController

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 26;

export default {
  version,
  migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyIdentityState;
      versionedData.data = transformState(state);
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${(err as Error).stack}`);
      return Promise.reject(err);
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;

type LegacyIdentity = {
  name: string;
  address: string;
};

type LegacyIdentityState = MigrationState['data'] &
  Partial<
    Record<'KeyringController', { walletNicknames?: Record<string, string> }> &
      Record<
        'PreferencesController',
        { identities?: Record<string, LegacyIdentity> }
      >
  >;

function transformState(state: LegacyIdentityState) {
  const { KeyringController, PreferencesController } = state;
  if (!KeyringController || !PreferencesController) {
    return state;
  }

  const { walletNicknames } = KeyringController;
  if (!walletNicknames) {
    return state;
  }

  PreferencesController.identities = Object.keys(walletNicknames).reduce<
    Record<string, LegacyIdentity>
  >((identities, address) => {
    identities[address] = {
      name: walletNicknames[address],
      address,
    };
    return identities;
  }, {});
  delete KeyringController.walletNicknames;
  return state;
}
