/**
 * MUSD Shared Types
 *
 * Type definitions shared between UI and background scripts for mUSD conversion.
 * These types are used for validation, filtering, and token eligibility checks.
 */

import type { Hex } from '@metamask/utils';

// ============================================================================
// Token Types
// ============================================================================

/**
 * Represents a token that can be converted to mUSD
 */
export type ConvertibleToken = {
  /** Token contract address */
  address: Hex;
  /** Token symbol (e.g., 'USDC', 'USDT', 'DAI') */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Chain ID where the token exists */
  chainId: Hex;
  /** Token balance in smallest unit (wei) */
  balance: string;
  /** Token balance in fiat (USD) */
  fiatBalance: string;
  /** Token icon URL or path */
  iconUrl?: string;
};

// ============================================================================
// Wildcard Token List Types
// ============================================================================

/**
 * Wildcard token list for filtering
 * Keys are chain IDs or "*" for all chains
 * Values are arrays of token symbols or "*" for all tokens
 *
 * @example
 * // Allow USDC on ALL chains
 * { "*": ["USDC"] }
 * @example
 * // Allow ALL tokens on Ethereum
 * { "0x1": ["*"] }
 * @example
 * // Allow specific tokens on specific chain
 * { "0x1": ["USDC", "USDT"] }
 */
export type WildcardTokenList = Record<string, string[]>;
