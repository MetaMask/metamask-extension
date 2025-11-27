import { hasProperty, isObject, Hex } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 184;

// MegaETH Testnet chain ID changed from 6342 to 6343
const OLD_CHAIN_ID: Hex = '0x18c6'; // 6342
const NEW_CHAIN_ID: Hex = '0x18c7'; // 6343
const NEW_RPC_URL = 'https://timothy.megaeth.com/rpc';
const NETWORK_CLIENT_ID = 'megaeth-testnet';

/**
 * This migration updates the MegaETH Testnet network configuration
 * to use the new chain ID (6343) and new RPC URL.
 *
 * @param originalVersionedData - Versioned MetaMask extension state.
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
  if (!hasProperty(state, 'NetworkController')) {
    return state;
  }

  const networkState = state.NetworkController;
  if (!isObject(networkState)) {
    return state;
  }

  if (
    !hasProperty(networkState, 'networkConfigurationsByChainId') ||
    !isObject(networkState.networkConfigurationsByChainId)
  ) {
    return state;
  }

  const { networkConfigurationsByChainId } = networkState;

  // Check if the old chain ID exists in the user's configuration
  const oldNetworkConfig = networkConfigurationsByChainId[OLD_CHAIN_ID];

  if (!oldNetworkConfig) {
    // User doesn't have this network, nothing to migrate
    return state;
  }

  if (
    !isObject(oldNetworkConfig) ||
    !hasProperty(oldNetworkConfig, 'rpcEndpoints') ||
    !Array.isArray(oldNetworkConfig.rpcEndpoints)
  ) {
    return state;
  }

  // Update the RPC endpoints with the new URL
  const updatedRpcEndpoints = oldNetworkConfig.rpcEndpoints.map(
    (rpcEndpoint: Record<string, unknown>) => {
      if (!isObject(rpcEndpoint) || !hasProperty(rpcEndpoint, 'url')) {
        return rpcEndpoint;
      }

      // Only update the default MegaETH testnet RPC endpoint
      if (
        rpcEndpoint.url === 'https://carrot.megaeth.com/rpc' ||
        rpcEndpoint.networkClientId === NETWORK_CLIENT_ID
      ) {
        return {
          ...rpcEndpoint,
          url: NEW_RPC_URL,
        };
      }

      return rpcEndpoint;
    },
  );

  // Create the new network configuration with the new chain ID
  const newNetworkConfig = {
    ...oldNetworkConfig,
    chainId: NEW_CHAIN_ID,
    rpcEndpoints: updatedRpcEndpoints,
  };

  // Add the new configuration and remove the old one
  networkConfigurationsByChainId[NEW_CHAIN_ID] = newNetworkConfig;
  delete networkConfigurationsByChainId[OLD_CHAIN_ID];

  // Update selectedNetworkClientId if it was pointing to the old network
  if (
    hasProperty(networkState, 'selectedNetworkClientId') &&
    typeof networkState.selectedNetworkClientId === 'string'
  ) {
    const wasOnOldChain = (
      oldNetworkConfig.rpcEndpoints as { networkClientId?: string }[]
    ).some(
      (endpoint) =>
        endpoint.networkClientId === networkState.selectedNetworkClientId,
    );

    if (wasOnOldChain && updatedRpcEndpoints.length > 0) {
      // Keep the same networkClientId since we're just updating the chain
      networkState.selectedNetworkClientId = NETWORK_CLIENT_ID;
    }
  }

  return state;
}

export default migrate;
