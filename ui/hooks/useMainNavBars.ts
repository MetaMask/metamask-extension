import { useLocation } from 'react-router-dom';
import { useAppLayout } from '../contexts/app-layout';
import { isMainNavRoute } from '../helpers/utils/main-nav';

export type MainNavBars = {
  hasNavBar: boolean;
  showSideNav: boolean;
  showBottomNav: boolean;
};

/**
 * Returns which main navigation to show for the current route: the side nav in
 * the wide layout, the bottom nav bar otherwise, and neither outside the main
 * nav routes.
 *
 * @returns Whether the route has a nav bar, and which one to show.
 */
export function useMainNavBars(): MainNavBars {
  const { pathname } = useLocation();
  const { isWideLayout } = useAppLayout();
  const hasNavBar = isMainNavRoute(pathname);

  return {
    hasNavBar,
    showSideNav: hasNavBar && isWideLayout,
    showBottomNav: hasNavBar && !isWideLayout,
  };
}
