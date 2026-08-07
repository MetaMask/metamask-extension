import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from './chain-ids';

/**
 * The single source of truth for the QuickNode failover config: each chain that
 * has a QuickNode failover, paired with a getter that reads its URL from the
 * env lazily. Wrapping the env reads in getters means callers resolve the URLs
 * when they run, so tests can just set `process.env` rather than reloading the
 * module. `as const` keeps every row a fixed `[chainId, getUrl]` tuple so the
 * helpers below can index it without type assertions.
 */
const QUICKNODE_FAILOVER_URL_GETTERS_BY_CHAIN_ID = [
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
] as const satisfies readonly (readonly [Hex, () => string | undefined])[];

/**
 * Returns the QuickNode failover URLs for a chain. Returns an empty array for a
 * mapped chain whose env is unset, and `undefined` for a chain that has no
 * mapped failover.
 *
 * @param chainId - The chain ID to look up.
 * @returns The failover URLs, or `undefined` if the chain has no mapped failover.
 */
export function getFailoverUrlsForChainId(chainId: Hex): string[] | undefined {
  const entry = QUICKNODE_FAILOVER_URL_GETTERS_BY_CHAIN_ID.find(
    ([mappedChainId]) => mappedChainId === chainId,
  );
  if (!entry) {
    return undefined;
  }
  const url = entry[1]();
  return url ? [url] : [];
}

/**
 * Builds the chain ID keyed QuickNode failover map used to initialize the
 * NetworkController. Chains whose QuickNode env is unset resolve to an empty
 * array.
 *
 * @returns A map of chain ID to failover URLs.
 */
export function getFailoverUrlsByChainId(): Record<Hex, string[]> {
  return QUICKNODE_FAILOVER_URL_GETTERS_BY_CHAIN_ID.reduce<
    Record<Hex, string[]>
  >((map, [chainId, getUrl]) => {
    const url = getUrl();
    map[chainId] = url ? [url] : [];
    return map;
  }, {});
}

/**
 * Returns whether the given endpoint URL is one of the known QuickNode failover
 * URLs.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @returns True if the URL is a QuickNode URL, false otherwise.
 */
export function getIsQuicknodeEndpointUrl(endpointUrl: string): boolean {
  return QUICKNODE_FAILOVER_URL_GETTERS_BY_CHAIN_ID.some(
    ([, getUrl]) => getUrl() === endpointUrl,
  );
}
