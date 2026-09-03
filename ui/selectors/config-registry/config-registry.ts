import type { AddNetworkFields } from '@metamask/network-controller';
import {
  RpcEndpointType,
  AddNetworkCustomRpcEndpointFields,
  InfuraRpcEndpoint,
} from '@metamask/network-controller';
import { createSelector } from 'reselect';
import { CaipChainIdStruct } from '@metamask/utils';
import type {
  ConfigRegistryControllerState,
  RegistryNetworkConfig,
} from '@metamask/config-registry-controller';
import { isInfuraNetworkType } from '@metamask/controller-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import { captureException } from '../../../shared/lib/sentry';
import { createSentryError } from '../../../shared/lib/error';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';

/**
 * Get the Configs from the ConfigRegistryController state.
 *
 * @param state - The MetaMask state object
 * @param state.metamask - The MetaMask state slice
 */
export const getRegistryConfigs = (state: {
  metamask: ConfigRegistryControllerState;
}) => state.metamask.configs;

/**
 * Returns whether the Config Registry API feature flag is enabled.
 * When false, the UI should use the static FEATURED_RPCS list.
 */
export const getIsConfigRegistryApiEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) => Boolean(remoteFeatureFlags?.configRegistryApiEnabled),
);

/**
 * Returns true if url is a non-empty string and uses an allowed scheme (https).
 * Rejects empty, non-strings, and non-https URLs to avoid unsafe add-network data.
 * @param url
 */
function isAllowedRpcUrl(url: unknown): url is `https://${string}` {
  return (
    typeof url === 'string' &&
    url.length > 0 &&
    url.toLowerCase().startsWith('https://')
  );
}

/**
 * Returns true if url is a non-empty string and uses https (for image URLs).
 * @param url
 */
function isAllowedImageUrl(url: unknown): url is `https://${string}` {
  return isAllowedRpcUrl(url);
}

/**
 * Network item for "Additional networks" list. Extends AddNetworkFields with
 * optional imageUrl from the config registry (validated https only).
 */
export type FeaturedNetwork = AddNetworkFields & {
  imageUrl?: string;
};

/**
 * Converts a RegistryNetworkConfig (EVM only) to AddNetworkFields for the add-network flow.
 * Returns null for non-EVM, missing default RPC, or invalid RPC URL (non-https).
 * Includes imageUrl when config provides a valid https image URL.
 * @param config
 */
function registryConfigToAddNetworkFields(
  config: RegistryNetworkConfig,
): FeaturedNetwork | null {
  try {
    CaipChainIdStruct.assert(config.chainId);
    const hexChainId = convertCaipToHexChainId(config.chainId);

    const defaultRpc = config.rpcProviders?.default;
    if (!defaultRpc || !isAllowedRpcUrl(defaultRpc.url)) {
      return null;
    }

    const blockExplorerUrls = config.blockExplorerUrls?.default
      ? [config.blockExplorerUrls.default]
      : [];
    const nativeCurrency = config.assets?.native?.symbol ?? 'ETH';

    const rpcEndpoint: AddNetworkCustomRpcEndpointFields | InfuraRpcEndpoint =
      defaultRpc.type === RpcEndpointType.Infura &&
      isInfuraNetworkType(defaultRpc.networkClientId)
        ? {
            type: RpcEndpointType.Infura,
            networkClientId: defaultRpc.networkClientId,
            url: `https://${defaultRpc.networkClientId}.infura.io/v3/{infuraProjectId}`,
          }
        : {
            type: RpcEndpointType.Custom,
            url: defaultRpc.url,
          };

    return {
      chainId: hexChainId,
      name: config.name,
      nativeCurrency,
      rpcEndpoints: [rpcEndpoint],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: blockExplorerUrls as `https://${string}`[],
      defaultBlockExplorerUrlIndex:
        blockExplorerUrls.length > 0 ? 0 : undefined,
      ...(config.imageUrl && isAllowedImageUrl(config.imageUrl)
        ? { imageUrl: config.imageUrl }
        : {}),
    };
  } catch (error) {
    captureException(
      createSentryError(
        'Error converting registry config to add network fields:',
        error,
      ),
    );
    return null;
  }
}

/**
 * Returns the list of featured EVM networks to show in "Additional networks".
 * When the config registry API is enabled and we have fetched configs, returns
 * the dynamic list from the registry (EVM only). Otherwise falls back to the
 * static FEATURED_RPCS list.
 */
export const getFeaturedEvmNetworks = createSelector(
  getRegistryConfigs,
  getIsConfigRegistryApiEnabled,
  (configs, isConfigRegistryEnabled): FeaturedNetwork[] => {
    if (
      !isConfigRegistryEnabled ||
      !configs?.networks ||
      Object.keys(configs.networks).length === 0
    ) {
      return FEATURED_RPCS;
    }

    const evmNetworks = Object.values(configs.networks).reduce<
      FeaturedNetwork[]
    >((acc, network) => {
      if (
        !network.config.isActive ||
        !network.config.isFeatured ||
        network.config.isTestnet
      ) {
        return acc;
      }
      const fields = registryConfigToAddNetworkFields(network);
      if (fields) {
        acc.push(fields);
      }
      return acc;
    }, []);

    return evmNetworks.length > 0 ? evmNetworks : FEATURED_RPCS;
  },
);
