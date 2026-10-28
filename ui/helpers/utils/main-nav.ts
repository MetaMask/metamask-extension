import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../constants/routes';

/**
 * Returns true when the pathname corresponds to one of the main nav items
 * (Home, Perps, Money, Activity).
 *
 * @param pathname - The current location pathname.
 */
export const isMainNavRoute = (pathname: string): boolean =>
  [
    DEFAULT_ROUTE,
    PERPS_HOME_PAGE_ROUTE,
    MONEY_HOME_ROUTE,
    ACTIVITY_ROUTE,
  ].includes(pathname);
