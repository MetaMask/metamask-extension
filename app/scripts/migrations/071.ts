import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 71;

/**
 * Renames NotificationController to AnnouncementController
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
  if (state.NotificationController) {
    state.AnnouncementController = {
      announcements: state.NotificationController.notifications,
    };
    delete state.NotificationController;
  }
  return state;
}
