import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from './chain-ids';

/**
 * The single source of truth for the QuickNode failover config: each chain that
 * has a QuickNode failover, paired with a getter that reads its URL from the
 * env lazily. `as const` keeps every row a fixed `[chainId, getUrl]` tuple so
 * the map below can be built without type assertions.
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
 * The chain ID keyed QuickNode failover map, the single source of truth shared
 * between the NetworkController initialization and the network form display.
 *
 * Resolved once at module load from the QuickNode env, the same way
 * FEATURED_RPCS resolves its failover URLs. A chain whose QuickNode env is unset
 * resolves to an empty array; a chain that is not in the map is absent.
 */
export const FAILOVER_URLS_BY_CHAIN_ID: Record<Hex, string[]> =
  QUICKNODE_FAILOVER_URL_GETTERS_BY_CHAIN_ID.reduce<Record<Hex, string[]>>(
    (map, [chainId, getUrl]) => {
      const url = getUrl();
      map[chainId] = url ? [url] : [];
      return map;
    },
    {},
  );

/**
 * Returns the QuickNode failover URLs for a chain. Returns an empty array for a
 * mapped chain whose env is unset, and `undefined` for a chain that has no
 * mapped failover.
 *
 * @param chainId - The chain ID to look up.
 * @returns The failover URLs, or `undefined` if the chain has no mapped failover.
 */
export function getFailoverUrlsForChainId(chainId: Hex): string[] | undefined {
  return FAILOVER_URLS_BY_CHAIN_ID[chainId];
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
