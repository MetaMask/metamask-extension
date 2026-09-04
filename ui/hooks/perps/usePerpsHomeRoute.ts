import {
  BOTTOM_NAV_AB_TEST_KEY,
  BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
  BOTTOM_NAV_AB_TEST_VARIANTS,
} from '../../../shared/lib/ab-testing/configs/bottom-nav-bar';
import { PERPS_HOME_PAGE_ROUTE } from '../../helpers/constants/routes';
import { useABTest } from '../useABTest';

export const PERPS_HOME_TAB_ROUTE = '/?tab=perps';

/**
 * Returns the Perps home route for the current user: `/perps-home` when the
 * bottom nav bar is enabled, otherwise `/?tab=perps` on the wallet home.
 */
export function usePerpsHomeRoute(): string {
  const { variant } = useABTest(
    BOTTOM_NAV_AB_TEST_KEY,
    BOTTOM_NAV_AB_TEST_VARIANTS,
    BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: false },
  );

  return variant.withBottomNavBar
    ? PERPS_HOME_PAGE_ROUTE
    : PERPS_HOME_TAB_ROUTE;
}
