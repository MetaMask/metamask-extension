/*

This migration removes provider from config and moves it too NetworkController.

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 14;

export default {
  version,

  migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data as LegacyState;
      const newState = transformState(state);
      versionedData.data = newState;
    } catch (err) {
      console.warn(`MetaMask Migration #${version}${(err as Error).stack}`);
    }
    return Promise.resolve(versionedData);
  },
} satisfies LegacyMigration;

type LegacyProvider = {
  type?: string;
  rpcTarget?: string;
};

type LegacyState = MigrationState['data'] & {
  config: {
    provider?: LegacyProvider;
  };
} & Record<
    'NetworkController',
    {
      provider?: LegacyProvider;
    }
  >;

function transformState(state: LegacyState): LegacyState {
  const newState = state;
  newState.NetworkController = {};
  newState.NetworkController.provider = newState.config.provider;
  delete newState.config.provider;
  return newState;
}
