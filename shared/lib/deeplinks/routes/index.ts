import home from './home';
import swap from './swap';

import type { Route } from './route.type';

export type { Route } from './route.type';

export const routes = new Map<Route['pathname'], Route>();

function addRoute(route: Route) {
  routes.set(route.pathname, route);
}
addRoute(home);
addRoute(swap);
