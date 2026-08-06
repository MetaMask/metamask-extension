import { Hex } from '@metamask/utils';
import {
  CHAIN_IDS,
  QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
  getFailoverUrlsForInfuraNetwork,
} from './network';

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
