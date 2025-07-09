import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { type Hex, hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 145;

/**
 * This migration updates the values of the chain IDs in the NetworkOrderController
 * from Hex to CaipChainId format (CAIP-19).
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
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

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  // Migrate the user's drag + drop preference order for the network menu
  if (
    hasProperty(state, 'NetworkOrderController') &&
    isObject(state.NetworkOrderController) &&
    Array.isArray(state.NetworkOrderController.orderedNetworkList)
  ) {
    state.NetworkOrderController.orderedNetworkList =
      state.NetworkOrderController.orderedNetworkList.map(({ networkId }) => ({
        networkId: toEvmCaipChainId(networkId as Hex),
      }));
  }

  return state;
}
