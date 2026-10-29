import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { getBuyPortfolioRedirectDestination } from '../../../../shared/lib/deep-links/routes/buy';
import { getIsRampsEnabled } from '../../../selectors/ramps-feature-flags';

/**
 * Public gate for `/buy` deep links. While the ramps rollout flag is off, it
 * keeps the legacy behavior: redirect to Portfolio without requiring the
 * wallet to be unlocked. Fullscreen tabs (where deep links land) are replaced
 * so the link does not leave an extra wallet tab; popups, side panels and
 * notification windows open Portfolio in a new tab so the wallet stays open.
 * When the flag is on, it falls through to the authenticated entry page.
 *
 * @returns The nested routes, or null while the legacy redirect runs.
 */
export function BuyDeepLinkGate() {
  const isRampsEnabled = useSelector(getIsRampsEnabled);
  const location = useLocation();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (isRampsEnabled || hasRedirectedRef.current) {
      return;
    }
    hasRedirectedRef.current = true;
    const { redirectTo } = getBuyPortfolioRedirectDestination(
      new URLSearchParams(location.search),
    );
    if (getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN) {
      window.location.replace(redirectTo.toString());
    } else {
      global.platform.openTab({ url: redirectTo.toString() });
    }
  }, [isRampsEnabled, location.search]);

  if (!isRampsEnabled) {
    return null;
  }

  return <Outlet />;
}
