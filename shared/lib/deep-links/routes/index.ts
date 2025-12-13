import buy from './buy';
import home from './home';
import notifications from './notifications';
import swap from './swap';
import nonevm from './nonevm';
import perps from './perps';
import predict from './predict';
import rewards from './rewards';
import settings from './settings';

import type { Route } from './route';
import shield from './shield';

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

if (process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS || process.env.IN_TEST) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
  addRoute(require('./test-route').default);
}

addRoute(buy);
addRoute(home);
addRoute(notifications);
addRoute(swap);
addRoute(nonevm);
addRoute(perps);
addRoute(predict);
addRoute(rewards);
addRoute(shield);
addRoute(settings);
