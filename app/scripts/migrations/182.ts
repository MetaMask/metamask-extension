import { cloneDeep } from 'lodash';
import { v4 as uuidV4 } from 'uuid';
import { hasProperty, isObject } from '@metamask/utils';
import {
  FEATURED_RPCS,
  SUPPORTED_NETWORKS_ACCOUNTS_API_V4,
} from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 182;

/**
 * This migration adds FEATURED_RPCS networks to the NetworkController's
 * networkConfigurationsByChainId if they are not already present.
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

function transformState(state: Record<string, unknown>) {
  if (process.env.IN_TEST) {
    return state;
  }

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

  const existingNetworkConfigurations =
    networkState.networkConfigurationsByChainId;

  // Add each FEATURED_RPCS network if it's not already present
  FEATURED_RPCS.forEach((featuredNetwork) => {
    if (!SUPPORTED_NETWORKS_ACCOUNTS_API_V4.includes(featuredNetwork.chainId)) {
      return;
    }
    const { chainId } = featuredNetwork;

    // Skip if network already exists
    if (existingNetworkConfigurations[chainId]) {
      return;
    }

    // Convert FEATURED_RPCS format to network configuration format
    const networkConfiguration = {
      chainId: featuredNetwork.chainId,
      name: featuredNetwork.name,
      nativeCurrency: featuredNetwork.nativeCurrency,
      rpcEndpoints: featuredNetwork.rpcEndpoints.map((endpoint) => ({
        url: endpoint.url,
        failoverUrls: endpoint.failoverUrls || [],
        type: endpoint.type,
        networkClientId: uuidV4(), // Will be set by the network controller
      })),
      defaultRpcEndpointIndex: featuredNetwork.defaultRpcEndpointIndex,
      blockExplorerUrls: featuredNetwork.blockExplorerUrls || [],
      defaultBlockExplorerUrlIndex:
        featuredNetwork.defaultBlockExplorerUrlIndex || 0,
    };

    // Add the network configuration
    existingNetworkConfigurations[chainId] = networkConfiguration;
  });

  return state;
}
