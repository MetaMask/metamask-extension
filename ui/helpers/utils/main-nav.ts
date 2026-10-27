import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../constants/routes';

export type ActiveNavItems = {
  isHome: boolean;
  isPerps: boolean;
  isMoney: boolean;
  isActivity: boolean;
};

/**
 * Returns the active state of each nav item based on the pathname.
 *
 * @param pathname - The current location pathname.
 */
export const getActiveNavItems = (pathname: string): ActiveNavItems => {
  return {
    isHome: pathname === DEFAULT_ROUTE,
    isPerps: pathname === PERPS_HOME_PAGE_ROUTE,
    isMoney: pathname === MONEY_HOME_ROUTE,
    isActivity: pathname === ACTIVITY_ROUTE,
  };
};

/**
 * Returns true when the pathname corresponds to one of the main nav items
 * (Home, Perps, Money, Activity).
 *
 * @param pathname - The current location pathname.
 */
export const isMainNavRoute = (pathname: string): boolean => {
  const activeNavItems = getActiveNavItems(pathname);
  return Object.values(activeNavItems).some(Boolean);
};
