// next version number
/*

Removes the deprecated 'seedWords' state

*/

import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 35;

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'PreferencesController',
      {
        seedWords?: string;
      }
    >
  >;

export default {
  version,

  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    versionedData.data = transformState(versionedData.data as LegacyState);
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  if (
    state.PreferencesController &&
    state.PreferencesController.seedWords !== undefined
  ) {
    delete state.PreferencesController.seedWords;
  }
  return state;
}
