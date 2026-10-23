import { PERPS_HOME_PAGE_ROUTE } from '../../helpers/constants/routes';

export const PERPS_HOME_TAB_ROUTE = '/?tab=perps';

/**
 * Returns the Perps home route for the current user: `/perps-home` when the
 * bottom nav bar is enabled, otherwise `/?tab=perps` on the wallet home.
 */
export function usePerpsHomeRoute(): string {
  return PERPS_HOME_PAGE_ROUTE;
}
