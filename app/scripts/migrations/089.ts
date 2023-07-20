import { isEthCaipChainId } from '@metamask/controller-utils';
import { hasProperty, Hex, isObject, isStrictHexString } from '@metamask/utils';
import { BN } from 'ethereumjs-util';
import { cloneDeep, mapKeys } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 88;

/**
 * This migration does a few things:
 *
 * - Rebuilds `networkConfigurations` with `chainId` converted to `caipChainId`
 * by a hex chain ID rather than a decimal chain ID.
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
  migrateData(versionedData.data);
  return versionedData;
}

function migrateData(state: Record<string, unknown>): void {
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController)
  ) {
    // TODO. Actually implement this
    // const networkControllerState = state.NetworkController
    // const networkConfigurations = state.networkConfigurations;
    // Object.keys(networkConfigurations).forEach((id) => {
    //   const networkConfiguration = networkConfigurations[id];
    //   if (isObject(networkConfiguration)) {
    //     const chainId = networkConfiguration.chainId || ""
    //     if (!chainId) {
    //       return
    //     }
    //     if (chainId.startsWith('0x')) { // 0X ?
    //     }
    //   }
    // });
    // networkControllerState.networkConfigurations = {};
  }
}
