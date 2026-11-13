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
};

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
  /** Registry paths that are not in `ROUTES` (renamed or removed routes). */
  staleEntries: string[];
};

const byPath = (a: string, b: string): number => {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
};

/**
 * Compares the routes with the page object registry.
 *
 * @param routes - The routes to cover, normally `ROUTES`.
 * @param registry - Route path → page object, `NOT_A_SCREEN` or `null`.
 * @returns Per-route status and stale registry entries, both sorted by path,
 * and a summary.
 */
export function getRouteCoverage(
  routes: readonly { path: string; label: string }[],
  registry: RoutePageObjectRegistry,
): RouteCoverageReport {
  const sortedRoutes = [...routes].sort((a, b) => byPath(a.path, b.path));
  const entries = sortedRoutes.map(({ path, label }): RouteCoverageEntry => {
    if (!Object.hasOwn(registry, path)) {
      return { path, label, status: 'unregistered' };
    }
    const pageObject = registry[path];
    if (pageObject === NOT_A_SCREEN) {
      return { path, label, status: 'not-a-screen' };
    }
    return pageObject
      ? { path, label, status: 'page-object', pageObject: pageObject.name }
      : { path, label, status: 'no-page-object' };
  });

  const routePaths = new Set(routes.map(({ path }) => path));
  const staleEntries = Object.keys(registry)
    .filter((path) => !routePaths.has(path))
    .sort(byPath);
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
