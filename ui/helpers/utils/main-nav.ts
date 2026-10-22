import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  MONEY_ACTIVITY_ROUTE,
  MONEY_EARN_ROUTE,
  MONEY_HOME_ROUTE,
  MONEY_HOW_IT_WORKS_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
  PERPS_MARKET_ROUTE,
  PERPS_MARKET_DETAILS_ROUTE,
  PERPS_ORDER_ENTRY_ROUTE,
  PERPS_ACTIVITY_ROUTE,
  PERPS_TRANSACTION_DETAILS_ROUTE,
  PERPS_WITHDRAW_ROUTE,
  PERPS_ROUTE,
} from '../constants/routes';

export type ActiveNavItems = {
  isHome: boolean;
  isPerps: boolean;
  isMoney: boolean;
  isActivity: boolean;
};

enum MainNavRoutes {
  HOME = DEFAULT_ROUTE,
  PERPS = PERPS_HOME_PAGE_ROUTE,
  MONEY = MONEY_HOME_ROUTE,
  ACTIVITY = ACTIVITY_ROUTE,
}

/**
 * Returns the active state of each nav item based on the pathname.
 *
 * @param pathname - The current location pathname.
 */
export const getActiveNavItems = (pathname: string): ActiveNavItems => {
  return {
    isHome: pathname === DEFAULT_ROUTE,
    isPerps:
      pathname === PERPS_HOME_PAGE_ROUTE ||
      pathname === PERPS_ROUTE ||
      pathname === PERPS_MARKET_LIST_ROUTE ||
      pathname === PERPS_MARKET_ROUTE ||
      pathname === PERPS_MARKET_DETAILS_ROUTE ||
      pathname === PERPS_ORDER_ENTRY_ROUTE ||
      pathname === PERPS_ACTIVITY_ROUTE ||
      pathname === PERPS_TRANSACTION_DETAILS_ROUTE ||
      pathname === PERPS_WITHDRAW_ROUTE ||
      pathname.startsWith(`${PERPS_ROUTE}/`),
    isMoney:
      pathname === MONEY_HOME_ROUTE ||
      pathname === MONEY_ACTIVITY_ROUTE ||
      pathname === MONEY_HOW_IT_WORKS_ROUTE ||
      pathname === MONEY_EARN_ROUTE ||
      pathname.startsWith(`${MONEY_ACTIVITY_ROUTE}/`),
    isActivity: pathname === ACTIVITY_ROUTE,
  };
};



/**
 * Returns true when the pathname corresponds to one of the MainNavRoutes.
 *
 * @param pathname - The current location pathname.
 */
export const isBottomOrSideNavRoute = (pathname: string): boolean => {
  return pathname in MainNavRoutes;
};

export const isSideNavRoute = (pathname: string): boolean => {
  const activeNavItems = getActiveNavItems(pathname);
  return Object.values(activeNavItems).some(Boolean);
};
