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
import { getBuyPortfolioRedirectDestination } from '../../../../shared/lib/deep-links/routes/buy';
import { parseRampIntent } from './parse-ramp-intent';

/**
 * Entry page for `/buy` deep links when the unified buy feature is enabled:
 * maps the params to a buy intent and hands it to the shared `goToBuy` gate
 * (same eligibility gating and token preselection as the in-app Buy
 * buttons), keeping the deep link params on any Portfolio redirect. Falls
 * back to the wallet home page when no navigation is possible; eligibility
 * modals are displayed by the global modal manager.
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
      .then((result) => {
        // `'native'`: the in-app buy flow navigated. Anything else ends this
        // page: `false` means an eligibility modal was shown instead, and
        // `'portfolio'` means the buy opened outside the extension (flag off,
        // or the one-time Portfolio order migration) — without this, the
        // spinner would spin forever.
        if (result !== 'native') {
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
