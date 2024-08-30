import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 127;

/**
 * This migration removes invalid state from the NftController
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

/**
 * Remove invalid NftController state.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function transformState(state: Record<string, unknown>): void {
  if (!hasProperty(state, 'NftController')) {
    return;
  }

  const nftControllerState = state.NftController;
  if (!isObject(nftControllerState)) {
    global.sentry?.captureException(
      new Error(
        `Migration ${version}: Invalid NftController state of type '${typeof nftControllerState}'`,
      ),
    );
    return;
  }

  delete nftControllerState.collectibles;
  delete nftControllerState.collectibleContracts;
}
