import { useLocation } from 'react-router-dom';

import { isBottomNavRoute } from '../components/app/bottom-nav-bar/bottom-nav-bar.utils';

/**
 * Returns whether the bottom nav bar should be shown for the current route.
 */
export function useBottomNavBar(): boolean {
  const { pathname } = useLocation();

  return isBottomNavRoute(pathname);
}
