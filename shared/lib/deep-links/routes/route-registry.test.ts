import { it as jestIt } from '@jest/globals';
import { Route } from './route';
import { addRoute, matchRoute, routes } from './route-registry';

function createRoute(pathname: string): Route {
  return new Route({
    pathname,
    getTitle: () => 'deepLink_theHomePage',
    handler: (params) => ({ path: '/', query: params }),
  });
}

describe('addRoute', () => {
  beforeEach(() => {
    routes.clear();
  });

  it('adds a route to the segment tree', () => {
    const testRoute = createRoute('/test');
    addRoute(testRoute);
    expect(matchRoute('/test')).toBe(testRoute);
  });

  it('allows adding multiple unique routes', () => {
    const testRoute = createRoute('/test');
    const route2 = createRoute('/b');
    addRoute(testRoute);
    addRoute(route2);
    expect(matchRoute('/test')).toBe(testRoute);
    expect(matchRoute('/b')).toBe(route2);
  });

  it('matches a complete wildcard segment', () => {
    const route = createRoute('/social/*/whatever');
    addRoute(route);

    expect(matchRoute('/social/alice/whatever')).toBe(route);
  });

  it('throws if adding a duplicate route', () => {
    const testRoute = createRoute('/test');
    const clonedRoute = { ...testRoute };
    addRoute(testRoute);
    expect(() => addRoute(clonedRoute)).toThrow(
      `Route with pathname "${testRoute.pathname}" already exists.`,
    );
  });

  it('does not replace the existing route after a duplicate registration', () => {
    const testRoute = createRoute('/test');
    addRoute(testRoute);
    expect(() => addRoute({ ...testRoute })).toThrow(
      'Route with pathname "/test" already exists.',
    );
    expect(matchRoute('/test')).toBe(testRoute);
  });

  jestIt.each([
    ['/social/*/posts', '/social/admin/posts'],
    ['/social/admin/posts', '/social/*/posts'],
    ['/social/*/posts', '/social/admin/settings'],
    ['/social/admin/settings', '/social/*/posts'],
    ['/social/alice/posts', '/social/*/posts'],
  ])('rejects %s followed by %s', (existingPattern, addedPattern) => {
    const existingRoute = createRoute(existingPattern);
    addRoute(existingRoute);

    expect(() => addRoute(createRoute(addedPattern))).toThrow(
      `Route with pathname "${addedPattern}" conflicts at segment`,
    );
    expect(matchRoute(existingPattern.replace('*', 'alice'))).toBe(
      existingRoute,
    );
  });

  it('reuses wildcard nodes for routes with different suffixes', () => {
    const postsRoute = createRoute('/social/*/posts');
    const profileRoute = createRoute('/social/*/profile');
    addRoute(postsRoute);
    addRoute(profileRoute);

    expect(matchRoute('/social/alice/posts')).toBe(postsRoute);
    expect(matchRoute('/social/bob/profile')).toBe(profileRoute);
  });

  jestIt.each([true, false])(
    'allows a route to have children when the parent is registered first: %s',
    (parentFirst) => {
      const parent = createRoute('/social');
      const child = createRoute('/social/*');
      const registrationOrder = parentFirst ? [parent, child] : [child, parent];
      registrationOrder.forEach(addRoute);

      expect(matchRoute('/social')).toBe(parent);
      expect(matchRoute('/social/alice')).toBe(child);
    },
  );

  it('leaves the trailing wildcard slash convention to tests', () => {
    expect(() => addRoute(createRoute('/social/*/'))).not.toThrow();
  });
});

describe('matchRoute', () => {
  beforeEach(() => {
    routes.clear();
  });

  jestIt.each([
    ['/social', '/social'],
    ['/social', '/SOCIAL'],
    ['/social/*', '/social/alice'],
    ['/social/*/whatever', '/social/alice/whatever'],
    ['/social/*/whatever', '/SOCIAL/ALICE/WHATEVER'],
    ['/social/*/whatever', '/social/alice%2Fbob/whatever'],
    ['/social/*/*/whatever', '/social/alice/posts/whatever'],
    ['/social.v1/*', '/social.v1/alice'],
    ['/social/', '/social/'],
    ['/social//posts', '/social//posts'],
    ['/', '/'],
  ])('matches %s against %s', (pattern, pathname) => {
    const route = createRoute(pattern);
    addRoute(route);

    expect(matchRoute(pathname)).toBe(route);
  });

  jestIt.each([
    ['/social', '/social/'],
    ['/social', '/social/alice'],
    ['/social', '/socially'],
    ['/social/*', '/social'],
    ['/social/*', '/social/'],
    ['/social/*', '/social/alice/'],
    ['/social/*', '/social/alice/posts'],
    ['/social/*/whatever', '/social//whatever'],
    ['/social/*/whatever', '/social/alice/bob/whatever'],
    ['/social/*/whatever', '/social/alice/whatever/extra'],
    ['/social.v1/*', '/socialXv1/alice'],
    ['/*', '/'],
  ])('does not match %s against %s', (pattern, pathname) => {
    addRoute(createRoute(pattern));

    expect(matchRoute(pathname)).toBeUndefined();
  });

  it('returns undefined when no route is registered', () => {
    expect(matchRoute('/unknown')).toBeUndefined();
  });
});
