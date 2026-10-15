import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 43;

/**
 * Remove unused 'currentAccountTab' state
 */
type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'PreferencesController',
      {
        currentAccountTab?: string;
      }
    >
  >;

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
  if (state?.PreferencesController?.currentAccountTab) {
    delete state.PreferencesController.currentAccountTab;
  }
  return state;
}
