import { useLocation } from 'react-router-dom';
import { PERPS_EVENT_VALUE } from '../../../shared/constants/perps-events';
import { PERPS_HOME_PAGE_ROUTE } from '../../helpers/constants/routes';

/**
 * Returns the analytics `source` when Perps is shown via the bottom-nav route.
 * Returns `undefined` on all other routes so callers can apply their default.
 */
export function usePerpsBottomNavSource():
  | typeof PERPS_EVENT_VALUE.SOURCE.BOTTOM_NAV_BAR
  | undefined {
  const { pathname } = useLocation();

  return pathname === PERPS_HOME_PAGE_ROUTE
    ? PERPS_EVENT_VALUE.SOURCE.BOTTOM_NAV_BAR
    : undefined;
}
