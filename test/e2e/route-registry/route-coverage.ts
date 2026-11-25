import { matchPath } from 'react-router-dom';
import { NOT_A_SCREEN, type RoutePageObjectRegistry } from './route-registry';

export type RouteCoverageStatus =
  | 'page-object'
  | 'no-page-object'
  | 'not-a-screen'
  | 'unregistered';

export type RouteCoverageEntry = {
  path: string;
  label: string;
  status: RouteCoverageStatus;
  /** Class name of the page object, when there is one. */
  pageObject?: string;
  /** For a screen of a dynamic route, that route's path pattern. */
  parentRoute?: string;
};

type Route = { path: string; label: string };

export type RouteCoverageReport = {
  generatedAt: string;
  summary: {
    totalRoutes: number;
    withPageObject: number;
    withoutPageObject: number;
    notAScreen: number;
    unregistered: number;
    staleEntries: number;
    /** Share of routes that have a page object, not counting non-screens. */
    coveragePercentage: number;
  };
  routes: RouteCoverageEntry[];
  /**
   * Registry paths that are neither in `ROUTES` nor a screen of a dynamic
   * route (renamed or removed routes).
   */
  staleEntries: string[];
};

const byPath = (a: string, b: string): number => {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
};

/**
 * Finds the dynamic route that a registry path is one screen of: the path has
 * no dynamic segments and matches a route with dynamic segments that the
 * registry marks `NOT_A_SCREEN`.
 *
 * @param path - A registry path that is not in the routes.
 * @param routes - The routes to cover.
 * @param registry - Route path → page object, `NOT_A_SCREEN` or `null`.
 * @returns The dynamic route, or `undefined`.
 */
function findParentRoute(
  path: string,
  routes: readonly Route[],
  registry: RoutePageObjectRegistry,
): Route | undefined {
  if (path.includes(':')) {
    return undefined;
  }
  return routes.find(
    (route) =>
      route.path.includes(':') &&
      registry[route.path] === NOT_A_SCREEN &&
      matchPath({ path: route.path, end: true }, path),
  );
}

/**
 * Compares the routes with the page object registry.
 *
 * @param routes - The routes to cover, normally `ROUTES`.
 * @param registry - Route path → page object, `NOT_A_SCREEN` or `null`.
 * @returns Per-route status and stale registry entries, both sorted by path,
 * and a summary. A registry path that is one screen of a dynamic route is
 * reported as a route of its own.
 */
export function getRouteCoverage(
  routes: readonly Route[],
  registry: RoutePageObjectRegistry,
): RouteCoverageReport {
  const routePaths = new Set(routes.map(({ path }) => path));
  const screensOfDynamicRoutes: (Route & { parentRoute?: string })[] = [];
  const staleEntries: string[] = [];
  for (const path of Object.keys(registry)) {
    if (routePaths.has(path)) {
      continue;
    }
    const parentRoute = findParentRoute(path, routes, registry);
    if (parentRoute) {
      screensOfDynamicRoutes.push({
        path,
        label: parentRoute.label,
        parentRoute: parentRoute.path,
      });
    } else {
      staleEntries.push(path);
    }
  }
  staleEntries.sort(byPath);

  const sortedRoutes: (Route & { parentRoute?: string })[] = [
    ...routes,
    ...screensOfDynamicRoutes,
  ].sort((a, b) => byPath(a.path, b.path));
  const entries = sortedRoutes.map(
    ({ path, label, parentRoute }): RouteCoverageEntry => {
      const entry = parentRoute
        ? { path, label, parentRoute }
        : { path, label };
      if (!Object.hasOwn(registry, path)) {
        return { ...entry, status: 'unregistered' };
      }
      const pageObject = registry[path];
      if (pageObject === NOT_A_SCREEN) {
        return { ...entry, status: 'not-a-screen' };
      }
      return pageObject
        ? { ...entry, status: 'page-object', pageObject: pageObject.name }
        : { ...entry, status: 'no-page-object' };
    },
  );
  const count = (status: RouteCoverageStatus) =>
    entries.filter((entry) => entry.status === status).length;
  const withPageObject = count('page-object');
  const notAScreen = count('not-a-screen');
  const screenRoutes = entries.length - notAScreen;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRoutes: entries.length,
      withPageObject,
      withoutPageObject: count('no-page-object'),
      notAScreen,
      unregistered: count('unregistered'),
      staleEntries: staleEntries.length,
      coveragePercentage:
        screenRoutes > 0
          ? Math.round((withPageObject / screenRoutes) * 100)
          : 0,
    },
    routes: entries,
    staleEntries,
  };
}
