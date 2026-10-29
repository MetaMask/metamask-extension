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
  selectIsMusdTokenListItemCtaEnabled,
  selectIsMusdAssetOverviewCtaEnabled,
  selectMusdCtaTokens,
  selectMusdConversionDismissedCtaKeys,
} from '../../selectors/musd';
import { isMusdSupportedChain } from '../../components/app/musd/constants';
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
 * Token info for CTA visibility checks
 */
export type TokenForCta = {
  address: Hex;
  chainId: Hex;
  symbol: string;
};

/**
 * Return type for useMusdCtaVisibility hook
 */
export type UseMusdCtaVisibilityResult = {
  /** Check if token list item CTA should be shown */
  shouldShowTokenListItemCta: (token: TokenForCta) => boolean;
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
   * Determine token list item CTA visibility
   *
   * Shown for any conversion-eligible token, regardless of whether the user
   * already holds mUSD, so the token list is the single entry point into the
   * conversion flow.
   */
  const shouldShowTokenListItemCta = useCallback(
    (token: TokenForCta): boolean => {
      // Feature flag check
      if (!isMusdConversionFlowEnabled || !isMusdTokenListItemCtaEnabled) {
        return false;
      }

      // Hide while geo check is in progress to avoid showing a CTA the user cannot act on
      if (isGeoBlockingLoading || isGeoBlocked) {
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
      return isTokenEligibleForCta(token);
    },
    [
      isMusdConversionFlowEnabled,
      isMusdTokenListItemCtaEnabled,
      isGeoBlockingLoading,
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

      // Hide while geo check is in progress to avoid showing a CTA the user cannot act on
      if (isGeoBlockingLoading || isGeoBlocked) {
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
      isGeoBlockingLoading,
      isGeoBlocked,
      isCtaDismissed,
      isTokenEligibleForCta,
    ],
  );

  return useMemo(
    () => ({
      shouldShowTokenListItemCta,
      shouldShowAssetOverviewCta,
      isTokenWithCta,
      getCtaKey,
      isGeoBlocked,
      isGeoBlockingLoading,
    }),
    [
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
