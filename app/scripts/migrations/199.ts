import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { ChainId, InfuraNetworkType } from '@metamask/controller-utils';
import { hasProperty, Hex, isObject } from '@metamask/utils';
import {
  getFailoverUrlsForInfuraNetwork,
  infuraProjectId,
  QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
} from '../../../shared/constants/network';
import type { Migrate } from './types';

export const version = 199;

/**
 * This migration changes `type` for all network clients with an Infura
 * RPC endpoint to `infura`.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedControllers);
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
): void {
  if (!hasNetworkConfigurationsByChainId(state)) {
    return;
  }

  for (const [chainId, networkConfiguration] of Object.entries(
    state.NetworkController.networkConfigurationsByChainId,
  )) {
    const networkName = getNetworkNameForChainId(chainId as Hex);

    if (
      !isObject(networkConfiguration) ||
      !hasRPCEndpoints(networkConfiguration) ||
      !networkName ||
      !isBuiltInInfuraNetwork(networkName)
    ) {
      // If the network configuration doesn't have the expected structure, or
      // if the chain ID is not part of built-in networks, we skip it.
      continue;
    }

    for (const rpcEndpoint of networkConfiguration.rpcEndpoints) {
      if (!isRPCEndpoint(rpcEndpoint) || rpcEndpoint.type === 'infura') {
        // If the RPC endpoint doesn't have the expected structure or is already an Infura endpoint, we skip it.
        continue;
      }

      if (rpcEndpoint.url.endsWith(`.infura.io/v3/${infuraProjectId}`)) {
        rpcEndpoint.type = 'infura';
        rpcEndpoint.url = rpcEndpoint.url.replace(
          `.infura.io/v3/${infuraProjectId}`,
          '.infura.io/v3/{infuraProjectId}',
        );
        changedControllers.add('NetworkController');
      }
    }

    if (
      !networkConfiguration.rpcEndpoints.some(
        (rpcEndpoint) =>
          isRPCEndpoint(rpcEndpoint) && rpcEndpoint.type === 'infura',
      )
    ) {
      // There should be at least one Infura endpoint for each network configuration,
      // so we add one if none of the existing endpoints are Infura endpoints.
      networkConfiguration.rpcEndpoints.push(
        getDefaultInfuraRPCEndpointForNetworkClientId(networkName),
      );
      changedControllers.add('NetworkController');
    }
  }
}

/**
 * Type guard for `state` that checks if it has the expected structure for
 * accessing `networkConfigurationsByChainId`.
 *
 * @param state - The state object to check.
 * @returns A boolean indicating whether the state has the expected structure.
 */
function hasNetworkConfigurationsByChainId(
  state: Record<string, unknown>,
): state is {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NetworkController: {
    networkConfigurationsByChainId: Record<string, unknown>;
  };
} {
  return (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'networkConfigurationsByChainId') &&
    isObject(state.NetworkController.networkConfigurationsByChainId)
  );
}

/**
 * Type guard for `networkConfiguration` that checks if it has an `rpcEndpoints`
 * property that is an array.
 *
 * @param networkConfiguration - The network configuration object to check.
 * @returns A boolean indicating whether the network configuration has the expected structure.
 */
function hasRPCEndpoints(
  networkConfiguration: Record<string, unknown>,
): networkConfiguration is { rpcEndpoints: unknown[] } {
  return (
    hasProperty(networkConfiguration, 'rpcEndpoints') &&
    Array.isArray(networkConfiguration.rpcEndpoints)
  );
}

/**
 * Type guard for `rpcEndpoint` that checks if it has the expected structure with
 * `type` and `url` properties.
 *
 * @param rpcEndpoint - The RPC endpoint object to check.
 * @returns A boolean indicating whether the RPC endpoint has the expected structure.
 */
function isRPCEndpoint(
  rpcEndpoint: unknown,
): rpcEndpoint is { type: string; url: string } {
  return (
    isObject(rpcEndpoint) &&
    hasProperty(rpcEndpoint, 'type') &&
    typeof rpcEndpoint.type === 'string' &&
    hasProperty(rpcEndpoint, 'url') &&
    typeof rpcEndpoint.url === 'string'
  );
}

/**
 * Type guard to check if a given network name is a built-in Infura network.
 *
 * @param networkName - The name of the network to check.
 * @returns True if the network name is a built-in Infura network, false otherwise.
 */
function isBuiltInInfuraNetwork(
  networkName: string,
): networkName is InfuraNetworkType {
  return Object.keys(InfuraNetworkType).includes(networkName);
}

/**
 * Helper function to get the network name corresponding to a given chain ID.
 *
 * @param chainId - The chain ID for which to get the network name.
 * @returns The network name corresponding to the given chain ID, or undefined if not found.
 */
function getNetworkNameForChainId(chainId: Hex) {
  return Object.keys(ChainId).find(
    (name) => ChainId[name as keyof typeof ChainId] === chainId,
  );
}

/**
 * Returns the default Infura RPC endpoint configuration for a given chain ID.
 *
 * @param networkClientId - The network client ID (Infura network name) for which
 * to get the default RPC endpoint configuration.
 * @returns The default Infura RPC endpoint configuration for the specified chain ID.
 * @throws An error if the chain ID is not supported by Infura.
 */
function getDefaultInfuraRPCEndpointForNetworkClientId(
  networkClientId: InfuraNetworkType,
): NetworkConfiguration['rpcEndpoints'][number] {
  const failoverUrls = getFailoverUrlsForInfuraNetwork(
    networkClientId as keyof typeof QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
  );

  return {
    type: RpcEndpointType.Infura,
    url: `https://${networkClientId}.infura.io/v3/{infuraProjectId}`,
    networkClientId,
    failoverUrls,
  };
}
