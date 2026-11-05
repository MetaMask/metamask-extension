import { useLocation } from 'react-router-dom';
import { isMainNavRoute } from '../helpers/utils/main-nav';
import { useFullScreenDesign } from './useFullScreenDesign';

export type MainNavBars = {
  hasNavBar: boolean;
  showSideNav: boolean;
  showBottomNav: boolean;
};

/**
 * Returns which main navigation to show for the current route: the side nav in
 * the fullscreen design, the bottom nav bar otherwise, and neither outside the
 * main nav routes.
 *
 * @returns Whether the route has a nav bar, and which one to show.
 */
export function useMainNavBars(): MainNavBars {
  const { pathname } = useLocation();
  const isFullScreenDesign = useFullScreenDesign();
  const hasNavBar = isMainNavRoute(pathname);

  return {
    hasNavBar,
    showSideNav: hasNavBar && isFullScreenDesign,
    showBottomNav: hasNavBar && !isFullScreenDesign,
  };
}
