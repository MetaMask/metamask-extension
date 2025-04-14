import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    UserStorageController?: {
      isAccountSyncingEnabled?: boolean;
    };
  };
};

export const version = 153;

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

  // Enable account syncing for everyone.
  // It still won't be used if the main Backup & Sync (ex Profile Sync) toggle is off, so we can set this to true safely.
  state.UserStorageController.isAccountSyncingEnabled = true;

  return state;
}

/**
 * This migration resets sessionData and isSignedIn if using the old sessionData state shape.
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
