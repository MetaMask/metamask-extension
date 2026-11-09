import { matchRoutes } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../../ui/helpers/constants/routes';
import {
  ROUTE_PAGE_OBJECT_REGISTRY,
  type PageObjectClass,
} from './route-registry';

export type MatchedRoute = {
  /** Route path pattern, as keyed in the registry. */
  path: string;
  pageObject: PageObjectClass | null;
};

const ROUTE_OBJECTS = [
  ...new Set(
    Object.keys(ROUTE_PAGE_OBJECT_REGISTRY).map(
      (path) => path || DEFAULT_ROUTE,
    ),
  ),
].map((path) => ({ path }));

/**
 * Finds the registry route the extension router renders for a pathname,
 * ranking routes as react-router does (static segments beat dynamic ones).
 *
 * @param pathname - The router pathname, e.g. the URL hash without `#`.
 * @returns The matched route and its page object, or `undefined`.
 */
export function matchRoute(pathname: string): MatchedRoute | undefined {
  const matches = matchRoutes(ROUTE_OBJECTS, pathname || DEFAULT_ROUTE);
  const path = matches?.at(-1)?.route.path;
  if (path === undefined) {
    return undefined;
  }
  return { path, pageObject: ROUTE_PAGE_OBJECT_REGISTRY[path] ?? null };
}
