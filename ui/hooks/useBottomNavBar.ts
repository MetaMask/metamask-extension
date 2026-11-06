import { useLocation } from 'react-router-dom';

import { isMainNavRoute } from '../helpers/utils/main-nav';

/**
 * Returns whether the bottom nav bar should be shown for the current route.
 */
export function useBottomNavBar(): boolean {
  const { pathname } = useLocation();

  return isMainNavRoute(pathname);
}
