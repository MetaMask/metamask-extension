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
 * The deep link router lands the user here with the original query params.
 * When the in-app buy flow is available for this user, the params are mapped
 * to a buy intent and handed to the shared `goToBuy` navigation chain, which
 * applies the same eligibility gating and token preselection as the in-app
 * Buy buttons. When Buy leaves the extension instead (the Portfolio fallback),
 * the legacy behavior is preserved: the deep link params are forwarded
 * verbatim to the Portfolio web app in a new tab.
 *
 * If no navigation is possible, the user is taken to the wallet home page;
 * any eligibility modal is still displayed by the global modal manager.
 *
 * @returns The loading page shown while the buy flow is being resolved.
 */
export function BuyDeepLinkEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { goToBuy, opensBuyInPortfolioTab } = useRampsNavigation();
  const hasInitiatedRef = useRef(false);

  useEffect(() => {
    if (hasInitiatedRef.current) {
      return;
    }
    hasInitiatedRef.current = true;

    // `goToBuy` resolves asynchronously; a navigation that lands after this
    // page unmounts must be dropped (React Router warns otherwise).
    let isCancelled = false;

    const searchParams = new URLSearchParams(location.search);
    const params: Record<string, string | undefined> = {
      address: searchParams.get('address') ?? undefined,
      chainId: searchParams.get('chainId') ?? undefined,
      assetId: searchParams.get('assetId') ?? undefined,
      amount: searchParams.get('amount') ?? undefined,
      currency: searchParams.get('currency') ?? undefined,
    };

    if (opensBuyInPortfolioTab) {
      // Legacy redirect: forward the deep link params verbatim (the pre-UB2
      // `/buy` behavior), then send this tab home. Portfolio handles token
      // and amount preselection on its side.
      //
      // Note: this intentionally does NOT reuse `openBuyCryptoInPdapp` (the
      // `goToBuy` Portfolio path) — that builder drops the link's token and
      // amount params and appends analytics params instead, which would break
      // deep link param preservation.
      const { redirectTo } = getBuyPortfolioRedirectDestination(
        new URLSearchParams(location.search),
      );
      global.platform.openTab({ url: redirectTo.toString() });
      navigate(DEFAULT_ROUTE, { replace: true });
      return;
    }

    const intent = parseRampIntent(params);

    goToBuy(
      intent ? { assetId: intent.assetId, chainId: intent.chainId } : undefined,
    )
      .then((didNavigate) => {
        // No navigation was possible (an eligibility modal was shown instead).
        if (!isCancelled && !didNavigate) {
          navigate(DEFAULT_ROUTE, { replace: true });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          navigate(DEFAULT_ROUTE, { replace: true });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [goToBuy, navigate, opensBuyInPortfolioTab, location.search]);

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
