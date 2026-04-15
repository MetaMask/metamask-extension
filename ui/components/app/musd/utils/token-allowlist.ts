/**
 * mUSD Token Allowlist / Blocklist Utilities
 *
 * Pure helper functions for checking whether a token passes
 * allowlist/blocklist rules defined via remote feature flags.
 *
 * Extracted from useMusdCtaVisibility to break a circular dependency
 * (useMusdConversionTokens <-> useMusdCtaVisibility).
 */

import type { WildcardTokenList } from '../../../../pages/musd/types';

/**
 * Check if a token is in the wildcard token list
 *
 * @param tokenSymbol - Token symbol to check
 * @param wildcardTokenList - Wildcard token list from feature flags
 * @param chainId - Optional chain ID for chain-specific checks
 * @returns true if token is in the list
 */
export function isTokenInWildcardList(
  tokenSymbol: string,
  wildcardTokenList: WildcardTokenList = {},
  chainId?: string,
): boolean {
  const normalizedSymbol = tokenSymbol.toUpperCase();

  // 1. Check global wildcard "*"
  const globalTokenSymbols = wildcardTokenList['*'];
  if (globalTokenSymbols) {
    if (globalTokenSymbols.includes('*')) {
      return true;
    }
    if (
      globalTokenSymbols.map((s) => s.toUpperCase()).includes(normalizedSymbol)
    ) {
      return true;
    }
  }

  // 2. Check chain-specific rules
  if (chainId) {
    const chainTokenSymbols = wildcardTokenList[chainId];
    if (chainTokenSymbols) {
      if (chainTokenSymbols.includes('*')) {
        return true;
      }
      if (
        chainTokenSymbols.map((s) => s.toUpperCase()).includes(normalizedSymbol)
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a token is allowed based on allowlist and blocklist.
 *
 * @param tokenSymbol - Token symbol to check
 * @param allowlist - Allowlist from feature flags
 * @param blocklist - Blocklist from feature flags
 * @param chainId - Chain ID of the token
 * @returns true if token passes allowlist/blocklist rules
 */
export function checkTokenAllowed(
  tokenSymbol: string,
  allowlist: WildcardTokenList,
  blocklist: WildcardTokenList,
  chainId?: string,
): boolean {
  if (!chainId || !tokenSymbol) {
    return false;
  }

  const hasAllowlist = Object.keys(allowlist).length > 0;
  if (hasAllowlist) {
    const isInAllowlist = isTokenInWildcardList(
      tokenSymbol,
      allowlist,
      chainId,
    );
    if (!isInAllowlist) {
      return false;
    }
  }

  const hasBlocklist = Object.keys(blocklist).length > 0;
  if (hasBlocklist) {
    const isInBlocklist = isTokenInWildcardList(
      tokenSymbol,
      blocklist,
      chainId,
    );
    if (isInBlocklist) {
      return false;
    }
  }

  return true;
}
