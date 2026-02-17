///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
/**
 * useMusdConversionTokenFilter Hook
 *
 * Hook for filtering tokens to only show those eligible for mUSD conversion.
 * Filters tokens based on:
 * - Supported chains (MUSD_BUYABLE_CHAIN_IDS)
 * - Allowlist and blocklist from feature flags
 * - Minimum balance requirements
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdConversionTokens.ts
 */

import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  selectMusdConvertibleTokensAllowlist,
  selectMusdConvertibleTokensBlocklist,
  selectMusdMinAssetBalanceRequired,
} from '../../../../selectors/musd';
import { MUSD_BUYABLE_CHAIN_IDS } from '../../../../../shared/constants/musd';
import { isTokenInWildcardList } from '../../../../hooks/musd';
import { type Asset, AssetStandard } from '../../types/send';
import type { WildcardTokenList } from '../../../musd-conversion/types';

/**
 * Type for the token filter function
 */
export type TokenFilterFn = (tokens: Asset[]) => Asset[];

/**
 * Return type for useMusdConversionTokenFilter hook
 */
export type UseMusdConversionTokenFilterResult = {
  /** Filter function that filters tokens to only mUSD-eligible ones */
  filterTokens: TokenFilterFn;
  /** Check if a single token is allowed for mUSD conversion */
  isTokenAllowed: (token: Asset) => boolean;
};

/**
 * Check if a token is allowed based on allowlist and blocklist
 *
 * @param symbol - Token symbol
 * @param allowlist - Allowlist from feature flags
 * @param blocklist - Blocklist from feature flags
 * @param chainId - Chain ID of the token
 * @returns true if token is allowed
 */
function checkTokenAllowed(
  symbol: string,
  allowlist: WildcardTokenList,
  blocklist: WildcardTokenList,
  chainId?: string,
): boolean {
  if (!chainId || !symbol) {
    return false;
  }

  // Step 1: If allowlist is non-empty, token must be in it
  const hasAllowlist = Object.keys(allowlist).length > 0;
  if (hasAllowlist) {
    const isInAllowlist = isTokenInWildcardList(symbol, allowlist, chainId);
    if (!isInAllowlist) {
      return false;
    }
  }

  // Step 2: If blocklist is non-empty, token must NOT be in it
  const hasBlocklist = Object.keys(blocklist).length > 0;
  if (hasBlocklist) {
    const isInBlocklist = isTokenInWildcardList(symbol, blocklist, chainId);
    if (isInBlocklist) {
      return false;
    }
  }

  return true;
}

/**
 * Hook for filtering tokens to only those eligible for mUSD conversion
 *
 * @returns Object with filter function and token check function
 */
export function useMusdConversionTokenFilter(): UseMusdConversionTokenFilterResult {
  // Get allowlist/blocklist from remote feature flags
  const allowlist = useSelector(selectMusdConvertibleTokensAllowlist);
  const blocklist = useSelector(selectMusdConvertibleTokensBlocklist);
  const minBalance = useSelector(selectMusdMinAssetBalanceRequired);

  /**
   * Check if a single token is allowed for mUSD conversion
   */
  const isTokenAllowed = useCallback(
    (token: Asset): boolean => {
      // Must have required fields
      if (!token.symbol || !token.chainId) {
        return false;
      }

      const chainIdStr = String(token.chainId);

      // Must be on a supported chain
      if (!MUSD_BUYABLE_CHAIN_IDS.includes(chainIdStr as `0x${string}`)) {
        return false;
      }

      // Check minimum balance (fiat balance)
      const fiatBalance = token.fiat?.balance;
      if (fiatBalance === undefined || fiatBalance === null) {
        return false;
      }
      if (fiatBalance < minBalance) {
        return false;
      }

      // Check allowlist/blocklist
      return checkTokenAllowed(token.symbol, allowlist, blocklist, chainIdStr);
    },
    [allowlist, blocklist, minBalance],
  );

  /**
   * Filter function that filters tokens to only mUSD-eligible ones
   */
  const filterTokens = useCallback(
    (tokens: Asset[]): Asset[] => {
      return tokens.filter((token) => {
        // Skip non-ERC20 tokens (if standard is defined)
        if (token.standard && token.standard !== AssetStandard.ERC20) {
          return false;
        }

        return isTokenAllowed(token);
      });
    },
    [isTokenAllowed],
  );

  return {
    filterTokens,
    isTokenAllowed,
  };
}

export default useMusdConversionTokenFilter;
///: END:ONLY_INCLUDE_IF
