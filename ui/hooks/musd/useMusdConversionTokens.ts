/**
 * useMusdConversionTokens Hook
 *
 * The source of truth for the tokens that are eligible for mUSD conversion.
 * Filters tokens based on allowlist/blocklist rules AND minimum balance requirements.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdConversionTokens.ts
 */

import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import {
  selectMusdConvertibleTokensAllowlist,
  selectMusdConvertibleTokensBlocklist,
  selectMusdMinAssetBalanceRequired,
} from '../../selectors/musd';
import {
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
  MUSD_BUYABLE_CHAIN_IDS,
} from '../../../shared/constants/musd';
import {
  getTokenBalancesEvm,
  getAssetsBySelectedAccountGroup,
} from '../../selectors/assets';
import {
  getIsMultichainAccountsState2Enabled,
  getSelectedAccount,
} from '../../selectors';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';
import type { WildcardTokenList } from '../../pages/musd-conversion/types';
import { isTokenInWildcardList } from './useMusdCtaVisibility';

// ============================================================================
// Types
// ============================================================================

/**
 * Token type that can be used with this hook
 */
export type ConversionToken = {
  address: string;
  chainId: string;
  symbol: string;
  fiat?: { balance?: number | null };
  tokenFiatAmount?: number | null;
};

/**
 * Return type for useMusdConversionTokens hook
 */
export type UseMusdConversionTokensResult = {
  /** Filter function that filters tokens to only mUSD-eligible ones */
  filterAllowedTokens: <T extends ConversionToken>(tokens: T[]) => T[];
  /** Check if a specific token is eligible for mUSD conversion */
  isConversionToken: (token?: ConversionToken) => boolean;
  /** Check if mUSD is supported on a given chain */
  isMusdSupportedOnChain: (chainId?: string) => boolean;
  /** Check if there are convertible tokens on a given chain */
  hasConvertibleTokensByChainId: (chainId: Hex) => boolean;
  /** The tokens that are eligible for mUSD conversion */
  tokens: TokenWithFiatAmount[];
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely format a chain ID to hex format
 *
 * @param chainId
 */
function safeFormatChainIdToHex(chainId: string | number | undefined): Hex {
  if (!chainId) {
    return '0x0' as Hex;
  }
  if (typeof chainId === 'string' && chainId.startsWith('0x')) {
    return chainId.toLowerCase() as Hex;
  }
  return toHex(chainId) as Hex;
}

/**
 * Get fiat balance from a token, handling different property names
 *
 * @param token
 */
function getTokenFiatBalance(token: ConversionToken): number | null {
  // Try tokenFiatAmount first (extension format)
  if (token.tokenFiatAmount !== undefined && token.tokenFiatAmount !== null) {
    return token.tokenFiatAmount;
  }
  // Try fiat.balance (mobile format)
  if (token.fiat?.balance !== undefined && token.fiat?.balance !== null) {
    return token.fiat.balance;
  }
  return null;
}

/**
 * Check if a token is allowed based on allowlist and blocklist
 *
 * Logic:
 * 1. If allowlist is non-empty, token MUST be in allowlist
 * 2. If blocklist is non-empty, token must NOT be in blocklist
 * 3. Both conditions must pass for the token to be allowed
 *
 * @param tokenSymbol
 * @param allowlist
 * @param blocklist
 * @param chainId
 */
function checkTokenAllowed(
  tokenSymbol: string,
  allowlist: WildcardTokenList,
  blocklist: WildcardTokenList,
  chainId?: string,
): boolean {
  if (!chainId || !tokenSymbol) {
    return false;
  }

  // Step 1: If allowlist is non-empty, token must be in it
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

  // Step 2: If blocklist is non-empty, token must NOT be in it
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

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * The source of truth for the tokens that are eligible for mUSD conversion.
 *
 * @returns Object containing:
 * - filterAllowedTokens(tokens): Filters tokens based on allowlist/blocklist and min balance.
 * - isConversionToken(token): Checks if a token is eligible for mUSD conversion.
 * - isMusdSupportedOnChain(chainId): Checks if mUSD is supported on a given chain.
 * - hasConvertibleTokensByChainId(chainId): Checks if there are convertible tokens on a given chain.
 * - tokens: The tokens that are eligible for mUSD conversion.
 */
export function useMusdConversionTokens(): UseMusdConversionTokensResult {
  // Get feature flag values
  const allowlist = useSelector(selectMusdConvertibleTokensAllowlist);
  const blocklist = useSelector(selectMusdConvertibleTokensBlocklist);
  const minAssetBalanceRequired = useSelector(
    selectMusdMinAssetBalanceRequired,
  );

  // Get account tokens
  const selectedAccount = useSelector(getSelectedAccount);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  // Get tokens using the appropriate selector
  const evmBalances = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount?.address ?? ''),
  );
  const accountGroupAssets = useSelector(getAssetsBySelectedAccountGroup);

  // Get all account tokens
  const allTokens = useMemo((): TokenWithFiatAmount[] => {
    if (isMultichainAccountsState2Enabled) {
      // Flatten account group assets into array
      return Object.entries(accountGroupAssets).flatMap(
        ([chainId, assets]) =>
          (assets as TokenWithFiatAmount[]).map((asset) => ({
            ...asset,
            chainId: chainId as Hex,
            tokenFiatAmount: asset.fiat?.balance ?? asset.tokenFiatAmount,
          })) ?? [],
      );
    }
    // Use EVM balances for legacy mode
    return evmBalances ?? [];
  }, [isMultichainAccountsState2Enabled, accountGroupAssets, evmBalances]);

  /**
   * Filter tokens with minimum balance requirement
   * Uses plain number comparison (same as useMusdConversionTokenFilter and shared validation).
   */
  const filterTokensWithMinBalance = useCallback(
    <T extends ConversionToken>(token: T): boolean => {
      const fiatBalance = getTokenFiatBalance(token);

      // Can't use truthiness checks here, because `0` is valid when threshold is '0'
      if (fiatBalance === undefined || fiatBalance === null) {
        return false;
      }

      const num = Number(fiatBalance);
      if (!Number.isFinite(num)) {
        return false;
      }

      return num >= minAssetBalanceRequired;
    },
    [minAssetBalanceRequired],
  );

  /**
   * Filter tokens with allowlist and blocklist
   */
  const filterTokensWithAllowlistAndBlocklist = useCallback(
    <T extends ConversionToken>(token: T): boolean =>
      checkTokenAllowed(
        token.symbol,
        allowlist as WildcardTokenList,
        blocklist as WildcardTokenList,
        token.chainId,
      ),
    [allowlist, blocklist],
  );

  /**
   * Filter tokens based on allowlist/blocklist and minimum balance
   */
  const filterAllowedTokens = useCallback(
    <T extends ConversionToken>(tokens: T[]): T[] =>
      tokens
        .filter(filterTokensWithAllowlistAndBlocklist)
        .filter(filterTokensWithMinBalance),
    [filterTokensWithAllowlistAndBlocklist, filterTokensWithMinBalance],
  );

  // Get the list of eligible conversion tokens
  const conversionTokens = useMemo(() => {
    try {
      return filterAllowedTokens(allTokens);
    } catch {
      return [];
    }
  }, [allTokens, filterAllowedTokens]);

  console.log('conversionTokens yessier', conversionTokens);
  /**
   * Check if there are convertible tokens on a specific chain
   */
  const hasConvertibleTokensByChainId = useCallback(
    (chainId: Hex): boolean =>
      conversionTokens.some(
        (token) =>
          token.chainId &&
          safeFormatChainIdToHex(token.chainId) ===
            safeFormatChainIdToHex(chainId),
      ),
    [conversionTokens],
  );

  /**
   * Check if a specific token is eligible for mUSD conversion
   */
  const isConversionToken = useCallback(
    (token?: ConversionToken): boolean => {
      if (!token) {
        return false;
      }

      if (!token.chainId) {
        return false;
      }

      const tokenChainId = safeFormatChainIdToHex(token.chainId);

      return conversionTokens.some(
        (musdToken) =>
          token.address.toLowerCase() === musdToken.address.toLowerCase() &&
          musdToken.chainId &&
          safeFormatChainIdToHex(musdToken.chainId) === tokenChainId,
      );
    },
    [conversionTokens],
  );

  /**
   * Check if mUSD is supported on a given chain
   */
  const isMusdSupportedOnChain = useCallback((chainId?: string): boolean => {
    if (!chainId) {
      return false;
    }
    const hexChainId = toHex(chainId);
    return Object.keys(MUSD_TOKEN_ADDRESS_BY_CHAIN).includes(hexChainId);
  }, []);

  return useMemo(
    () => ({
      filterAllowedTokens,
      isConversionToken,
      isMusdSupportedOnChain,
      hasConvertibleTokensByChainId,
      tokens: conversionTokens,
    }),
    [
      filterAllowedTokens,
      isConversionToken,
      isMusdSupportedOnChain,
      hasConvertibleTokensByChainId,
      conversionTokens,
    ],
  );
}

export default useMusdConversionTokens;
