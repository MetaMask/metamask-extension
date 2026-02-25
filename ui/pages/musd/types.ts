/**
 * MUSD Conversion Feature Types
 *
 * TypeScript type definitions for the mUSD stablecoin conversion feature.
 * These types define the data structures used throughout the conversion flow.
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

// ============================================================================
// Feature Flag Types
// ============================================================================

/**
 * mUSD feature flags from remote configuration
 */
export type MusdFeatureFlags = {
  /** Master toggle for mUSD conversion */
  earnMusdConversionFlowEnabled: boolean;
  /** Enable Buy/Get mUSD CTA */
  earnMusdCtaEnabled: boolean;
  /** Enable secondary CTA on token list */
  earnMusdConversionTokenListItemCtaEnabled: boolean;
  /** Enable tertiary CTA on asset overview */
  earnMusdConversionAssetOverviewCtaEnabled: boolean;
  /** Enable rewards UI elements */
  earnMusdConversionRewardsUiEnabled: boolean;
  /** Wildcard list for CTA-enabled tokens */
  earnMusdConversionCtaTokens: WildcardTokenList;
  /** Wildcard list for allowed payment tokens */
  earnMusdConvertibleTokensAllowlist: WildcardTokenList;
  /** Wildcard list for blocked payment tokens */
  earnMusdConvertibleTokensBlocklist: WildcardTokenList;
  /** Geo-blocked countries configuration */
  earnMusdConversionGeoBlockedCountries: GeoBlockingConfig;
  /** Minimum token balance in USD for conversion eligibility */
  earnMusdConversionMinAssetBalanceRequired: number;
  /** Enable Merkl rewards claiming */
  earnMerklCampaignClaiming: boolean;
};

/**
 * Geo-blocking configuration
 */
export type GeoBlockingConfig = {
  /** List of blocked country/region codes (e.g., "GB", "GB-ENG", "US-CA") */
  blockedRegions: string[];
};
