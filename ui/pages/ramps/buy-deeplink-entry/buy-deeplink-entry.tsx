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
 * The router lands the user here with the original query params. When the
 * in-app buy flow is available, the params are mapped to a buy intent and
 * handed to the shared `goToBuy` chain (same eligibility gating and token
 * preselection as the in-app Buy buttons). When Buy leaves the extension
 * instead (the Portfolio fallback), the legacy behavior is preserved: the
 * deep link params are forwarded verbatim to Portfolio. If no
 * navigation is possible, the user is taken to the wallet home page; any
 * eligibility modal is still displayed by the global modal manager.
 *
 * @returns The loading page shown while the buy flow is being resolved.
 */
export function BuyDeepLinkEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { goToBuy, opensBuyInPortfolioTab } = useRampsNavigation();
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

    if (opensBuyInPortfolioTab) {
      // Forward the deep link params verbatim (the pre-UB2 `/buy` behavior).
      // Intentionally not `openBuyCryptoInPdapp`: it drops the link's params
      // and appends analytics params.
      const url =
        getBuyPortfolioRedirectDestination(params).redirectTo.toString();
      if (location.key === 'default') {
        // The deep-link tab itself: redirect in place, as `/buy` used to.
        window.location.href = url;
      } else {
        // Reached via an in-app link: keep the wallet open.
        global.platform.openTab({ url });
        navigate(DEFAULT_ROUTE, { replace: true });
      }
      return;
    }

    const intent = parseRampIntent(params);

    const goHome = () => {
      if (!isCancelledRef.current) {
        navigate(DEFAULT_ROUTE, { replace: true });
      }
    };

    // Replace this page in history: it exists only to intercept the deep link,
    // and back-buttoning into it would re-run the interception forever.
    goToBuy(intent, { replace: true })
      .then((didNavigate) => {
        // No navigation was possible (an eligibility modal was shown instead).
        if (!didNavigate) {
          goHome();
        }
      })
      .catch(goHome);
  }, [
    goToBuy,
    navigate,
    opensBuyInPortfolioTab,
    location.search,
    location.key,
  ]);

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
