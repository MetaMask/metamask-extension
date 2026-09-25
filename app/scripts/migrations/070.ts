/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any -- Legacy migration state remains loosely typed during JS-to-TS conversion. */
import { cloneDeep } from 'lodash';

type LegacyState = Record<string, any>;
type VersionedData = { meta: { version?: number }; data?: LegacyState };

const version = 70;

/**
 * Removes the `request` and `response` properties from
 * `PermissionLogController.permissionActivityLog` objects.
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
  if (Array.isArray(state?.PermissionLogController?.permissionActivityLog)) {
    const {
      PermissionLogController: { permissionActivityLog },
    } = state;

    // mutate activity log entries in place
    permissionActivityLog.forEach((logEntry) => {
      if (
        logEntry &&
        typeof logEntry === 'object' &&
        !Array.isArray(logEntry)
      ) {
        delete logEntry.request;
        delete logEntry.response;
      }
    });
  }
  return state;
}
