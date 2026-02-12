import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import {
  CHAIN_IDS,
  getFailoverUrlsForInfuraNetwork,
} from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 180;

/**
 * This migration adds Base network to the `NetworkController` as it is enabled by default.
 * - It modifies the `NetworkController.state.networkConfigurationsByChainId` to include Base network.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state with base network added
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
  if (!hasProperty(state, 'NetworkController')) {
    console.warn(`Migration ${version}: NetworkController not found.`);
    return state;
  }

  const networkState = state.NetworkController;
  if (!isObject(networkState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController is not an object: ${typeof networkState}`,
      ),
    );
    return state;
  }

  if (!hasProperty(networkState, 'networkConfigurationsByChainId')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController missing property networkConfigurationsByChainId.`,
      ),
    );
    return state;
  }

  if (!isObject(networkState.networkConfigurationsByChainId)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is not an object: ${typeof networkState.networkConfigurationsByChainId}.`,
      ),
    );
    return state;
  }

  const existingBaseNetwork =
    networkState.networkConfigurationsByChainId[CHAIN_IDS.BASE];

  if (existingBaseNetwork && isObject(existingBaseNetwork)) {
    // Check if Infura endpoint already exists
    const hasInfuraEndpoint =
      hasProperty(existingBaseNetwork, 'rpcEndpoints') &&
      Array.isArray(existingBaseNetwork.rpcEndpoints) &&
      existingBaseNetwork.rpcEndpoints.some(
        (endpoint) =>
          isObject(endpoint) &&
          hasProperty(endpoint, 'networkClientId') &&
          hasProperty(endpoint, 'type') &&
          endpoint.networkClientId === 'base-mainnet' &&
          endpoint.type === 'infura',
      );

    if (hasInfuraEndpoint) {
      return state;
    }

    // Add Infura endpoint to existing Base network configuration
    const infuraConfig = getBaseNetworkConfiguration();
    const updatedBaseNetwork = {
      ...existingBaseNetwork,
      rpcEndpoints: [
        ...(Array.isArray(existingBaseNetwork.rpcEndpoints)
          ? existingBaseNetwork.rpcEndpoints
          : []),
        ...infuraConfig.rpcEndpoints,
      ],
    };

    networkState.networkConfigurationsByChainId[CHAIN_IDS.BASE] =
      updatedBaseNetwork;
  } else {
    // No existing Base network, add the complete Infura configuration
    networkState.networkConfigurationsByChainId[CHAIN_IDS.BASE] =
      getBaseNetworkConfiguration();
  }

  return state;
}

// Exported for testing purposes
export function getBaseNetworkConfiguration() {
  return {
    blockExplorerUrls: [],
    chainId: '0x2105' as const, // toHex(8453) Base Network
    defaultRpcEndpointIndex: 0,
    name: 'Base',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        failoverUrls: getFailoverUrlsForInfuraNetwork('base-mainnet'),
        networkClientId: 'base-mainnet',
        type: 'infura',
        url: 'https://base-mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
  };
}
