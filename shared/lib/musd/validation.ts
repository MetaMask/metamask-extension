/**
 * MUSD Validation Utilities
 *
 * Validation functions for mUSD conversion amounts, token eligibility,
 * and geo-blocking checks.
 */

import { BigNumber } from 'bignumber.js';
import type { WildcardTokenList, ConvertibleToken } from './types';
import { calcTokenAmount } from './conversion-utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation result for amount checks
 */
export type ValidationResult = {
  isValid: boolean;
  error?:
    | 'invalid_amount'
    | 'insufficient_balance'
    | 'below_minimum'
    | 'exceeds_maximum';
  message?: string;
};

/**
 * Parameters for amount validation
 */
export type ValidateAmountParams = {
  /** Amount to validate (human-readable) */
  amount: string;
  /** Token balance in wei */
  balance: string;
  /** Token decimals */
  tokenDecimals: number;
  /** Minimum amount in USD */
  minAmountUsd: number;
  /** Token's fiat balance */
  fiatBalance: number;
};

/**
 * Access check result
 */
export type AccessCheckResult = {
  canAccess: boolean;
  reason?: 'feature_disabled' | 'geo_blocked' | 'no_convertible_tokens';
};

// ============================================================================
// Amount Validation
// ============================================================================

/**
 * Validate a conversion amount against balance and minimum requirements.
 *
 * @param params - Validation parameters
 * @param params.amount - Amount to validate (human-readable)
 * @param params.balance - Token balance in wei
 * @param params.tokenDecimals - Token decimals
 * @param params.minAmountUsd - Minimum amount in USD
 * @param params.fiatBalance - Token's fiat balance (reserved for future use)
 * @returns ValidationResult indicating if amount is valid
 * @example
 * validateConversionAmount({
 *   amount: '100',
 *   balance: '200000000',
 *   tokenDecimals: 6,
 *   minAmountUsd: 0.01,
 *   fiatBalance: 200,
 * })
 */
export function validateConversionAmount({
  amount,
  balance,
  tokenDecimals,
  minAmountUsd,
  fiatBalance: _fiatBalance,
}: ValidateAmountParams): ValidationResult {
  // Check if amount is a valid positive number
  if (!isValidAmountInput(amount)) {
    return {
      isValid: false,
      error: 'invalid_amount',
      message: 'Please enter a valid amount',
    };
  }

  // Check if amount exceeds balance
  if (isAmountExceedsBalance(amount, balance, tokenDecimals)) {
    return {
      isValid: false,
      error: 'insufficient_balance',
      message: 'Insufficient balance',
    };
  }

  // Check if amount is below minimum
  // Note: We compare against fiat value, not token amount
  if (isAmountBelowMinimum(amount, minAmountUsd)) {
    return {
      isValid: false,
      error: 'below_minimum',
      message: `Minimum amount is $${minAmountUsd}`,
    };
  }

  return { isValid: true };
}

/**
 * Check if an amount input is a valid positive number.
 *
 * @param amount - Amount string to validate
 * @returns true if the amount is a valid positive number
 */
export function isValidAmountInput(amount: string): boolean {
  if (!amount || amount.trim() === '') {
    return false;
  }

  const bn = new BigNumber(amount);

  // Must be a valid number
  if (bn.isNaN()) {
    return false;
  }

  // Must be positive
  if (bn.lte(0)) {
    return false;
  }

  // Must be finite
  if (!bn.isFinite()) {
    return false;
  }

  return true;
}

/**
 * Check if an amount exceeds the available balance.
 *
 * @param amount - Amount in human-readable format
 * @param balanceWei - Balance in wei (smallest unit)
 * @param decimals - Token decimals
 * @returns true if amount exceeds balance
 */
export function isAmountExceedsBalance(
  amount: string,
  balanceWei: string,
  decimals: number,
): boolean {
  const amountBN = new BigNumber(amount);
  const balanceBN = calcTokenAmount(balanceWei, decimals);

  return amountBN.gt(balanceBN);
}

/**
 * Check if an amount is below the minimum threshold.
 *
 * @param amount - Amount in USD
 * @param minAmountUsd - Minimum amount in USD
 * @returns true if amount is below minimum
 */
export function isAmountBelowMinimum(
  amount: string,
  minAmountUsd: number,
): boolean {
  const amountBN = new BigNumber(amount);
  return amountBN.lt(minAmountUsd);
}

// ============================================================================
// Wildcard Token List Matching
// ============================================================================

/**
 * Check if a value matches a pattern using wildcard logic.
 * "*" matches any value, otherwise exact match (case-insensitive).
 *
 * @param pattern - Pattern to match against (may be "*")
 * @param value - Value to check
 * @returns true if the value matches the pattern
 */
export function isWildcardMatch(pattern: string, value: string): boolean {
  if (pattern === '*') {
    return true;
  }
  return pattern.toLowerCase() === value.toLowerCase();
}

/**
 * Check if a token is allowed for conversion based on allowlist/blocklist.
 *
 * @param params - Token and list configuration
 * @param params.symbol - Token symbol
 * @param params.chainId - Chain ID (hex)
 * @param params.allowlist - Allowlist for eligible tokens
 * @param params.blocklist - Blocklist for excluded tokens
 * @returns true if the token can be converted to mUSD
 */
export function isConvertibleToken(params: {
  symbol: string;
  chainId: string;
  allowlist: WildcardTokenList;
  blocklist: WildcardTokenList;
}): boolean {
  const { symbol, chainId, allowlist, blocklist } = params;

  // First check blocklist - if blocked, return false
  if (isTokenInList(symbol, chainId, blocklist)) {
    return false;
  }

  // Then check allowlist - if in allowlist (or allowlist allows all), return true
  if (isTokenInList(symbol, chainId, allowlist)) {
    return true;
  }

  // Not in allowlist = not allowed
  return false;
}

/**
 * Check if a token is in a wildcard token list.
 *
 * @param symbol - Token symbol
 * @param chainId - Chain ID (hex)
 * @param list - Wildcard token list
 * @returns true if token is in the list
 */
function isTokenInList(
  symbol: string,
  chainId: string,
  list: WildcardTokenList,
): boolean {
  // Check wildcard chain entry (*)
  const wildcardChainTokens = list['*'];
  if (wildcardChainTokens) {
    // If tokens array includes "*" or the specific symbol
    for (const tokenPattern of wildcardChainTokens) {
      if (isWildcardMatch(tokenPattern, symbol)) {
        return true;
      }
    }
  }

  // Check specific chain entry
  const chainTokens = list[chainId];
  if (chainTokens) {
    for (const tokenPattern of chainTokens) {
      if (isWildcardMatch(tokenPattern, symbol)) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// Token Filtering
// ============================================================================

/**
 * Parameters for filtering convertible tokens.
 */
export type FilterConvertibleTokensParams = {
  /** Array of tokens to filter */
  tokens: ConvertibleToken[];
  /** Allowlist for eligible tokens */
  allowlist: WildcardTokenList;
  /** Blocklist for excluded tokens */
  blocklist: WildcardTokenList;
  /** Minimum balance in USD */
  minBalanceUsd: number;
};

/**
 * Filter an array of tokens to only those eligible for mUSD conversion.
 *
 * @param params - Filter parameters
 * @param params.tokens - Array of tokens to filter
 * @param params.allowlist - Allowlist for eligible tokens
 * @param params.blocklist - Blocklist for excluded tokens
 * @param params.minBalanceUsd - Minimum balance in USD
 * @returns Array of eligible tokens
 */
export function filterConvertibleTokens({
  tokens,
  allowlist,
  blocklist,
  minBalanceUsd,
}: FilterConvertibleTokensParams): ConvertibleToken[] {
  return tokens.filter((token) => {
    // Check if token passes allowlist/blocklist
    const isEligible = isConvertibleToken({
      symbol: token.symbol,
      chainId: token.chainId,
      allowlist,
      blocklist,
    });

    if (!isEligible) {
      return false;
    }

    // Check minimum balance
    const fiatBalance = parseFloat(token.fiatBalance);
    if (fiatBalance < minBalanceUsd) {
      return false;
    }

    return true;
  });
}

/**
 * Get the token with the highest fiat balance from a list.
 *
 * @param tokens - Array of convertible tokens
 * @returns The token with highest balance, or undefined if empty
 */
export function getHighestBalanceToken(
  tokens: ConvertibleToken[],
): ConvertibleToken | undefined {
  if (tokens.length === 0) {
    return undefined;
  }

  return tokens.reduce((highest, current) => {
    const currentBalance = parseFloat(current.fiatBalance);
    const highestBalance = parseFloat(highest.fiatBalance);
    return currentBalance > highestBalance ? current : highest;
  });
}

// ============================================================================
// Geo-blocking
// ============================================================================

/**
 * Check if a user's country/region is blocked from accessing mUSD conversion.
 * Uses startsWith matching to support country-region codes (e.g., "GB-ENG").
 *
 * IMPORTANT: Blocks by default when country is unknown/empty for compliance safety.
 *
 * @param userCountry - User's country/region code (e.g., "US", "GB", "US-CA")
 * @param blockedRegions - Array of blocked region codes
 * @returns true if the user is in a blocked region
 */
export function isGeoBlocked(
  userCountry: string | undefined | null,
  blockedRegions: string[],
): boolean {
  // Block by default if country is unknown (fail closed for compliance)
  if (!userCountry || userCountry.trim() === '') {
    return true;
  }

  const normalizedCountry = userCountry.toUpperCase().trim();

  for (const blockedRegion of blockedRegions) {
    const normalizedBlockedRegion = blockedRegion.toUpperCase().trim();

    // Exact match
    if (normalizedCountry === normalizedBlockedRegion) {
      return true;
    }

    // startsWith match for country codes (GB blocks GB-ENG, GB-SCT, etc.)
    // But US-NY should not match US
    if (
      normalizedBlockedRegion.length <= 2 &&
      normalizedCountry.startsWith(`${normalizedBlockedRegion}-`)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if user can access mUSD conversion feature.
 *
 * @param params - Access check parameters
 * @param params.isFeatureEnabled - Whether the feature is enabled
 * @param params.isGeoBlocked - Whether the user is geo-blocked
 * @param params.hasConvertibleTokens - Whether the user has convertible tokens
 * @returns Access check result with reason if denied
 */
export function canUserAccessMusdConversion(params: {
  isFeatureEnabled: boolean;
  isGeoBlocked: boolean;
  hasConvertibleTokens: boolean;
}): AccessCheckResult {
  const {
    isFeatureEnabled,
    isGeoBlocked: isBlocked,
    hasConvertibleTokens,
  } = params;

  // Check feature flag first
  if (!isFeatureEnabled) {
    return { canAccess: false, reason: 'feature_disabled' };
  }

  // Check geo-blocking (higher priority than token check for compliance)
  if (isBlocked) {
    return { canAccess: false, reason: 'geo_blocked' };
  }

  // Check if user has convertible tokens
  if (!hasConvertibleTokens) {
    return { canAccess: false, reason: 'no_convertible_tokens' };
  }

  return { canAccess: true };
}

// ============================================================================
// Chain Validation
// ============================================================================

/**
 * Check if a chain ID is supported for mUSD conversion.
 *
 * @param chainId - Chain ID in hex format
 * @param supportedChainIds - Array of supported chain IDs
 * @returns true if the chain is supported
 */
export function isSupportedChainId(
  chainId: string,
  supportedChainIds: string[],
): boolean {
  return supportedChainIds.includes(chainId);
}

/**
 * Validate that source and destination are on the same chain.
 * mUSD conversion must be same-chain (no cross-chain bridging).
 *
 * @param sourceChainId - Source token chain ID
 * @param destinationChainId - Destination chain ID
 * @returns true if chains match
 */
export function isSameChainConversion(
  sourceChainId: string,
  destinationChainId: string,
): boolean {
  return sourceChainId === destinationChainId;
}
