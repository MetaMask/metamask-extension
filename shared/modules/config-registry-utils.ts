import type {
  NetworkConfig,
  NetworkFilterOptions,
  NetworkComparisonOptions,
  TransformedNetworkResult,
} from '@metamask/config-registry-controller';
import { processNetworkConfigs } from '@metamask/config-registry-controller';
import type {
  NetworkConfiguration,
  AddNetworkFields,
} from '@metamask/network-controller';
import { RpcEndpointType } from '@metamask/network-controller';
import { infuraProjectId } from '../constants/network';

/**
 * Transforms a NetworkConfiguration to AddNetworkFields format for UI display.
 *
 * @param networkConfig - Network configuration from controller
 * @returns Network in AddNetworkFields format
 */
export function transformNetworkConfigurationToAddNetworkFields(
  networkConfig: NetworkConfiguration,
): AddNetworkFields {
  // Replace {infuraProjectId} placeholder in RPC URLs
  const transformRpcUrl = (url: string | undefined): string => {
    if (!url) {
      return '';
    }
    return infuraProjectId
      ? url.replace('{infuraProjectId}', infuraProjectId)
      : url;
  };

  return {
    chainId: networkConfig.chainId,
    name: networkConfig.name || networkConfig.chainId,
    nativeCurrency: networkConfig.nativeCurrency || 'ETH',
    rpcEndpoints:
      networkConfig.rpcEndpoints?.map((endpoint) => {
        const transformedUrl = transformRpcUrl(endpoint.url);
        return {
          url: transformedUrl,
          type: RpcEndpointType.Custom as const,
          networkClientId: endpoint.networkClientId,
          failoverUrls: endpoint.failoverUrls?.map(transformRpcUrl) || [],
        };
      }) || [],
    defaultRpcEndpointIndex:
      networkConfig.rpcEndpoints?.findIndex(
        (ep) =>
          ep.networkClientId ===
          networkConfig.rpcEndpoints?.[0]?.networkClientId,
      ) ?? 0,
    blockExplorerUrls: networkConfig.blockExplorerUrls || [],
    defaultBlockExplorerUrlIndex: 0,
  };
}

/**
 * Processes networks from Config Registry API:
 * - Filters by isFeatured=true
 * - Transforms to NetworkConfiguration format
 * - Compares with existing networks to avoid duplicates
 *
 * @param networks - Networks from Config Registry API
 * @param existingNetworks - Existing network configurations from NetworkController
 * @returns Result containing networks to add and existing chain IDs
 */
export function processFeaturedNetworksFromConfigRegistry(
  networks: NetworkConfig[],
  existingNetworks: Record<string, NetworkConfiguration>,
): TransformedNetworkResult {
  // Filter for featured networks only
  const filterOptions: NetworkFilterOptions = {
    isFeatured: true,
    isActive: true,
    isDeprecated: false,
  };

  // Compare with existing networks
  const comparisonOptions: NetworkComparisonOptions = {
    existingNetworks: existingNetworks as Record<string, NetworkConfiguration>,
  };

  // Use the controller's processNetworkConfigs function
  return processNetworkConfigs(networks, filterOptions, comparisonOptions);
}

/**
 * Gets featured networks from Config Registry that aren't already added.
 * Transforms them to AddNetworkFields format for UI display.
 *
 * @param networks - Networks from Config Registry
 * @param existingNetworks - Existing network configurations
 * @returns Array of networks ready to be displayed in UI
 */
export function getFeaturedNetworksToAdd(
  networks: NetworkConfig[],
  existingNetworks: Record<string, NetworkConfiguration>,
): AddNetworkFields[] {
  if (!Array.isArray(networks) || networks.length === 0) {
    return [];
  }

  // Process networks: filter, transform, and compare
  const result = processFeaturedNetworksFromConfigRegistry(
    networks,
    existingNetworks,
  );

  // Transform NetworkConfiguration to AddNetworkFields for UI
  return result.networksToAdd.map(
    transformNetworkConfigurationToAddNetworkFields,
  );
}
