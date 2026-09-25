import { cloneDeep } from 'lodash';
import type { LegacyMigration, MigrationState } from '../lib/migrator';
import type { LegacyState } from './legacy-migration-utils';
const version = 70;

/**
 * Removes the `request` and `response` properties from
 * `PermissionLogController.permissionActivityLog` objects.
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
