import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from './chain-ids';

/**
 * The single source of truth for the QuickNode failover config: each chain that
 * has a QuickNode failover, paired with the name of the env variable that holds
 * its QuickNode endpoint URL. The env is read lazily (when the map is built),
 * so tests can just set `process.env`.
 */
const QUICKNODE_URL_ENV_VARS_BY_CHAIN_ID = new Map<Hex, string>([
  [CHAIN_IDS.MAINNET, 'QUICKNODE_MAINNET_URL'],
  [CHAIN_IDS.LINEA_MAINNET, 'QUICKNODE_LINEA_MAINNET_URL'],
  [CHAIN_IDS.ARBITRUM, 'QUICKNODE_ARBITRUM_URL'],
  [CHAIN_IDS.AVALANCHE, 'QUICKNODE_AVALANCHE_URL'],
  [CHAIN_IDS.OPTIMISM, 'QUICKNODE_OPTIMISM_URL'],
  [CHAIN_IDS.POLYGON, 'QUICKNODE_POLYGON_URL'],
  [CHAIN_IDS.BASE, 'QUICKNODE_BASE_URL'],
  [CHAIN_IDS.BSC, 'QUICKNODE_BSC_URL'],
  [CHAIN_IDS.ZKSYNC_ERA, 'QUICKNODE_ZKSYNC_URL'],
  [CHAIN_IDS.MEGAETH_MAINNET, 'QUICKNODE_MEGAETH_URL'],
  [CHAIN_IDS.SEI, 'QUICKNODE_SEI_URL'],
  [CHAIN_IDS.MONAD, 'QUICKNODE_MONAD_URL'],
  [CHAIN_IDS.HYPE, 'QUICKNODE_HYPEREVM_URL'],
  [CHAIN_IDS.ARC, 'QUICKNODE_ARC_URL'],
  [CHAIN_IDS.ROBINHOOD_CHAIN, 'QUICKNODE_ROBINHOOD_URL'],
]);

/**
 * Builds the chain ID keyed QuickNode failover map used to initialize the
 * NetworkController. Chains whose QuickNode env is unset resolve to an empty
 * array.
 *
 * @returns A map of chain ID to failover URLs.
 */
export function getFailoverUrlsByChainId(): Record<Hex, string[]> {
  const failoverUrlsByChainId: Record<Hex, string[]> = {};
  for (const [chainId, envVar] of QUICKNODE_URL_ENV_VARS_BY_CHAIN_ID) {
    const url = process.env[envVar];
    failoverUrlsByChainId[chainId] = url ? [url] : [];
  }
  return failoverUrlsByChainId;
}

/**
 * Returns the QuickNode failover URLs for a chain, or an empty array if the
 * chain has no mapped failover (or its env is unset).
 *
 * @param chainId - The chain ID to look up.
 * @returns The failover URLs, empty when there is no mapped failover.
 */
export function getFailoverUrlsForChainId(chainId: Hex): string[] {
  return getFailoverUrlsByChainId()[chainId] ?? [];
}

/**
 * Returns whether the given endpoint URL is one of the known QuickNode failover
 * URLs.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @returns True if the URL is a QuickNode URL, false otherwise.
 */
export function getIsQuicknodeEndpointUrl(endpointUrl: string): boolean {
  return Object.values(getFailoverUrlsByChainId()).some((urls) =>
    urls.includes(endpointUrl),
  );
}
