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
 * deep link params are forwarded verbatim to Portfolio in a new tab. If no
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

  // Drop navigations that land after unmount (React Router warns). This is
  // unmount-only on purpose: the effect below must not cancel on dependency
  // changes — `goToBuy`'s identity changes mid-flight when the user's
  // region/catalog resolve, and a cancelled in-flight navigation would strand
  // the user on this spinner (the effect re-runs into the `hasInitiatedRef`
  // guard and never re-arms the flag). Resetting on setup keeps this correct
  // under the dev-only StrictMode double-invoke, whose simulated remount runs
  // the cleanup while the ref survives.
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

    const searchParams = new URLSearchParams(location.search);
    const params: Record<string, string | undefined> = {
      address: searchParams.get('address') ?? undefined,
      chainId: searchParams.get('chainId') ?? undefined,
      assetId: searchParams.get('assetId') ?? undefined,
      amount: searchParams.get('amount') ?? undefined,
      currency: searchParams.get('currency') ?? undefined,
    };

    if (opensBuyInPortfolioTab) {
      // Legacy redirect: navigate this tab to Portfolio with the deep link
      // params forwarded verbatim (the pre-UB2 `/buy` behavior, where the
      // deep-link host itself redirected). Intentionally NOT
      // `openBuyCryptoInPdapp` (the `goToBuy` Portfolio path) — that builder
      // drops the link's token/amount params and appends analytics params.
      // Navigating in place (rather than opening a new tab and sending this
      // one home) keeps returning Portfolio buyers from accumulating stray
      // extension tabs they didn't ask for.
      const { redirectTo } = getBuyPortfolioRedirectDestination(
        new URLSearchParams(location.search),
      );
      window.location.href = redirectTo.toString();
      return;
    }

    const intent = parseRampIntent(params);

    // Replace this page in history: it exists only to intercept the deep link,
    // and back-buttoning into it would re-run the interception forever.
    goToBuy(
      intent ? { assetId: intent.assetId, chainId: intent.chainId } : undefined,
      { replace: true },
    )
      .then((didNavigate) => {
        // No navigation was possible (an eligibility modal was shown instead).
        if (!isCancelledRef.current && !didNavigate) {
          navigate(DEFAULT_ROUTE, { replace: true });
        }
      })
      .catch(() => {
        if (!isCancelledRef.current) {
          navigate(DEFAULT_ROUTE, { replace: true });
        }
      });
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
