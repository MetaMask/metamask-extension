import { NetworkConfiguration } from '@metamask/network-controller';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 128;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

/**
 * Explain the purpose of the migration here.
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

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController)
  ) {
    // type NetworkConfiguration and NetworkConfigurationId not exported from NetworkConroller.d.ts
    // need for reverse lookup. typing to string
    const existingNetworkConfigsCopy = state.NetworkController
      .networkConfigurations as Record<
      string,
      NetworkConfiguration & {
        id: string;
      }
    >;

    Object.values(existingNetworkConfigsCopy).forEach((networkConfig) => {
      if (networkConfig.ticker === 'MATIC') {
        existingNetworkConfigsCopy[networkConfig.id].ticker = 'POL';
      }
    });

    state.NetworkController.networkConfigurations = existingNetworkConfigsCopy;
  }
  const newState = state;
  // transform state here
  return newState;
}
