/*

This migration breaks out the TransactionManager substate

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 7;

type LegacyState = MigrationState['data'] & {
  gasMultiplier?: number;
  transactions?: { id: number }[];
};

export default {
  version,

  migrate(originalVersionedData) {
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

function transformState(state: LegacyState) {
  const newState = {
    ...state,
    TransactionManager: {
      transactions: state.transactions || [],
      gasMultiplier: state.gasMultiplier || 1,
    },
  };
  delete newState.transactions;
  delete newState.gasMultiplier;

  return newState;
}
