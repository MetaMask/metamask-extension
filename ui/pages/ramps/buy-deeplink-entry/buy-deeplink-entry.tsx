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
 * Entry page for `/buy` deep links: maps the params to a buy intent and hands
 * it to the shared `goToBuy` gate, keeping the params on any Portfolio
 * redirect.
 *
 * @returns The loading page shown while the buy flow is being resolved.
 */
export function BuyDeepLinkEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { goToBuy } = useRampsNavigation();
  const hasInitiatedRef = useRef(false);

  // Unmount-only: `goToBuy` changes identity mid-flight, and cancelling on
  // dependency changes would strand the user on the spinner.
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

    // Portfolio receives the deep link params verbatim; `openBuyCryptoInPdapp`
    // would drop them and append analytics params.
    const portfolioRedirectUrl =
      getBuyPortfolioRedirectDestination(params).redirectTo.toString();

    const goHome = () => {
      if (!isCancelledRef.current) {
        navigate(DEFAULT_ROUTE, { replace: true });
      }
    };

    // Replace this page in history: it exists only to intercept the deep link.
    goToBuy(intent, { replace: true, portfolioRedirectUrl })
      .then((result) => {
        // `'native'` navigated; `false` showed a modal, and `'portfolio'`
        // opened outside the extension. Both end this page.
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
