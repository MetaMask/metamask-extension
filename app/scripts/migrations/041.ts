import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 41;

/**
 * PreferencesController.autoLogoutTimeLimit -> autoLockTimeLimit
 */
type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'PreferencesController',
      {
        preferences?: {
          autoLockTimeLimit?: number;
          autoLogoutTimeLimit?: number;
        };
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
  if (state.PreferencesController && state.PreferencesController.preferences) {
    state.PreferencesController.preferences.autoLockTimeLimit =
      state.PreferencesController.preferences.autoLogoutTimeLimit;
    delete state.PreferencesController.preferences.autoLogoutTimeLimit;
  }
  return state;
}
