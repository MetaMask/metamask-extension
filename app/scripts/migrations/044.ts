import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';

const version = 44;

/**
 * Remove unused 'mkrMigrationReminderTimestamp' state from the `AppStateController`
 */
type LegacyState = MigrationState['data'] &
  Partial<
    Record<
      'AppStateController',
      {
        mkrMigrationReminderTimestamp?: number;
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
  if (
    typeof state?.AppStateController?.mkrMigrationReminderTimestamp !==
    'undefined'
  ) {
    delete state.AppStateController.mkrMigrationReminderTimestamp;
  }
  return state;
}
