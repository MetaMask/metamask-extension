import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 177;

function transformState(state: VersionedData['data']) {
  if (
    !hasProperty(state, 'UserStorageController') ||
    !isObject(state.UserStorageController)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Invalid UserStorageController state: ${typeof state.UserStorageController}`,
      ),
    );
    return state;
  }

  if (
    hasProperty(
      state.UserStorageController,
      'hasAccountSyncingSyncedAtLeastOnce',
    )
  ) {
    delete state.UserStorageController.hasAccountSyncingSyncedAtLeastOnce;
  }

  if (
    hasProperty(
      state.UserStorageController,
      'isAccountSyncingReadyToBeDispatched',
    )
  ) {
    delete state.UserStorageController.isAccountSyncingReadyToBeDispatched;
  }

  if (hasProperty(state.UserStorageController, 'isAccountSyncingInProgress')) {
    delete state.UserStorageController.isAccountSyncingInProgress;
  }

  return state;
}

/**
 * This migration deletes old and unused UserStorageController's state properties.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
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
