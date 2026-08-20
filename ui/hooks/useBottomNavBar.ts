import { useLocation } from 'react-router-dom';

import {
  BOTTOM_NAV_AB_TEST_KEY,
  BOTTOM_NAV_AB_TEST_VARIANTS,
  BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
} from '../../shared/lib/ab-testing/configs/bottom-nav-bar';
import { isBottomNavRoute } from '../components/app/bottom-nav-bar/bottom-nav-bar.utils';
import { useABTest } from './useABTest';

/**
 * Returns whether the bottom nav bar should be shown for the current user and route.
 *
 * Two gates must both pass:
 * 1. Current route is one of the bottom-nav routes (Home, Activity, Perps, Swaps).
 * 2. The user is bucketed into the treatment variant by LaunchDarkly.
 */
export function useBottomNavBar(): boolean {
  const { pathname } = useLocation();

  const isApplicableRoute = isBottomNavRoute(pathname);

  const { variant } = useABTest(
    BOTTOM_NAV_AB_TEST_KEY,
    BOTTOM_NAV_AB_TEST_VARIANTS,
    BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: isApplicableRoute },
  );

  return isApplicableRoute && variant.withBottomNavBar;
}
