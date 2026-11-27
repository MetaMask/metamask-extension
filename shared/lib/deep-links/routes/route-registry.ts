import type { Route } from './route';

type RouteNode = {
  children: Map<string, RouteNode>;
  route?: Route;
};

export const routes = new Map<string, RouteNode>();
const root: RouteNode = { children: routes };

/**
 * Matches an entire pathname, with each wildcard consuming one nonempty segment.
 *
 * @param pathname - The encoded URL pathname to match.
 * @returns The matching route, if one exists.
 */
export function matchRoute(pathname: string): Route | undefined {
  let node = root;

  for (const segment of pathname.toLowerCase().split('/')) {
    const child =
      node.children.get(segment) ??
      (segment ? node.children.get('*') : undefined);
    if (!child) {
      return undefined;
    }
    node = child;
  }

  return node.route;
}

/**
 * Adds a route to the segment tree without mixing wildcard and literal siblings.
 *
 * @param route - The route to add.
 * @throws If the route conflicts with an existing segment or duplicates a route.
 */
export function addRoute(route: Route): void {
  let node = root;

  for (const segment of route.pathname.toLowerCase().split('/')) {
    const hasWildcard = node.children.has('*');
    if (
      (segment === '*' && !hasWildcard && node.children.size > 0) ||
      (segment !== '*' && hasWildcard)
    ) {
      throw new Error(
        `Route with pathname "${route.pathname}" conflicts at segment "${segment}".`,
      );
    }

    let child = node.children.get(segment);
    if (!child) {
      child = { children: new Map() };
      node.children.set(segment, child);
    }
    node = child;
  }

  if (node.route) {
    throw new Error(`Route with pathname "${route.pathname}" already exists.`);
  }
  node.route = route;
}
