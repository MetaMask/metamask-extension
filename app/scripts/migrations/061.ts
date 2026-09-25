import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 61;

/**
 * Initialize attributes related to recovery seed phrase reminder
 */
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

function transformState(state: LegacyState) {
  const currentTime = new Date().getTime();
  if (state.AppStateController) {
    state.AppStateController.recoveryPhraseReminderHasBeenShown = false;
    state.AppStateController.recoveryPhraseReminderLastShown = currentTime;
  } else {
    state.AppStateController = {
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown: currentTime,
    };
  }
  return state;
}
