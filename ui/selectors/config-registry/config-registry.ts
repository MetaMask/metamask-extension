import type { AddNetworkFields } from '@metamask/network-controller';
import {
  RpcEndpointType,
  AddNetworkCustomRpcEndpointFields,
  InfuraRpcEndpoint,
} from '@metamask/network-controller';
import { createSelector } from 'reselect';
import {
  add0x,
  CaipChainId,
  CaipChainIdStruct,
  Hex,
  parseCaipChainId,
} from '@metamask/utils';
import type {
  ConfigRegistryControllerState,
  RegistryNetworkConfig,
} from '@metamask/config-registry-controller';
import { isInfuraNetworkType } from '@metamask/controller-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import { captureException } from '../../../shared/lib/sentry';
import { createSentryError } from '../../../shared/lib/error';

/**
 * Get the Configs from the ConfigRegistryController state, or undefined if not set.
 */
export const getRegistryConfigs = createSelector(
  (state: { metamask?: Partial<ConfigRegistryControllerState> }) =>
    state.metamask?.configs,
  (configs): ConfigRegistryControllerState['configs'] | undefined => {
    return configs;
  },
);

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
export type FeaturedNetworkForAdditionalList = AddNetworkFields & {
  imageUrl?: string;
};

function caipChainIdToHex(chainId: CaipChainId): Hex {
  const { namespace, reference } = parseCaipChainId(chainId);
  if (namespace !== 'eip155') {
    throw new Error(`Unsupported CAIP namespace: ${namespace}`);
  }
  const decimalChainId = parseInt(reference, 10);
  if (isNaN(decimalChainId)) {
    throw new Error(`Invalid CAIP reference: ${reference}`);
  }
  return add0x(decimalChainId.toString(16));
}

/**
 * Converts a RegistryNetworkConfig (EVM only) to AddNetworkFields for the add-network flow.
 * Returns null for non-EVM, missing default RPC, or invalid RPC URL (non-https).
 * Includes imageUrl when config provides a valid https image URL.
 * @param config
 */
function registryConfigToAddNetworkFields(
  config: RegistryNetworkConfig,
): FeaturedNetworkForAdditionalList | null {
  try {
    CaipChainIdStruct.assert(config.chainId);
    const hexChainId = caipChainIdToHex(config.chainId);

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
 * Returns the list of featured networks to show in "Additional networks".
 * When the config registry API is enabled and we have fetched configs, returns
 * the dynamic list from the registry (EVM only). Otherwise falls back to the
 * static FEATURED_RPCS list.
 */
export const getFeaturedNetworksForAdditionalList = createSelector(
  getRegistryConfigs,
  getIsConfigRegistryApiEnabled,
  (configs, isConfigRegistryEnabled): FeaturedNetworkForAdditionalList[] => {
    if (
      !isConfigRegistryEnabled ||
      !configs?.networks ||
      Object.keys(configs.networks).length === 0
    ) {
      return FEATURED_RPCS;
    }

    const evmNetworks = Object.values(configs.networks).reduce<
      FeaturedNetworkForAdditionalList[]
    >((acc, config) => {
      if (
        config.config.isActive !== true ||
        config.config.isFeatured !== true ||
        config.config.isTestnet === true
      ) {
        return acc;
      }
      const fields = registryConfigToAddNetworkFields(config);
      if (fields) {
        acc.push(fields);
      }
      return acc;
    }, []);

    return evmNetworks.length > 0 ? evmNetworks : FEATURED_RPCS;
  },
);
