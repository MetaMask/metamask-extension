import { cloneDeep } from 'lodash';

export type VersionedData = {
  meta: {
    version: number;
  };
  data: {};
};

export const version = 137;

function transformState(state: VersionedData['data']) {
  return state;
}

/**
 * This migration was setting isAccountSyncingReadyToBeDispatched to true if completedOnboarding is true
 * Since this state property does not exist anymore, this migration is a no-op.
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
