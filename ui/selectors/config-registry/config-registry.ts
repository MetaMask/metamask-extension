import type { AddNetworkFields } from '@metamask/network-controller';
import { RpcEndpointType } from '@metamask/network-controller';
import { selectFeaturedNetworks } from '@metamask/config-registry-controller';
import { createSelector } from 'reselect';
import { add0x, parseCaipChainId, KnownCaipNamespace } from '@metamask/utils';
import type { RegistryNetworkConfig } from '@metamask/config-registry-controller';
import { getRemoteFeatureFlags } from '../remote-feature-flags';
import { FEATURED_RPCS } from '../../../shared/constants/network';

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
    return {
      configs: { networks: {} },
      version: null,
      lastFetched: null,
      etag: null,
    };
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
 * Converts a RegistryNetworkConfig (EVM only) to AddNetworkFields for the add-network flow.
 * @param config
 */
function registryConfigToAddNetworkFields(
  config: RegistryNetworkConfig,
): AddNetworkFields | null {
  const { namespace } = parseCaipChainId(config.chainId as `eip155:${string}`);
  if (namespace !== KnownCaipNamespace.Eip155) {
    return null;
  }
  const reference = config.chainId.split(':')[1];
  const hexChainId = add0x(parseInt(reference, 10).toString(16)) as Hex;

  const defaultRpc = config.rpcProviders?.default;
  if (!defaultRpc?.url) {
    return null;
  }

  const blockExplorerUrls = config.blockExplorerUrls?.default
    ? [config.blockExplorerUrls.default]
    : [];
  const nativeCurrency = config.assets?.native?.symbol ?? 'ETH';

  return {
    chainId: hexChainId,
    name: config.name,
    nativeCurrency,
    rpcEndpoints: [
      {
        url: defaultRpc.url as `https://${string}`,
        type: RpcEndpointType.Custom,
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: blockExplorerUrls as `https://${string}`[],
    defaultBlockExplorerUrlIndex: blockExplorerUrls.length > 0 ? 0 : undefined,
  };
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
  (configRegistryState, isConfigRegistryEnabled): AddNetworkFields[] => {
    if (
      !isConfigRegistryEnabled ||
      !configRegistryState?.configs?.networks ||
      Object.keys(configRegistryState.configs.networks).length === 0
    ) {
      return FEATURED_RPCS;
    }

    const registryControllerState =
      toRegistryControllerState(configRegistryState);
    const featuredFromRegistry = selectFeaturedNetworks(
      registryControllerState,
    );
    const evmNetworks: AddNetworkFields[] = [];

    for (const config of Object.values(featuredFromRegistry)) {
      const fields = registryConfigToAddNetworkFields(config);
      if (fields) {
        evmNetworks.push(fields);
      }
    }

    return evmNetworks.length > 0 ? evmNetworks : FEATURED_RPCS;
  },
);
