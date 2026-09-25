// next version number
import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 31;

/*
 * The purpose of this migration is to properly set the completedOnboarding flag based on the state
 * of the KeyringController.
 */

type LegacyVault = {
  data: string;
  iv: string;
  salt: string;
};

type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'KeyringController',
      {
        vault?: LegacyVault;
      }
    >
  > &
  Partial<
    Record<
      'PreferencesController',
      {
        completedOnboarding?: boolean;
      }
    >
  >;

export default {
  version,

  async migrate(originalVersionedData: MigrationState) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
} satisfies LegacyMigration;

function transformState(state: LegacyState): LegacyState {
  const { KeyringController, PreferencesController } = state;

  if (KeyringController && PreferencesController) {
    const { vault } = KeyringController;
    PreferencesController.completedOnboarding = Boolean(vault);
  }

  return state;
}
