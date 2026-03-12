import type { AddNetworkFields } from '@metamask/network-controller';
import { RpcEndpointType } from '@metamask/network-controller';
import { selectFeaturedNetworks } from '@metamask/config-registry-controller';
import { createSelector } from 'reselect';
import { add0x, parseCaipChainId, KnownCaipNamespace } from '@metamask/utils';
import type { RegistryNetworkConfig } from '@metamask/config-registry-controller';
import { getRemoteFeatureFlags } from '../remote-feature-flags';
import { FEATURED_RPCS } from '../../../shared/constants/network';

/** Default empty controller state shape for selectFeaturedNetworks. */
const EMPTY_REGISTRY_CONTROLLER_STATE = {
  configs: { networks: {} },
  version: null,
  lastFetched: null,
  etag: null,
} as const;

/**
 * ConfigRegistryController state slice as it appears in the flat metamask state.
 * The controller state is merged into the root by the store's getFlatState().
 */
export type ConfigRegistryStateSlice = {
  configs?: { networks: Record<string, RegistryNetworkConfig> };
  version?: string | null;
  lastFetched?: number | null;
  etag?: string | null;
};

/**
 * Redux state shape required by config-registry selectors.
 * Exported for use in tests. Metamask slice is optional (e.g. during bootstrap).
 */
export type StateWithConfigRegistry = {
  metamask?: ConfigRegistryStateSlice & {
    remoteFeatureFlags?: Record<string, unknown>;
  };
};

/**
 * Returns the Config Registry controller state slice from Redux state.
 * Used to pass into @metamask/config-registry-controller selectors.
 * @param state
 */
export const getConfigRegistryState = (
  state: StateWithConfigRegistry,
): ConfigRegistryStateSlice | undefined => state.metamask;

/**
 * Builds the shape expected by @metamask/config-registry-controller selectFeaturedNetworks
 * from the flat state slice.
 * @param slice
 */
function toRegistryControllerState(
  slice: ConfigRegistryStateSlice | undefined,
) {
  if (!slice) {
    return { ...EMPTY_REGISTRY_CONTROLLER_STATE };
  }
  return {
    configs: slice.configs ?? { networks: {} },
    version: slice.version ?? null,
    lastFetched: slice.lastFetched ?? null,
    etag: slice.etag ?? null,
  };
}

/**
 * Returns whether the Config Registry API feature flag is enabled.
 * When false, the UI should use the static FEATURED_RPCS list.
 */
export const getIsConfigRegistryApiEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags) => Boolean(remoteFeatureFlags?.configRegistryApiEnabled),
);

type Hex = `0x${string}`;

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

/**
 * Converts a RegistryNetworkConfig (EVM only) to AddNetworkFields for the add-network flow.
 * Returns null for non-EVM, missing default RPC, or invalid RPC URL (non-https).
 * Includes imageUrl when config provides a valid https image URL.
 * @param config
 */
function registryConfigToAddNetworkFields(
  config: RegistryNetworkConfig,
): FeaturedNetworkForAdditionalList | null {
  let namespace: string;
  try {
    ({ namespace } = parseCaipChainId(config.chainId as `eip155:${string}`));
  } catch {
    return null;
  }
  if (namespace !== KnownCaipNamespace.Eip155) {
    return null;
  }
  const reference = config.chainId.split(':')[1];
  const parsed = Number.parseInt(reference, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  const hexChainId = add0x(parsed.toString(16)) as Hex;

  const defaultRpc = config.rpcProviders?.default;
  if (!defaultRpc || !isAllowedRpcUrl(defaultRpc.url)) {
    return null;
  }

  const blockExplorerUrls = config.blockExplorerUrls?.default
    ? [config.blockExplorerUrls.default]
    : [];
  const nativeCurrency = config.assets?.native?.symbol ?? 'ETH';

  const result: FeaturedNetworkForAdditionalList = {
    chainId: hexChainId,
    name: config.name,
    nativeCurrency,
    rpcEndpoints: [
      {
        url: defaultRpc.url,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: blockExplorerUrls as `https://${string}`[],
    defaultBlockExplorerUrlIndex: blockExplorerUrls.length > 0 ? 0 : undefined,
  };
  if (config.imageUrl && isAllowedImageUrl(config.imageUrl)) {
    result.imageUrl = config.imageUrl;
  }
  return result;
}

/**
 * Returns the list of featured networks to show in "Additional networks".
 * When the config registry API is enabled and we have fetched configs, returns
 * the dynamic list from the registry (EVM only). Otherwise falls back to the
 * static FEATURED_RPCS list.
 */
export const getFeaturedNetworksForAdditionalList = createSelector(
  getConfigRegistryState,
  getIsConfigRegistryApiEnabled,
  (
    configRegistryState,
    isConfigRegistryEnabled,
  ): FeaturedNetworkForAdditionalList[] => {
    if (
      !isConfigRegistryEnabled ||
      !configRegistryState?.configs?.networks ||
      Object.keys(configRegistryState.configs.networks).length === 0
    ) {
      return FEATURED_RPCS as FeaturedNetworkForAdditionalList[];
    }

    const registryControllerState =
      toRegistryControllerState(configRegistryState);
    const featuredFromRegistry = selectFeaturedNetworks(
      registryControllerState,
    );
    const evmNetworks: FeaturedNetworkForAdditionalList[] = [];

    for (const config of Object.values(featuredFromRegistry)) {
      const fields = registryConfigToAddNetworkFields(config);
      if (fields) {
        evmNetworks.push(fields);
      }
    }

    return evmNetworks.length > 0
      ? evmNetworks
      : (FEATURED_RPCS as FeaturedNetworkForAdditionalList[]);
  },
);
