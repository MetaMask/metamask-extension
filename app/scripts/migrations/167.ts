import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 167;

/**
 * This migration sets `isBackupAndSyncEnabled` and `isAccountSyncingEnabled` to true for all users.
 *
 * If the UserStorageController is not found or is not an object, the migration logs an error,
 * but otherwise leaves the state unchanged.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state without the tokens property.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  // If property UserStorageController is not present, only log a warning and return the original state.
  if (!hasProperty(state, 'UserStorageController')) {
    console.warn(`newState.UserStorageController is not present`);
    return state;
  }

  const userStorageControllerState = state.UserStorageController;

  // If property userStorageControllerState is there but not an object, capture a sentry error and return state
  if (!isObject(userStorageControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: UserStorageController is type '${typeof userStorageControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (hasProperty(userStorageControllerState, 'isBackupAndSyncEnabled')) {
    // Set isBackupAndSyncEnabled to true for all users.
    userStorageControllerState.isBackupAndSyncEnabled = true;
  }

  if (hasProperty(userStorageControllerState, 'isAccountSyncingEnabled')) {
    // Set isAccountSyncingEnabled to true for all users.
    userStorageControllerState.isAccountSyncingEnabled = true;
  }

  // If we are using `yarn start:with-state` or running an E2E test with generateWalletState, disable all syncing
  if (process.env.WITH_STATE || getManifestFlags().testing?.disableSync) {
    userStorageControllerState.isBackupAndSyncEnabled = false;
    userStorageControllerState.isAccountSyncingEnabled = false;
    userStorageControllerState.isProfileSyncingEnabled = false;
    userStorageControllerState.isContactSyncingEnabled = false;
  }

  return state;
}
