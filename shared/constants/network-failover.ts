import { Hex } from '@metamask/utils';
import {
  CHAIN_IDS,
  QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
  getFailoverUrlsForInfuraNetwork,
} from './network';

/**
 * The chains that have a QuickNode failover, each paired with the Infura
 * network name used to resolve its failover URL. `as const` keeps every row a
 * fixed `[chainId, infuraNetworkName]` tuple, so callers can iterate and index
 * it without type assertions.
 *
 * This is the single source of truth shared between the NetworkController
 * initialization (which builds a chain ID keyed map) and the network form
 * (which looks up a single chain).
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
] as const satisfies readonly (readonly [
  Hex,
  keyof typeof QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
])[];

/**
 * Returns the QuickNode failover URLs for a chain, mirroring the map the
 * NetworkController is initialized with. Returns `undefined` for chains that
 * have no mapped failover so callers can fall back to an endpoint's own
 * `failoverUrls`.
 *
 * @param chainId - The chain ID to look up.
 * @returns The failover URLs, or `undefined` if the chain has no mapped failover.
 */
export function getFailoverUrlsForChainId(chainId: Hex): string[] | undefined {
  const entry = INFURA_NETWORK_NAME_BY_CHAIN_ID.find(
    ([mappedChainId]) => mappedChainId === chainId,
  );
  return entry ? getFailoverUrlsForInfuraNetwork(entry[1]) : undefined;
}

/**
 * Builds the chain ID to failover URLs map used to initialize the
 * NetworkController. Chains whose QuickNode env is unset resolve to an empty
 * array.
 *
 * @returns A map of chain ID to failover URLs.
 */
export function getFailoverUrlsByChainId(): Record<Hex, string[]> {
  const failoverUrlsByChainId: Record<Hex, string[]> = {};
  for (const [chainId, infuraNetworkName] of INFURA_NETWORK_NAME_BY_CHAIN_ID) {
    failoverUrlsByChainId[chainId] =
      getFailoverUrlsForInfuraNetwork(infuraNetworkName);
  }
  return failoverUrlsByChainId;
}
