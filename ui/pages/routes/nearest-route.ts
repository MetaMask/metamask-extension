import { matchRoutes } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

/**
 * Routes passed to {@link matchRoutes}. Kept structural so callers can hand
 * over the app route config without a cast.
 */
type MatchableRoutes = Parameters<typeof matchRoutes>[0];

const FALLBACK_ROUTE_PATH = '*';

/**
 * Drops a query or hash and a trailing slash so ancestor lookups compare
 * the same pathname shape React Router matches against.
 *
 * @param pathname - Location pathname, possibly with a query or trailing slash
 * @returns Pathname beginning with `/`
 */
export function normalizeRoutePathname(pathname: string): string {
  const withoutQuery = pathname.split(/[?#]/u)[0] ?? '';

  if (withoutQuery === '' || withoutQuery === DEFAULT_ROUTE) {
    return DEFAULT_ROUTE;
  }

  const withLeadingSlash = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`;

  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}

/**
 * A match counts when some route in the branch declares a real path.
 * The app-wide `*` fallback matches every URL, so it is ignored here.
 *
 * @param pathname - Candidate pathname
 * @param routes - Route config to match against
 * @returns Whether `pathname` is handled by a route other than the fallback
 */
function hasConcreteRouteMatch(
  pathname: string,
  routes: MatchableRoutes,
): boolean {
  const matches = matchRoutes(routes, pathname);

  return Boolean(
    matches?.some((match) => {
      const { path } = match.route;
      return typeof path === 'string' && path !== FALLBACK_ROUTE_PATH;
    }),
  );
}

/**
 * Parent pathname, or `/` once there is nowhere left to walk.
 *
 * @param pathname - Normalized pathname
 * @returns The path with its last segment removed
 */
function parentPathname(pathname: string): string {
  const slashIndex = pathname.lastIndexOf('/');

  if (slashIndex <= 0) {
    return DEFAULT_ROUTE;
  }

  return pathname.slice(0, slashIndex);
}

/**
 * Resolves an unknown pathname to the closest ancestor that is a real route.
 *
 * Settings does this inside its own router (unknown `/settings/...` paths
 * render the settings root). Everywhere else, `createHashRouter` treats an
 * unmatched hash as a fatal routing error. Walking up to the nearest matched
 * route — `/snaps/missing` to `/snaps`, a removed page to `/` — keeps the
 * wallet on a page that exists.
 *
 * @param pathname - The pathname that failed to match a page
 * @param routes - Application route config, including the `*` fallback
 * @returns A pathname that matches a concrete route
 */
export function getNearestMatchedRoute(
  pathname: string,
  routes: MatchableRoutes,
): string {
  let candidate = normalizeRoutePathname(pathname);
  const seen = new Set<string>();

  while (!seen.has(candidate)) {
    seen.add(candidate);

    if (hasConcreteRouteMatch(candidate, routes)) {
      return candidate;
    }

    if (candidate === DEFAULT_ROUTE) {
      return DEFAULT_ROUTE;
    }

    candidate = parentPathname(candidate);
  }

  return DEFAULT_ROUTE;
}
