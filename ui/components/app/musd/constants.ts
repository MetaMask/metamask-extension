/* MUSD (MetaMask USD) Stablecoin Conversion Constants
 *
 * This file contains all constants related to the mUSD stablecoin conversion feature.
 * mUSD is a stablecoin pegged to USD (1 mUSD ≈ $1) that can be obtained by converting
 * supported stablecoins (USDC, USDT, DAI, etc.) on Ethereum Mainnet and Linea chains.
 */

import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';

export const MERKL_API_BASE_URL = 'https://api.merkl.xyz/v4';

export const MERKL_DISTRIBUTOR_ADDRESS =
  '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const;

/**
 * The chain where Merkl rewards are claimed (Linea mainnet = 0xe708 = 59144).
 * Even if a user holds mUSD on mainnet, rewards are always claimed on Linea.
 */
export const MERKL_CLAIM_CHAIN_ID = CHAIN_IDS.LINEA_MAINNET as Hex;

// Test token addresses used for Merkl test campaigns
export const AGLAMERKL_ADDRESS_MAINNET =
  '0x8d652c6d4A8F3Db96Cd866C1a9220B1447F29898';
export const AGLAMERKL_ADDRESS_LINEA =
  '0x03C2d2014795EE8cA78B62738433B457AB19F4b3';

// ABI for the claim method on the Merkl Distributor contract
export const DISTRIBUTOR_CLAIM_ABI = [
  'function claim(address[] calldata users, address[] calldata tokens, uint256[] calldata amounts, bytes32[][] calldata proofs)',
];

// ABI for the claimed mapping on the Merkl Distributor contract
export const DISTRIBUTOR_CLAIMED_ABI = [
  'function claimed(address user, address token) external view returns (uint208 amount, uint48 timestamp, bytes32 merkleRoot)',
];

/** Remote feature flag key for Merkl campaign claiming */
export const MERKL_FEATURE_FLAG_KEY = 'earnMerklCampaignClaiming';

/**
 * mUSD token address (same on all supported chains)
 * This is the canonical mUSD contract address used across Mainnet, Linea, and BSC.
 */
export const MUSD_TOKEN_ADDRESS: Hex =
  '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

/**
 * Map of chains and their eligible token addresses for Merkl rewards.
 * mUSD on mainnet is eligible because users earn rewards for holding it,
 * even though the actual reward claiming happens on Linea.
 */
export const ELIGIBLE_TOKENS: Record<string, string[]> = {
  [CHAIN_IDS.MAINNET]: [AGLAMERKL_ADDRESS_MAINNET, MUSD_TOKEN_ADDRESS],
  [CHAIN_IDS.LINEA_MAINNET]: [AGLAMERKL_ADDRESS_LINEA, MUSD_TOKEN_ADDRESS],
  '0xe709': [AGLAMERKL_ADDRESS_LINEA, MUSD_TOKEN_ADDRESS],
};

/**
 * mUSD token metadata
 */
export const MUSD_TOKEN = {
  symbol: 'MUSD',
  name: 'MUSD',
  decimals: 6,
} as const;

/**
 * mUSD token decimals (derived from MUSD_TOKEN for single source of truth)
 * Same as USDC - 6 decimal places
 */
export const MUSD_DECIMALS = MUSD_TOKEN.decimals;

/**
 * Default chain ID for mUSD conversion flows
 * Defaults to Ethereum Mainnet as the primary network
 */
export const MUSD_CONVERSION_DEFAULT_CHAIN_ID = CHAIN_IDS.MAINNET;

/**
 * mUSD token addresses by chain
 * mUSD has the same address on all supported chains for simplicity
 */
export const MUSD_TOKEN_ADDRESS_BY_CHAIN: Record<Hex, Hex> = {
  [CHAIN_IDS.MAINNET]: MUSD_TOKEN_ADDRESS,
  [CHAIN_IDS.LINEA_MAINNET]: MUSD_TOKEN_ADDRESS,
  [CHAIN_IDS.BSC]: MUSD_TOKEN_ADDRESS,
};

/**
 * CAIP-19 Asset IDs for mUSD by chain
 * Format: eip155:{chainId}/erc20:{tokenAddress}
 * Used for multi-chain asset identification
 */
export const MUSD_TOKEN_ASSET_ID_BY_CHAIN: Record<Hex, string> = {
  [CHAIN_IDS.MAINNET]:
    'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
  [CHAIN_IDS.LINEA_MAINNET]:
    'eip155:59144/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
  [CHAIN_IDS.BSC]: 'eip155:56/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
};

/**
 * Chains where mUSD CTA should show (buy routes available)
 * BSC is excluded as buy routes are not yet available
 */
export const MUSD_BUYABLE_CHAIN_IDS: Hex[] = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.LINEA_MAINNET,
  // CHAIN_IDS.BSC - TODO: Uncomment once buy routes are available
];

/**
 * mUSD currency symbol for display
 */
export const MUSD_CURRENCY = 'MUSD';

/**
 * mUSD conversion APY bonus percentage
 * Users receive a 3% bonus when converting to mUSD
 */
export const MUSD_CONVERSION_APY = 3;

/**
 * Delay before cleaning up toast tracking entries after final transaction status
 * Used to prevent duplicate toasts
 */
export const TOAST_TRACKING_CLEANUP_DELAY_MS = 5000;

/**
 * Default blocked countries for mUSD conversion when no remote or env config is available
 * This is a safety fallback to ensure geo-blocking is always active
 * GB (Great Britain) is blocked by default for regulatory compliance
 */
export const DEFAULT_MUSD_BLOCKED_COUNTRIES: string[] = ['GB'];

/**
 * URL for mUSD conversion bonus terms of use
 * Displayed in the education screen
 */
export const MUSD_CONVERSION_BONUS_TERMS_OF_USE =
  'https://metamask.io/musd-bonus-terms-of-use';

/**
 * Minimum asset balance required in USD for a token to be eligible for conversion
 * Default is $0.01 (1 cent) if not configured via feature flag
 */
export const FALLBACK_MIN_ASSET_BALANCE_REQUIRED = 0.01;

/**
 * Relay API endpoints for mUSD conversion
 */
export const RELAY_API_ENDPOINTS = {
  QUOTE: 'https://api.relay.link/quote',
  STATUS: 'https://api.relay.link/intents/status',
} as const;

/**
 * Geolocation API endpoint for geo-blocking checks
 * Uses the Ramps geolocation API
 */
export const GEOLOCATION_API_ENDPOINT =
  'https://on-ramp.api.cx.metamask.io/geolocation';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if the given token address is mUSD
 * mUSD has the same address on all supported chains
 *
 * @param address - Token address to check
 * @returns true if the address is the mUSD token address
 */
export const isMusdToken = (address?: string | null): boolean => {
  if (!address) {
    return false;
  }
  return address.toLowerCase() === MUSD_TOKEN_ADDRESS.toLowerCase();
};

/**
 * Get the mUSD token address for a specific chain
 *
 * @param chainId - The chain ID in hex format
 * @returns The mUSD token address for the chain, or undefined if not supported
 */
export const getMusdTokenAddressForChain = (chainId: Hex): Hex | undefined => {
  return MUSD_TOKEN_ADDRESS_BY_CHAIN[chainId.toLowerCase() as Hex];
};

/**
 * Get the CAIP-19 asset ID for mUSD on a specific chain
 *
 * @param chainId - The chain ID in hex format
 * @returns The CAIP-19 asset ID for mUSD on the chain, or undefined if not supported
 */
export const getMusdAssetIdForChain = (chainId: Hex): string | undefined => {
  return MUSD_TOKEN_ASSET_ID_BY_CHAIN[chainId.toLowerCase() as Hex];
};

/**
 * Check if a chain ID supports mUSD conversions
 *
 * @param chainId - The chain ID in hex format
 * @returns true if the chain supports mUSD conversions
 */
export const isMusdSupportedChain = (chainId: Hex): boolean => {
  return chainId.toLowerCase() in MUSD_TOKEN_ADDRESS_BY_CHAIN;
};

/**
 * Check if mUSD is buyable (via Ramp) on a specific chain
 *
 * @param chainId - The chain ID in hex format
 * @returns true if mUSD can be purchased via Ramp on the chain
 */
export const isMusdBuyableOnChain = (chainId: Hex): boolean => {
  return MUSD_BUYABLE_CHAIN_IDS.some(
    (id) => id.toLowerCase() === chainId.toLowerCase(),
  );
};
