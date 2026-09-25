import { cloneDeep, isPlainObject } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 60;
const SUPPORT_NOTIFICATION_KEY = 2;
const SUPPORT_NOTIFICATION_DATE = '2020-08-31';

/**
 * Removes the support survey notification
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
  const notificationController = state.NotificationController;
  if (!notificationController) {
    return state;
  }
  const notifications = notificationController.notifications;
  if (!notifications || !isPlainObject(notifications)) {
    return state;
  }
  const notificationKey = String(SUPPORT_NOTIFICATION_KEY);
  if (notifications[notificationKey]?.date === SUPPORT_NOTIFICATION_DATE) {
    delete notifications[notificationKey];
  }
  return state;
}
