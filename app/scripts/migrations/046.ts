import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 46;

type LegacyState = MigrationState['data'] &
  Partial<Record<'ABTestController', Record<string, unknown>>>;

/**
 * Delete {@code ABTestController} state
 */
export default {
  version,
  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    versionedData.data = transformState(state);
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  if (typeof state?.ABTestController !== 'undefined') {
    delete state.ABTestController;
  }
  return state;
}
