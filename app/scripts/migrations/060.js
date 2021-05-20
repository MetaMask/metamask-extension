import { cloneDeep, isPlainObject } from 'lodash';

const version = 60;
const SUPPORT_NOTIFICATION_KEY = 2;
const SUPPORT_NOTIFICATION_DATE = '2020-08-31';

/**
 * Removes the support survey notification
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const notifications = state?.NotificationController?.notifications;
  if (isPlainObject(notifications)) {
    if (
      notifications[SUPPORT_NOTIFICATION_KEY]?.date ===
      SUPPORT_NOTIFICATION_DATE
    ) {
      delete state.NotificationController.notifications[
        SUPPORT_NOTIFICATION_KEY
      ];
    }
  }
  return state;
}
