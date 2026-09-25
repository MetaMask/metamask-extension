/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep, isPlainObject } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 60;
const SUPPORT_NOTIFICATION_KEY = 2;
const SUPPORT_NOTIFICATION_DATE = '2020-08-31';

/**
 * Removes the support survey notification
 */
const migration = {
  version,
  async migrate(originalVersionedData: VersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = (versionedData.data ?? {}) as LegacyState;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

export default migration;

function transformState(state: LegacyState) {
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
