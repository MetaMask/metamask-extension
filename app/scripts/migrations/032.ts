import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 32;

/**
 * The purpose of this migration is to set the {@code completedUiMigration} flag based on the user's UI preferences
 */

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'PreferencesController',
      {
        featureFlags?: {
          betaUI?: boolean;
        };
        completedUiMigration?: boolean;
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
  const { PreferencesController } = state;

  if (PreferencesController) {
    const { betaUI } = PreferencesController.featureFlags || {};
    // Users who have been using the "beta" UI are considered to have completed the migration
    // as they'll see no difference in this version
    PreferencesController.completedUiMigration = betaUI;
  }

  return state;
}
