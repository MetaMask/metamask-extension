import type { RegistryNetworkConfig } from '@metamask/config-registry-controller';
import { filterNetworks } from '@metamask/config-registry-controller';
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
 * Transforms a RegistryNetworkConfig from the config registry API to AddNetworkFields for UI.
 *
 * @param network - Network from config registry API
 * @returns Network in AddNetworkFields format
 */
function transformRegistryNetworkConfigToAddNetworkFields(
  network: RegistryNetworkConfig,
): AddNetworkFields {
  const transformRpcUrl = (url: string | undefined): string => {
    if (!url) {
      return '';
    }
    return infuraProjectId
      ? url.replace('{infuraProjectId}', infuraProjectId)
      : url;
  };

  return {
    chainId: network.chainId as `0x${string}`,
    name: network.name || network.chainId,
    nativeCurrency: network.nativeCurrency || 'ETH',
    rpcEndpoints:
      network.rpcEndpoints?.map((endpoint) => ({
        url: transformRpcUrl(endpoint.url),
        type: RpcEndpointType.Custom as const,
        networkClientId: endpoint.networkClientId,
        failoverUrls: endpoint.failoverUrls?.map(transformRpcUrl) || [],
      })) || [],
    defaultRpcEndpointIndex: network.defaultRpcEndpointIndex ?? 0,
    blockExplorerUrls: network.blockExplorerUrls || [],
    defaultBlockExplorerUrlIndex: network.defaultBlockExplorerUrlIndex ?? 0,
  };
}

/**
 * Gets featured networks from Config Registry that aren't already added.
 * Filters by isFeatured, isActive, non-testnet, non-deprecated; excludes existing chain IDs;
 * transforms to AddNetworkFields for UI display.
 *
 * @param networks - Networks from Config Registry (RegistryNetworkConfig[])
 * @param existingNetworks - Existing network configurations keyed by chain ID
 * @returns Array of networks ready to be displayed in UI
 */
export function getFeaturedNetworksToAdd(
  networks: RegistryNetworkConfig[],
  existingNetworks: Record<string, NetworkConfiguration>,
): AddNetworkFields[] {
  if (!Array.isArray(networks) || networks.length === 0) {
    return [];
  }

  const filtered = filterNetworks(networks, {
    isFeatured: true,
    isActive: true,
    isDeprecated: false,
    isTestnet: false,
  });

  const existingChainIds = new Set(Object.keys(existingNetworks));
  const toAdd = filtered.filter((n) => !existingChainIds.has(n.chainId));

  return toAdd.map(transformRegistryNetworkConfigToAddNetworkFields);
}
