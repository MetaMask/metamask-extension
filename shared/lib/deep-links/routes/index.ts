import home from './home';
import swap from './swap';
import notifications from './notifications';

import type { Route } from './route.type';

export type { Route } from './route.type';

export const routes = new Map<Route['pathname'], Route>();

/**
 * Adds a route to the routes map.
 *
 * @param route - The route to add.
 */
function addRoute(route: Route) {
  routes.set(route.pathname, route);
}

addRoute(home);
addRoute(swap);
addRoute(notifications);
