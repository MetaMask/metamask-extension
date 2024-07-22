import { cloneDeep } from 'lodash';
import { hasProperty } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-api';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 120.1;

/**
 * Add a default value for importTime in the InternalAccount
 *
 * @param originalVersionedData
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  if (!hasProperty(state, 'UserStorageController')) {
    return state;
  }

  if (hasProperty(state.UserStorageController, 'isProfileSyncingEnabled')) {
    state.UserStorageController.isProfileSyncingEnabled = null;
  }

  return state;
}
