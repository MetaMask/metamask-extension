import {
  BOTTOM_NAV_AB_TEST_KEY,
  BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
  BOTTOM_NAV_AB_TEST_VARIANTS,
} from '../../../shared/lib/ab-testing/configs/bottom-nav-bar';
import { PERPS_ROUTE } from '../../helpers/constants/routes';
import { useABTest } from '../useABTest';

export const PERPS_HOME_TAB_ROUTE = '/?tab=perps';

/**
 * Returns the Perps home route for the current user: `/perps` when the
 * bottom nav bar is enabled or the assignment is unresolved, otherwise
 * `/?tab=perps` on the wallet home.
 */
export function usePerpsHomeRoute(): string {
  const { variant, isActive } = useABTest(
    BOTTOM_NAV_AB_TEST_KEY,
    BOTTOM_NAV_AB_TEST_VARIANTS,
    BOTTOM_NAV_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: false },
  );

  // Stay on /perps until the assignment exists. The control fallback is only
  // for a resolved control bucket.
  if (!isActive || variant.withBottomNavBar) {
    return PERPS_ROUTE;
  }

  return PERPS_HOME_TAB_ROUTE;
}
