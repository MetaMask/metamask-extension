/**
 * BNS (BearNetwork Name Service) constants for the MetaMask fork.
 *
 * Kept under shared/bns/ so upstream merges never need to touch these files.
 * Network IDs remain in shared/constants/bearnetworkchain.ts.
 */

import {
  BEAR_NETWORK_CHAIN_FAILOVER_URLS,
  BEAR_NETWORK_CHAIN_ID,
  BEAR_NETWORK_CHAIN_RPC_URL,
} from '../constants/bearnetworkchain';

/** Preferred path-style IPFS gateway host for BNS contenthash resolution. */
export const BNS_DEFAULT_IPFS_GATEWAY_HOST = 'ipfs.bearnetwork.net';

/** Fallback gateway host used only when the primary is explicitly overridden. */
export const BNS_FALLBACK_IPFS_GATEWAY_HOST = 'ipfs.io';

/**
 * Three canonical HTTPS RPC origins for read quorum (3-of-2).
 * Primary + first two failover URLs — must stay unique and HTTPS-only.
 */
export const BNS_READ_RPC_URLS = [
  BEAR_NETWORK_CHAIN_RPC_URL,
  BEAR_NETWORK_CHAIN_FAILOVER_URLS[0],
  BEAR_NETWORK_CHAIN_FAILOVER_URLS[1],
] as const;

export const BNS_CHAIN_ID_HEX = BEAR_NETWORK_CHAIN_ID;
export const BNS_CHAIN_ID_DECIMAL = 641230;
export const BNS_RPC_QUORUM = 2;
export const BNS_DEFAULT_RPC_TIMEOUT_MS = 10_000;

/**
 * Minimal ABIs used by the BNS resolver entry. Full contract ABIs live in bns/.
 */
export const BNS_REGISTRY_RESOLVER_FRAGMENT =
  'function resolver(bytes32 node) view returns (address)';

export const BNS_RESOLVER_CONTENTHASH_FRAGMENT =
  'function contenthash(bytes32 node) view returns (bytes)';

/**
 * Optional seed registry address from build-time env. Empty means "not
 * configured yet" — resolve must fail closed rather than guess.
 */
export const BNS_SEED_REGISTRY_ADDRESS =
  (typeof process !== 'undefined' &&
    process.env.BNS_REGISTRY_ADDRESS &&
    process.env.BNS_REGISTRY_ADDRESS.trim()) ||
  '';

/**
 * BNESOracle address for BRNKC/USD price queries.
 * Optional seed from build-time env; empty means "not configured".
 */
export const BNS_SEED_ORACLE_ADDRESS =
  (typeof process !== 'undefined' &&
    process.env.BNES_ORACLE_ADDRESS &&
    process.env.BNES_ORACLE_ADDRESS.trim()) ||
  '';

/**
 * BRNKC token addresses.
 */
export const BRNKC_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';
export const BRNKC_USD_VIRTUAL_ADDRESS = '0x0000000000000000000000000000000000000001';

/**
 * Oracle price cache TTL in milliseconds.
 * Matches keeper interval (300s) — no point polling faster than updates.
 */
export const BNS_ORACLE_PRICE_CACHE_TTL_MS = 5 * 60 * 1000;
