import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 36;

/**
 * The purpose of this migration is to remove the {@code privacyMode} feature flag.
 */
type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'PreferencesController',
      {
        featureFlags?: { privacyMode?: boolean };
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

    if (typeof featureFlags.privacyMode !== 'undefined') {
      delete featureFlags.privacyMode;
    }
  }

  return state;
}
