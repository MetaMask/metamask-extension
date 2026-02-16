/**
 * useMusdCtaVisibility Hook
 *
 * Hook for determining visibility of mUSD conversion CTAs throughout the app.
 * Mirrors the logic from mobile's useMusdCtaVisibility hook.
 *
 * Ported from metamask-mobile:
 * app/components/UI/Earn/hooks/useMusdCtaVisibility.ts
 */

import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  selectIsMusdConversionFlowEnabled,
  selectIsMusdCtaEnabled,
  selectIsMusdTokenListItemCtaEnabled,
  selectIsMusdAssetOverviewCtaEnabled,
  selectMusdCtaTokens,
} from '../../selectors/musd';
import { selectDismissedCtaKeys } from '../../ducks/musd/selectors';
import {
  MUSD_BUYABLE_CHAIN_IDS,
  isMusdSupportedChain,
} from '../../../shared/constants/musd';
import type { WildcardTokenList } from '../../pages/musd-conversion/types';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';
import { useMusdConversionTokens } from './useMusdConversionTokens';

// ============================================================================
// Types
// ============================================================================

/**
 * Variant for the Buy/Get mUSD CTA
 */
export enum BUY_GET_MUSD_CTA_VARIANT {
  BUY = 'buy',
  GET = 'get',
}

/**
 * State returned by shouldShowBuyGetMusdCta
 */
export type BuyGetMusdCtaState =
  | {
      shouldShowCta: false;
      showNetworkIcon: false;
      selectedChainId: null;
      isEmptyWallet: boolean;
      variant: null;
    }
  | {
      shouldShowCta: true;
      showNetworkIcon: boolean;
      selectedChainId: Hex | null;
      isEmptyWallet: boolean;
      variant: BUY_GET_MUSD_CTA_VARIANT;
    };

/**
 * Token info for CTA visibility checks
 */
export type TokenForCta = {
  address: Hex;
  chainId: Hex;
  symbol: string;
};

/**
 * Options for shouldShowBuyGetMusdCta
 */
export type BuyGetCtaOptions = {
  hasConvertibleTokens?: boolean;
  hasMusdBalance?: boolean;
  isEmptyWallet?: boolean;
  selectedChainId?: Hex | null;
  isPopularNetworksFilterActive?: boolean;
};

/**
 * Options for shouldShowTokenListItemCta
 */
export type TokenListItemCtaOptions = {
  hasMusdBalance?: boolean;
};

/**
 * Return type for useMusdCtaVisibility hook
 */
export type UseMusdCtaVisibilityResult = {
  /** Check if Buy/Get mUSD CTA should be shown */
  shouldShowBuyGetMusdCta: (options?: BuyGetCtaOptions) => BuyGetMusdCtaState;
  /** Check if token list item CTA should be shown */
  shouldShowTokenListItemCta: (
    token: TokenForCta,
    options?: TokenListItemCtaOptions,
  ) => boolean;
  /** Check if asset overview CTA should be shown */
  shouldShowAssetOverviewCta: (token: TokenForCta) => boolean;
  /** Check if a token is in the CTA allowlist */
  isTokenWithCta: (symbol: string, chainId?: Hex) => boolean;
  /** Generate CTA key for dismissal tracking */
  getCtaKey: (chainId: Hex, address: Hex) => string;
  /** Whether user is geo-blocked */
  isGeoBlocked: boolean;
  /** Whether geo-blocking check is in progress */
  isGeoBlockingLoading: boolean;
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Default hidden state for Buy/Get CTA
 */
const HIDDEN_BUY_GET_CTA_STATE: BuyGetMusdCtaState = {
  shouldShowCta: false,
  showNetworkIcon: false,
  selectedChainId: null,
  isEmptyWallet: false,
  variant: null,
};

// ============================================================================
// Helper Functions
// ============================================================================

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

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for determining visibility of mUSD conversion CTAs
 *
 * @returns Object with CTA visibility check functions
 */
export function useMusdCtaVisibility(): UseMusdCtaVisibilityResult {
  // Feature flags
  const isMusdConversionFlowEnabled = useSelector(
    selectIsMusdConversionFlowEnabled,
  );
  const isMusdCtaEnabled = useSelector(selectIsMusdCtaEnabled);
  const isMusdTokenListItemCtaEnabled = useSelector(
    selectIsMusdTokenListItemCtaEnabled,
  );
  const isMusdAssetOverviewCtaEnabled = useSelector(
    selectIsMusdAssetOverviewCtaEnabled,
  );
  const ctaTokens = useSelector(selectMusdCtaTokens);

  // Geo-blocking
  const { isBlocked: isGeoBlocked, isLoading: isGeoBlockingLoading } =
    useMusdGeoBlocking();

  // Dismissed CTAs
  const dismissedCtaKeys = useSelector(selectDismissedCtaKeys);

  // Get conversion tokens filtered by allowlist/blocklist AND minimum balance
  // This is the source of truth for which tokens are eligible for conversion
  const { isConversionToken, tokens: conversionTokens } =
    useMusdConversionTokens();

  /**
   * Get tokens that are both:
   * 1. Eligible for conversion (pass allowlist/blocklist + min balance)
   * 2. In the CTA tokens list (which tokens should show CTAs)
   */
  const tokensWithCTAs = useMemo(() => {
    return conversionTokens.filter((token) =>
      isTokenInWildcardList(token.symbol, ctaTokens, token.chainId),
    );
  }, [conversionTokens, ctaTokens]);

  /**
   * Check if a specific token should show a CTA
   * This ensures the token:
   * 1. Passes allowlist/blocklist + minimum balance (via conversionTokens)
   * 2. Is in the CTA tokens list
   */
  const isTokenEligibleForCta = useCallback(
    (token: TokenForCta): boolean => {
      if (!token.address || !token.chainId) {
        return false;
      }

      return tokensWithCTAs.some(
        (ctaToken) =>
          token.address.toLowerCase() === ctaToken.address.toLowerCase() &&
          token.chainId.toLowerCase() === ctaToken.chainId.toLowerCase(),
      );
    },
    [tokensWithCTAs],
  );

  /**
   * Generate CTA dismissal key from chainId and address
   */
  const getCtaKey = useCallback(
    (chainId: Hex, address: Hex): string =>
      `${chainId.toLowerCase()}-${address.toLowerCase()}`,
    [],
  );

  /**
   * Check if a token is in the CTA allowlist
   */
  const isTokenWithCta = useCallback(
    (symbol: string, chainId?: Hex): boolean => {
      return isTokenInWildcardList(symbol, ctaTokens, chainId);
    },
    [ctaTokens],
  );

  /**
   * Check if CTA for a specific token has been dismissed
   */
  const isCtaDismissed = useCallback(
    (chainId: Hex, address: Hex): boolean => {
      const key = getCtaKey(chainId, address);
      return dismissedCtaKeys.includes(key);
    },
    [dismissedCtaKeys, getCtaKey],
  );

  /**
   * Determine Buy/Get mUSD CTA visibility and variant
   */
  const shouldShowBuyGetMusdCta = useCallback(
    (options: BuyGetCtaOptions = {}): BuyGetMusdCtaState => {
      const {
        hasConvertibleTokens = false,
        hasMusdBalance = false,
        isEmptyWallet = false,
        selectedChainId = null,
        isPopularNetworksFilterActive = false,
      } = options;

      // Master feature flag check
      if (!isMusdConversionFlowEnabled || !isMusdCtaEnabled) {
        console.log(
          '[MUSD CTA Debug] BUY/GET BLOCKED: Feature flags disabled',
          {
            isMusdConversionFlowEnabled,
            isMusdCtaEnabled,
          },
        );
        return {
          ...HIDDEN_BUY_GET_CTA_STATE,
          isEmptyWallet,
        };
      }

      // Geo-blocking check
      if (isGeoBlocked) {
        return {
          ...HIDDEN_BUY_GET_CTA_STATE,
          isEmptyWallet,
        };
      }

      // If user already has mUSD, don't show the primary CTA
      if (hasMusdBalance) {
        return {
          ...HIDDEN_BUY_GET_CTA_STATE,
          isEmptyWallet,
        };
      }

      // Determine variant: GET takes priority over BUY
      // GET variant: User has convertible tokens
      if (hasConvertibleTokens) {
        const showNetworkIcon =
          !isPopularNetworksFilterActive && selectedChainId !== null;

        return {
          shouldShowCta: true,
          showNetworkIcon,
          selectedChainId,
          isEmptyWallet,
          variant: BUY_GET_MUSD_CTA_VARIANT.GET,
        };
      }

      console.log('[MUSD CTA Debug] GOT HERE EMPTY WALLET', {
        isEmptyWallet,
        selectedChainId,
      });
      // BUY variant: Empty wallet and mUSD is buyable
      if (isEmptyWallet) {
        // Check if mUSD is buyable on the selected chain
        const isMusdBuyable = selectedChainId
          ? MUSD_BUYABLE_CHAIN_IDS.includes(selectedChainId)
          : MUSD_BUYABLE_CHAIN_IDS.length > 0;

        console.log('[MUSD CTA Debug] BUY variant: Empty wallet', {
          isMusdBuyable,
        });
        if (isMusdBuyable) {
          const showNetworkIcon =
            !isPopularNetworksFilterActive && selectedChainId !== null;

          return {
            shouldShowCta: true,
            showNetworkIcon,
            selectedChainId,
            isEmptyWallet: true,
            variant: BUY_GET_MUSD_CTA_VARIANT.BUY,
          };
        }
      }

      return {
        ...HIDDEN_BUY_GET_CTA_STATE,
        isEmptyWallet,
      };
    },
    [isMusdConversionFlowEnabled, isMusdCtaEnabled, isGeoBlocked],
  );

  /**
   * Determine token list item CTA visibility
   *
   * Key insight from mobile: This CTA only shows when user ALREADY HAS mUSD balance.
   * This encourages additional conversions after initial acquisition.
   */
  const shouldShowTokenListItemCta = useCallback(
    (token: TokenForCta, options: TokenListItemCtaOptions = {}): boolean => {
      const { hasMusdBalance = false } = options;

      // Debug logging
      console.log('[MUSD CTA Debug] shouldShowTokenListItemCta called', {
        token: {
          symbol: token.symbol,
          chainId: token.chainId,
          address: token.address?.slice(0, 10),
        },
        options: { hasMusdBalance },
        flags: {
          isMusdConversionFlowEnabled,
          isMusdTokenListItemCtaEnabled,
          isGeoBlocked,
        },
      });

      // Feature flag check
      if (!isMusdConversionFlowEnabled || !isMusdTokenListItemCtaEnabled) {
        console.log('[MUSD CTA Debug] BLOCKED: Feature flags disabled', {
          isMusdConversionFlowEnabled,
          isMusdTokenListItemCtaEnabled,
        });
        return false;
      }

      // Geo-blocking check
      if (isGeoBlocked) {
        console.log('[MUSD CTA Debug] BLOCKED: Geo-blocked');
        return false;
      }

      // Validate token info
      if (!token.address || !token.chainId) {
        console.log('[MUSD CTA Debug] BLOCKED: Missing token info');
        return false;
      }

      // Chain must support mUSD
      if (!isMusdSupportedChain(token.chainId)) {
        console.log(
          '[MUSD CTA Debug] BLOCKED: Chain not supported',
          token.chainId,
        );
        return false;
      }

      // Token must be eligible for CTA (in CTA allowlist AND passes min balance + conversion allowlist)
      // This is the key check that ensures tokens below minimum balance don't show CTAs
      if (!isTokenEligibleForCta(token)) {
        console.log(
          '[MUSD CTA Debug] BLOCKED: Token not eligible for CTA (failed allowlist/min balance check)',
          token.symbol,
        );
        return false;
      }

      // User must have mUSD balance for secondary CTA
      // (This is different from primary CTA which shows when user does NOT have mUSD)
      console.log(
        '[MUSD CTA Debug] RESULT:',
        hasMusdBalance ? 'SHOW' : 'BLOCKED (no mUSD balance)',
      );
      return hasMusdBalance;
    },
    [
      isMusdConversionFlowEnabled,
      isMusdTokenListItemCtaEnabled,
      isGeoBlocked,
      isTokenEligibleForCta,
    ],
  );

  /**
   * Determine asset overview CTA visibility
   */
  const shouldShowAssetOverviewCta = useCallback(
    (token: TokenForCta): boolean => {
      // Feature flag check
      if (!isMusdConversionFlowEnabled || !isMusdAssetOverviewCtaEnabled) {
        return false;
      }

      // Geo-blocking check
      if (isGeoBlocked) {
        return false;
      }

      // Validate token info
      if (!token.address || !token.chainId) {
        return false;
      }

      // Check if dismissed
      if (isCtaDismissed(token.chainId, token.address)) {
        return false;
      }

      // Chain must support mUSD
      if (!isMusdSupportedChain(token.chainId)) {
        return false;
      }

      // Token must be eligible for CTA (in CTA allowlist AND passes min balance + conversion allowlist)
      return isTokenEligibleForCta(token);
    },
    [
      isMusdConversionFlowEnabled,
      isMusdAssetOverviewCtaEnabled,
      isGeoBlocked,
      isCtaDismissed,
      isTokenEligibleForCta,
    ],
  );

  return useMemo(
    () => ({
      shouldShowBuyGetMusdCta,
      shouldShowTokenListItemCta,
      shouldShowAssetOverviewCta,
      isTokenWithCta,
      getCtaKey,
      isGeoBlocked,
      isGeoBlockingLoading,
    }),
    [
      shouldShowBuyGetMusdCta,
      shouldShowTokenListItemCta,
      shouldShowAssetOverviewCta,
      isTokenWithCta,
      getCtaKey,
      isGeoBlocked,
      isGeoBlockingLoading,
    ],
  );
}

export default useMusdCtaVisibility;
