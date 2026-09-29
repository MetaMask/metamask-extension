import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 34;

/**
 * The purpose of this migration is to enable the {@code privacyMode} feature flag and set the user as being migrated
 * if it was {@code false}.
 */

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'PreferencesController',
      {
        featureFlags?: {
          privacyMode?: boolean;
        };
        migratedPrivacyMode?: boolean;
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
    const featureFlags = PreferencesController.featureFlags || {};

    if (
      !featureFlags.privacyMode &&
      typeof PreferencesController.migratedPrivacyMode === 'undefined'
    ) {
      // Mark the state has being migrated and enable Privacy Mode
      PreferencesController.migratedPrivacyMode = true;
      featureFlags.privacyMode = true;
    }
  }

  return state;
}
