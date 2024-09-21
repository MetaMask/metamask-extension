import { cloneDeep } from 'lodash';

const version = 70;

/**
 * Removes the `request` and `response` properties from
 * `PermissionLogController.permissionActivityLog` objects.
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
