import { ACTIVITY_ROUTE, DEFAULT_ROUTE } from '../helpers/constants/routes';

export const ACTIVITY_TAB_ROUTE = `${DEFAULT_ROUTE}?tab=activity`;

/**
 * Returns the Activity home route for the current user: `/activity` when the
 * bottom nav bar is enabled, otherwise `/?tab=activity` on the wallet home.
 */
export function useActivityHomeRoute(): string {
  return ACTIVITY_ROUTE;
}
