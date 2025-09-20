import buy from './buy';
import home from './home';
import notifications from './notifications';
import swap from './swap';
import nonevm from './nonevm';
import perps from './perps';

import type { Route } from './route';

export type { Route } from './route';

export const routes = new Map<Route['pathname'], Route>();

/**
 * Adds a route to the routes map.
 *
 * @param route - The route to add.
 */
export function addRoute(route: Route) {
  if (process.env.DEBUG) {
    // just making sure all added route `pathname`'s are unique; but only in
    // DEBUG builds, since it's too late to change the routes in prod.
    if (routes.has(route.pathname)) {
      throw new Error(
        `Route with pathname "${route.pathname}" already exists.`,
      );
    }
  }

  routes.set(route.pathname, route);
}

addRoute(buy);
addRoute(home);
addRoute(notifications);
addRoute(swap);
addRoute(nonevm);
addRoute(perps);
