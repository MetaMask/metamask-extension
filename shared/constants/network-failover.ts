import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from './chain-ids';

/**
 * The single source of truth for the QuickNode failover config: each chain that
 * has a QuickNode failover, paired with a getter that reads its QuickNode
 * endpoint URL from the env.
 *
 * The getters reference `process.env.SOME_KEY` statically on purpose: the build
 * only inlines static `process.env.KEY` accesses, so a dynamic
 * `process.env[variable]` lookup would stay unresolved in production bundles and
 * disable failover. Reading the env inside a getter (rather than at module load)
 * also lets tests just set `process.env`.
 */
const QUICKNODE_URL_GETTERS_BY_CHAIN_ID = new Map<
  Hex,
  () => string | undefined
>([
  [CHAIN_IDS.MAINNET, () => process.env.QUICKNODE_MAINNET_URL],
  [CHAIN_IDS.LINEA_MAINNET, () => process.env.QUICKNODE_LINEA_MAINNET_URL],
  [CHAIN_IDS.ARBITRUM, () => process.env.QUICKNODE_ARBITRUM_URL],
  [CHAIN_IDS.AVALANCHE, () => process.env.QUICKNODE_AVALANCHE_URL],
  [CHAIN_IDS.OPTIMISM, () => process.env.QUICKNODE_OPTIMISM_URL],
  [CHAIN_IDS.POLYGON, () => process.env.QUICKNODE_POLYGON_URL],
  [CHAIN_IDS.BASE, () => process.env.QUICKNODE_BASE_URL],
  [CHAIN_IDS.BSC, () => process.env.QUICKNODE_BSC_URL],
  [CHAIN_IDS.ZKSYNC_ERA, () => process.env.QUICKNODE_ZKSYNC_URL],
  [CHAIN_IDS.MEGAETH_MAINNET, () => process.env.QUICKNODE_MEGAETH_URL],
  [CHAIN_IDS.SEI, () => process.env.QUICKNODE_SEI_URL],
  [CHAIN_IDS.MONAD, () => process.env.QUICKNODE_MONAD_URL],
  [CHAIN_IDS.HYPE, () => process.env.QUICKNODE_HYPEREVM_URL],
  [CHAIN_IDS.ARC, () => process.env.QUICKNODE_ARC_URL],
  [CHAIN_IDS.ROBINHOOD_CHAIN, () => process.env.QUICKNODE_ROBINHOOD_URL],
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
  for (const [chainId, getUrl] of QUICKNODE_URL_GETTERS_BY_CHAIN_ID) {
    const url = getUrl();
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
