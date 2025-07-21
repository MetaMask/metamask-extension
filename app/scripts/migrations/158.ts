import { UserStorageControllerState } from '@metamask/profile-sync-controller/user-storage';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    UserStorageController?: Partial<UserStorageControllerState> & {
      // These properties are not in the UserStorageControllerState type anymore
      isProfileSyncingEnabled?: boolean;
      isProfileSyncingUpdateLoading?: boolean;
    };
  };
};

export const version = 158;

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

  if (hasProperty(state.UserStorageController, 'isProfileSyncingEnabled')) {
    state.UserStorageController.isBackupAndSyncEnabled = Boolean(
      state.UserStorageController.isProfileSyncingEnabled,
    );
    delete state.UserStorageController.isProfileSyncingEnabled;
  }

  if (
    hasProperty(state.UserStorageController, 'isProfileSyncingUpdateLoading')
  ) {
    state.UserStorageController.isBackupAndSyncUpdateLoading = Boolean(
      state.UserStorageController.isProfileSyncingUpdateLoading,
    );
    delete state.UserStorageController.isProfileSyncingUpdateLoading;
  }

  return state;
}

/**
 * This migration updates UserStorageController's state to replace the
 * profile syncing state keys with the backup and sync ones.
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
