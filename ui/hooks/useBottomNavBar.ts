import { useLocation } from 'react-router-dom';

import { isBottomNavRoute } from '../components/app/bottom-nav-bar/bottom-nav-bar.utils';

/**
 * Returns whether the bottom nav bar should be shown for the current user and route.
 *
 * Two gates must both pass:
 * 1. Current route is one of the bottom-nav routes (Home, Activity, Perps, Swaps).
 * 2. The user is bucketed into the treatment variant by LaunchDarkly.
 */
export function useBottomNavBar(): boolean {
  const { pathname } = useLocation();

  return isBottomNavRoute(pathname);
}
