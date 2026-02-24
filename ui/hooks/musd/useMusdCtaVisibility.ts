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
  selectMusdConversionDismissedCtaKeys,
} from '../../selectors/musd';
import {
  MUSD_BUYABLE_CHAIN_IDS,
  isMusdSupportedChain,
} from '../../components/app/musd/constants';
import { isTokenInWildcardList } from '../../components/app/musd/utils/token-allowlist';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';
import { useMusdConversionTokens } from './useMusdConversionTokens';

export {
  isTokenInWildcardList,
  checkTokenAllowed,
} from '../../components/app/musd/utils/token-allowlist';

// ============================================================================
// Types
// ============================================================================

/**
 * Variant for the Buy/Get mUSD CTA
 */
export enum BuyGetMusdCtaVariant {
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
      variant: BuyGetMusdCtaVariant;
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
  const dismissedCtaKeys = useSelector(selectMusdConversionDismissedCtaKeys);

  // Get conversion tokens filtered by allowlist/blocklist AND minimum balance
  // This is the source of truth for which tokens are eligible for conversion
  const { tokens: conversionTokens } = useMusdConversionTokens();

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
          variant: BuyGetMusdCtaVariant.GET,
        };
      }

      // BUY variant: Empty wallet and mUSD is buyable
      if (isEmptyWallet) {
        // Check if mUSD is buyable on the selected chain
        const isMusdBuyable = selectedChainId
          ? MUSD_BUYABLE_CHAIN_IDS.includes(selectedChainId)
          : MUSD_BUYABLE_CHAIN_IDS.length > 0;

        if (isMusdBuyable) {
          const showNetworkIcon =
            !isPopularNetworksFilterActive && selectedChainId !== null;

          return {
            shouldShowCta: true,
            showNetworkIcon,
            selectedChainId,
            isEmptyWallet: true,
            variant: BuyGetMusdCtaVariant.BUY,
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

      // Feature flag check
      if (!isMusdConversionFlowEnabled || !isMusdTokenListItemCtaEnabled) {
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

      // Chain must support mUSD
      if (!isMusdSupportedChain(token.chainId)) {
        return false;
      }

      // Token must be eligible for CTA (in CTA allowlist AND passes min balance + conversion allowlist)
      // This is the key check that ensures tokens below minimum balance don't show CTAs
      if (!isTokenEligibleForCta(token)) {
        return false;
      }

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
