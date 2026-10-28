/*

This migration removes the discaimer state from our app, which was integrated into our notices.

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 11;

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

type LegacyState = MigrationState['data'] &
  Partial<Record<'TOSHash', string> & Record<'isDisclaimerConfirmed', boolean>>;

function transformState(state: LegacyState): LegacyState {
  const newState = state;
  delete newState.TOSHash;
  delete newState.isDisclaimerConfirmed;
  return newState;
}
