import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import Spinner from '../../../components/ui/spinner';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { getBuyPortfolioRedirectDestination } from '../../../../shared/lib/deep-links/buy-flow';
import { parseRampIntent } from './parse-ramp-intent';

/**
 * Entry page for `/buy` deep links when the unified buy feature is enabled.
 *
 * The router lands the user here with the original query params. The params
 * are mapped to a buy intent and handed to the shared `goToBuy` chain (same
 * eligibility gating and token preselection as the in-app Buy buttons),
 * with the verbatim-params Portfolio URL attached so a Portfolio redirect
 * (the rollout gate off, or the one-time Portfolio order migration) keeps
 * the deep link params instead of dropping them. If no navigation is
 * possible, the user is taken to the wallet home page; any eligibility
 * modal is still displayed by the global modal manager.
 *
 * @returns The loading page shown while the buy flow is being resolved.
 */
export function BuyDeepLinkEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { goToBuy } = useRampsNavigation();
  const hasInitiatedRef = useRef(false);

  // Unmount-only on purpose: `goToBuy`'s identity changes mid-flight, and
  // cancelling on dep changes would strand the user on the spinner. Guards
  // against yanking a user who navigated away. Reset on setup for StrictMode.
  const isCancelledRef = useRef(false);
  useEffect(() => {
    isCancelledRef.current = false;
    return () => {
      isCancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (hasInitiatedRef.current) {
      return;
    }
    hasInitiatedRef.current = true;

    const params = new URLSearchParams(location.search);
    const intent = parseRampIntent(params);

    // Portfolio must receive the deep link params verbatim (the pre-UB2
    // `/buy` behavior) when the buy leaves the extension. Intentionally not
    // `openBuyCryptoInPdapp`: it drops the link's params and appends
    // analytics params.
    const portfolioRedirectUrl =
      getBuyPortfolioRedirectDestination(params).redirectTo.toString();

    const goHome = () => {
      if (!isCancelledRef.current) {
        navigate(DEFAULT_ROUTE, { replace: true });
      }
    };

    // Replace this page in history: it exists only to intercept the deep link,
    // and back-buttoning into it would re-run the interception forever.
    goToBuy(intent, { replace: true, portfolioRedirectUrl })
      .then((didNavigate) => {
        // No navigation was possible (an eligibility modal was shown instead).
        if (!didNavigate) {
          goHome();
        }
      })
      .catch(goHome);
  }, [goToBuy, navigate, location.search]);

  return (
    <Box
      className="flex-1"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      aria-busy="true"
      aria-label={t('loading')}
      data-testid="ramps-buy-deeplink-entry-loading"
    >
      <Spinner className="h-8 w-8" />
    </Box>
  );
}
