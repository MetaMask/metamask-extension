/**
 * BearNetworkChain customization (fork-only).
 *
 * Keep all BearNetworkChain-specific network constants here so upstream merges
 * of `network.ts` only need minimal import/spread touch points.
 *
 * Chain ID 641230 (0x9c8ce) — native token BRNKC.
 */

import type { AddNetworkFields } from '@metamask/network-controller';
import { RpcEndpointType } from '@metamask/network-controller';

/** Decimal chain ID: 641230 */
export const BEAR_NETWORK_CHAIN_ID = '0x9c8ce' as const;

export const BEAR_NETWORK_CHAIN_DISPLAY_NAME = 'BearNetworkChain';

export const BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL = 'BRNKC' as const;

/** Relative to extension package root (`app/images/...` on disk). */
export const BEAR_NETWORK_CHAIN_IMAGE_URL = './images/bearnetworkchain.svg';

export const BEAR_NETWORK_CHAIN_RPC_URL =
  'https://brnkc-mainnet.bearnetwork.net';

/**
 * Official NetworkController failover list (not custom round-robin).
 * Primary endpoint stays `BEAR_NETWORK_CHAIN_RPC_URL`; these are used when it fails.
 */
export const BEAR_NETWORK_CHAIN_FAILOVER_URLS = [
  'https://brnkc-mainnet1.bearnetwork.net',
  'https://bnes-mainnet.bearnetwork.net',
  'https://bnes-mainnet1.bearnetwork.net',
] as const;

export const BEAR_NETWORK_CHAIN_BLOCK_EXPLORER_URL =
  'https://brnkscan.bearnetwork.net';

/** Spread into `CHAIN_IDS` in network.ts */
export const BEAR_NETWORK_CHAIN_IDS = {
  BEAR_NETWORK_CHAIN: BEAR_NETWORK_CHAIN_ID,
} as const;

/** Spread into `CURRENCY_SYMBOLS` in network.ts */
export const BEAR_NETWORK_CURRENCY_SYMBOLS = {
  BRNKC: BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL,
} as const;

/** Spread into `NETWORK_TO_NAME_MAP` in network.ts */
export const BEAR_NETWORK_CHAIN_TO_NAME_MAP = {
  [BEAR_NETWORK_CHAIN_ID]: BEAR_NETWORK_CHAIN_DISPLAY_NAME,
} as const;

/** Spread into `CHAIN_ID_TO_CURRENCY_SYMBOL_MAP` in network.ts */
export const BEAR_NETWORK_CHAIN_TO_CURRENCY_SYMBOL_MAP = {
  [BEAR_NETWORK_CHAIN_ID]: BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL,
} as const;

/**
 * Spread into `CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP` and `CHAIN_ID_TOKEN_IMAGE_MAP`
 * in network.ts (same logo for network + native token).
 */
export const BEAR_NETWORK_CHAIN_IMAGE_MAP = {
  [BEAR_NETWORK_CHAIN_ID]: BEAR_NETWORK_CHAIN_IMAGE_URL,
} as const;

/**
 * Featured network entry for `FEATURED_RPCS` (placed first for discoverability).
 * Uses MetaMask `failoverUrls` on the primary custom RPC endpoint.
 */
export const BEAR_NETWORK_CHAIN_FEATURED: AddNetworkFields = {
  chainId: BEAR_NETWORK_CHAIN_ID,
  name: BEAR_NETWORK_CHAIN_DISPLAY_NAME,
  nativeCurrency: BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL,
  rpcEndpoints: [
    {
      url: BEAR_NETWORK_CHAIN_RPC_URL,
      failoverUrls: [...BEAR_NETWORK_CHAIN_FAILOVER_URLS],
      type: RpcEndpointType.Custom,
    },
  ],
  defaultRpcEndpointIndex: 0,
  blockExplorerUrls: [BEAR_NETWORK_CHAIN_BLOCK_EXPLORER_URL],
  defaultBlockExplorerUrlIndex: 0,
};
