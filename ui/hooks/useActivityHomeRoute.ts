import {
  BOTTOM_NAV_AB_TEST_KEY,
  BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
  BOTTOM_NAV_AB_TEST_VARIANTS,
} from '../../shared/lib/ab-testing/configs/bottom-nav-bar';
import { ACTIVITY_ROUTE, DEFAULT_ROUTE } from '../helpers/constants/routes';
import { useABTest } from './useABTest';

export const ACTIVITY_TAB_ROUTE = `${DEFAULT_ROUTE}?tab=activity`;

/**
 * Returns the Activity home route for the current user: `/activity` when the
 * bottom nav bar is enabled, otherwise `/?tab=activity` on the wallet home.
 */
export function useActivityHomeRoute(): string {
  const { variant } = useABTest(
    BOTTOM_NAV_AB_TEST_KEY,
    BOTTOM_NAV_AB_TEST_VARIANTS,
    BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: false },
  );

  return variant.withBottomNavBar ? ACTIVITY_ROUTE : ACTIVITY_TAB_ROUTE;
}
