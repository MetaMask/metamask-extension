import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { RegistryNetworkConfig } from '@metamask/config-registry-controller';
import { KnownCaipNamespace } from '@metamask/utils';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../shared/constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../shared/constants/multichain/networks';
import { convertCaipToHexChainId } from '../../shared/lib/network.utils';
import { submitRequestToBackground } from '../store/background-connection';
import {
  getIsConfigRegistryApiEnabled,
  isAllowedImageUrl,
} from '../selectors/config-registry/config-registry';

const REGISTRY_NETWORKS_QUERY_KEY = ['ConfigRegistryController', 'networks'];

/**
 * Fetches the registry networks from the ConfigRegistryController via the
 * background messenger. Shared across every consumer through the react-query
 * cache, so only one background call is in flight regardless of how many
 * components mount.
 */
async function fetchRegistryNetworks(): Promise<
  Record<string, RegistryNetworkConfig>
> {
  const state = await submitRequestToBackground(
    'ConfigRegistryController:getState',
  );
  return state.configs?.networks ?? {};
}

/**
 * Layers registry image URLs over a static base map. EVM entries are keyed
 * by both hex and CAIP-2 chain ID; non-EVM entries by CAIP-2 chain ID only.
 */
function withRegistryImageUrls(
  base: Record<string, string>,
  networks: Record<string, RegistryNetworkConfig>,
  urlFor: (network: RegistryNetworkConfig) => string | undefined,
): Record<string, string> {
  const merged: Record<string, string> = { ...base };
  for (const network of Object.values(networks)) {
    const url = urlFor(network);
    if (!isAllowedImageUrl(url)) {
      continue;
    }
    merged[network.chainId] = url;
    if (network.chainId.startsWith(`${KnownCaipNamespace.Eip155}:`)) {
      try {
        merged[convertCaipToHexChainId(network.chainId)] = url;
      } catch {
        // Malformed eip155 reference; the CAIP key above still applies
      }
    }
  }
  return merged;
}

/**
 * Builds the chain ID to network logo map (registry network `imageUrl` over
 * the static network logo maps) from registry networks.
 */
export function buildNetworkImageUrls(
  networks: Record<string, RegistryNetworkConfig> | undefined,
  isEnabled: boolean,
): Record<string, string> {
  const base = {
    ...CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
    ...MULTICHAIN_TOKEN_IMAGE_MAP,
  };
  if (!isEnabled || !networks) {
    return base;
  }
  return withRegistryImageUrls(base, networks, (network) => network.imageUrl);
}

/**
 * Builds the chain ID to native token image map (registry
 * `assets.native.imageUrl` over the static token image map) from registry
 * networks.
 */
export function buildNativeTokenImageUrls(
  networks: Record<string, RegistryNetworkConfig> | undefined,
  isEnabled: boolean,
): Record<string, string> {
  if (!isEnabled || !networks) {
    return CHAIN_ID_TOKEN_IMAGE_MAP;
  }
  return withRegistryImageUrls(
    CHAIN_ID_TOKEN_IMAGE_MAP,
    networks,
    (network) => network.assets?.native?.imageUrl,
  );
}

/**
 * Provides the registry-aware network and native token image URL maps,
 * sourced from the ConfigRegistryController via the background messenger
 * (react-query caches and dedupes the call across consumers) instead of the
 * Redux-synced controller state.
 *
 * Falls back to the static image maps when the config registry API feature
 * flag is disabled or the controller has not fetched configs yet.
 *
 * @returns The network and native token image URL maps, keyed by hex and
 * CAIP-2 chain ID.
 */
export function useConfigRegistryNetworks(): {
  networkImageUrls: Record<string, string>;
  nativeTokenImageUrls: Record<string, string>;
} {
  const isEnabled = useSelector(getIsConfigRegistryApiEnabled);
  const { data } = useQuery({
    queryKey: REGISTRY_NETWORKS_QUERY_KEY,
    queryFn: fetchRegistryNetworks,
    enabled: Boolean(isEnabled),
    // The controller polls the registry API on its own schedule; a short
    // staleness window keeps logos fresh on remount without per-mount
    // background calls.
    staleTime: 30_000,
  });

  const networkImageUrls = useMemo(
    () => buildNetworkImageUrls(data, isEnabled),
    [data, isEnabled],
  );
  const nativeTokenImageUrls = useMemo(
    () => buildNativeTokenImageUrls(data, isEnabled),
    [data, isEnabled],
  );

  return { networkImageUrls, nativeTokenImageUrls };
}
