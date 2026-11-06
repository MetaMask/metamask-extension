import type { RoutePageObjectRegistry } from './route-registry';

export type RouteCoverageStatus =
  | 'page-object'
  | 'no-page-object'
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
    unregistered: number;
    staleEntries: number;
    coveragePercentage: number;
  };
  routes: RouteCoverageEntry[];
  /** Registry paths that are not in `ROUTES` (renamed or removed routes). */
  staleEntries: string[];
};

/**
 * Compares the routes with the page object registry.
 *
 * @param routes - The routes to cover, normally `ROUTES`.
 * @param registry - Route path → page object (or `null`).
 * @returns Per-route status, stale registry entries and a summary.
 */
export function getRouteCoverage(
  routes: readonly { path: string; label: string }[],
  registry: RoutePageObjectRegistry,
): RouteCoverageReport {
  const entries = routes.map(({ path, label }): RouteCoverageEntry => {
    if (!Object.hasOwn(registry, path)) {
      return { path, label, status: 'unregistered' };
    }
    const pageObject = registry[path];
    return pageObject
      ? { path, label, status: 'page-object', pageObject: pageObject.name }
      : { path, label, status: 'no-page-object' };
  });

  const routePaths = new Set(routes.map(({ path }) => path));
  const staleEntries = Object.keys(registry).filter(
    (path) => !routePaths.has(path),
  );
  const count = (status: RouteCoverageStatus) =>
    entries.filter((entry) => entry.status === status).length;
  const withPageObject = count('page-object');

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRoutes: entries.length,
      withPageObject,
      withoutPageObject: count('no-page-object'),
      unregistered: count('unregistered'),
      staleEntries: staleEntries.length,
      coveragePercentage:
        entries.length > 0
          ? Math.round((withPageObject / entries.length) * 100)
          : 0,
    },
    routes: entries,
    staleEntries,
  };
}
