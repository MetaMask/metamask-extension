import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from './chain-ids';

/**
 * The QuickNode failover endpoint URLs, keyed by Infura network name. Each value
 * reads its env lazily so it resolves whenever it is called (once, when the map
 * below is built, or when a migration resolves a historical value).
 */
export const QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME = {
  'ethereum-mainnet': () => process.env.QUICKNODE_MAINNET_URL,
  'linea-mainnet': () => process.env.QUICKNODE_LINEA_MAINNET_URL,
  'arbitrum-mainnet': () => process.env.QUICKNODE_ARBITRUM_URL,
  'avalanche-mainnet': () => process.env.QUICKNODE_AVALANCHE_URL,
  'optimism-mainnet': () => process.env.QUICKNODE_OPTIMISM_URL,
  'polygon-mainnet': () => process.env.QUICKNODE_POLYGON_URL,
  'base-mainnet': () => process.env.QUICKNODE_BASE_URL,
  'sei-mainnet': () => process.env.QUICKNODE_SEI_URL,
  'monad-mainnet': () => process.env.QUICKNODE_MONAD_URL,
  'hyperevm-mainnet': () => process.env.QUICKNODE_HYPEREVM_URL,
  'arc-mainnet': () => process.env.QUICKNODE_ARC_URL,
  'robinhood-mainnet': () => process.env.QUICKNODE_ROBINHOOD_URL,
  'bsc-mainnet': () => process.env.QUICKNODE_BSC_URL,
  'zksync-mainnet': () => process.env.QUICKNODE_ZKSYNC_URL,
  'megaeth-mainnet': () => process.env.QUICKNODE_MEGAETH_URL,
};

/**
 * Returns the QuickNode failover URLs for an Infura network, or an empty array
 * if its env is unset.
 *
 * @param infuraNetwork - The Infura network name to look up.
 * @returns The failover URLs, empty when the QuickNode env is unset.
 */
export function getFailoverUrlsForInfuraNetwork(
  infuraNetwork: keyof typeof QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
) {
  const url = QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME[infuraNetwork]();
  if (url) {
    return [url];
  }
  return [];
}

/**
 * Returns whether the given endpoint URL is one of the known QuickNode failover
 * URLs.
 *
 * @param endpointUrl - The URL of the RPC endpoint.
 * @returns True if the URL is a QuickNode URL, false otherwise.
 */
export function getIsQuicknodeEndpointUrl(endpointUrl: string): boolean {
  return Object.values(QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME)
    .map((getUrl) => getUrl())
    .includes(endpointUrl);
}

/**
 * The chains that have a QuickNode failover, each paired with the Infura
 * network name used to resolve its failover URL. `as const` keeps every row a
 * fixed `[chainId, infuraNetworkName]` tuple, so the map below can be built
 * without type assertions.
 */
const INFURA_NETWORK_NAME_BY_CHAIN_ID = [
  [CHAIN_IDS.MAINNET, 'ethereum-mainnet'],
  [CHAIN_IDS.LINEA_MAINNET, 'linea-mainnet'],
  [CHAIN_IDS.ARBITRUM, 'arbitrum-mainnet'],
  [CHAIN_IDS.AVALANCHE, 'avalanche-mainnet'],
  [CHAIN_IDS.OPTIMISM, 'optimism-mainnet'],
  [CHAIN_IDS.POLYGON, 'polygon-mainnet'],
  [CHAIN_IDS.BASE, 'base-mainnet'],
  [CHAIN_IDS.BSC, 'bsc-mainnet'],
  [CHAIN_IDS.ZKSYNC_ERA, 'zksync-mainnet'],
  [CHAIN_IDS.MEGAETH_MAINNET, 'megaeth-mainnet'],
  [CHAIN_IDS.SEI, 'sei-mainnet'],
  [CHAIN_IDS.MONAD, 'monad-mainnet'],
  [CHAIN_IDS.HYPE, 'hyperevm-mainnet'],
  [CHAIN_IDS.ARC, 'arc-mainnet'],
  [CHAIN_IDS.ROBINHOOD_CHAIN, 'robinhood-mainnet'],
] as const satisfies readonly (readonly [
  Hex,
  keyof typeof QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
])[];

/**
 * The chain ID keyed QuickNode failover map, the single source of truth shared
 * between the NetworkController initialization and the network form display.
 *
 * Resolved once at module load from the QuickNode env, the same way
 * FEATURED_RPCS resolves its failover URLs. A chain whose QuickNode env is unset
 * resolves to an empty array; a chain that is not in the map is absent.
 */
export const FAILOVER_URLS_BY_CHAIN_ID: Record<Hex, string[]> =
  INFURA_NETWORK_NAME_BY_CHAIN_ID.reduce<Record<Hex, string[]>>(
    (map, [chainId, infuraNetworkName]) => {
      map[chainId] = getFailoverUrlsForInfuraNetwork(infuraNetworkName);
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
