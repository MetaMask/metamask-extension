import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 168.1;

/**
 * This migration removes the `permissionActivityLog` state
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'PermissionLogController') &&
    isObject(state.PermissionLogController) &&
    hasProperty(state.PermissionLogController, 'permissionActivityLog')
  ) {
    delete state.PermissionLogController.permissionActivityLog;
  } else {
    console.warn(
      `Migration ${version}: 'PermissionLogController.permissionActivityLog' state not found, skipping migration.`,
    );
  }
}
