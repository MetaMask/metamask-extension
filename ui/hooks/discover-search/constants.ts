import type { CaipChainId } from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { TrxScope } from '@metamask/keyring-api';

import { CHAIN_IDS } from '../../../shared/constants/network';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';

/** Popular networks used for crypto trending / search (aligned with mobile Explore). */
export const DISCOVER_SEARCH_CHAIN_IDS: CaipChainId[] = [
  toEvmCaipChainId(CHAIN_IDS.MAINNET),
  MultichainNetworks.BITCOIN,
  MultichainNetworks.SOLANA,
  toEvmCaipChainId(CHAIN_IDS.BSC),
  toEvmCaipChainId(CHAIN_IDS.BASE),
  toEvmCaipChainId(CHAIN_IDS.ARBITRUM),
  toEvmCaipChainId(CHAIN_IDS.OPTIMISM),
  toEvmCaipChainId(CHAIN_IDS.POLYGON),
  toEvmCaipChainId(CHAIN_IDS.AVALANCHE),
  toEvmCaipChainId(CHAIN_IDS.MONAD),
  toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET),
  toEvmCaipChainId(CHAIN_IDS.SEI),
  toEvmCaipChainId(CHAIN_IDS.ZKSYNC_ERA),
  toEvmCaipChainId(CHAIN_IDS.ROBINHOOD_CHAIN),
  TrxScope.Mainnet,
];

/** RWA / tokenized stocks default chains. */
export const DISCOVER_STOCKS_CHAIN_IDS: CaipChainId[] = [
  toEvmCaipChainId(CHAIN_IDS.MAINNET),
  toEvmCaipChainId(CHAIN_IDS.BSC),
];

export const DISCOVER_SEARCH_DEBOUNCE_MS = 500;
export const DISCOVER_SEARCH_PREVIEW_COUNT = 3;
export const DISCOVER_SEARCH_PAGE_SIZE = 20;
export const DISCOVER_SEARCH_STALE_TIME_MS = 30_000;
export const DISCOVER_SEARCH_GC_TIME_MS = 5 * 60_000;

export const DISCOVER_SEARCH_QUERY_KEY_ROOT = [
  'metamask-extension',
  'discoverSearch',
  'v1',
] as const;
