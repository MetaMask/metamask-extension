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
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { parseRampIntent } from './parse-ramp-intent';

/**
 * Entry page for `/buy` deep links when the unified buy feature is enabled.
 *
 * The deep link router lands the user here with the original query params.
 * The params are mapped to a buy intent and handed to the shared
 * `goToBuy` navigation chain, which applies the same eligibility gating and
 * token preselection as the in-app Buy buttons (service disruption,
 * geolocation, region and catalog checks) before opening the buy flow.
 *
 * If no navigation is possible, the user is taken to the wallet home page;
 * any eligibility modal is still displayed by the global modal manager.
 *
 * @returns The loading page shown while the buy flow is being resolved.
 */
export function BuyDeepLinkEntry() {
  const location = useLocation();
  const navigate = useNavigate();
  const { goToBuy } = useRampsNavigation();
  const hasInitiatedRef = useRef(false);

  useEffect(() => {
    if (hasInitiatedRef.current) {
      return;
    }
    hasInitiatedRef.current = true;

    const params: Record<string, string> = {};
    new URLSearchParams(location.search).forEach((value, key) => {
      params[key] = value;
    });
    const intent = parseRampIntent(params);

    goToBuy(intent ? { assetId: intent.assetId } : undefined)
      .then((didNavigate) => {
        if (!didNavigate) {
          navigate(DEFAULT_ROUTE, { replace: true });
        }
      })
      .catch(() => navigate(DEFAULT_ROUTE, { replace: true }));
  }, [goToBuy, navigate, location.search]);

  return (
    <Box
      className="flex-1"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      data-testid="ramps-buy-deeplink-entry-loading"
    >
      <Spinner className="h-8 w-8" />
    </Box>
  );
}
