import { addRoute, routes, Route } from '.';

describe('addRoute', () => {
  const testRoute: Route = {
    pathname: '/test',
    name: 'Test Route',
  } as unknown as Route;

  beforeEach(() => {
    routes.clear();
    delete process.env.DEBUG;
  });

  it('adds a route to the routes map', () => {
    addRoute(testRoute);
    expect(routes.has('/test')).toBe(true);
    expect(routes.get('/test')).toBe(testRoute);
  });

  it('allows adding multiple unique routes', () => {
    const route2: Route = { pathname: '/b', name: 'B' } as unknown as Route;
    addRoute(testRoute);
    addRoute(route2);
    expect(routes.size).toBe(2);
    expect(routes.get('/test')).toBe(testRoute);
    expect(routes.get('/b')).toBe(route2);
  });

  it('throws if adding a duplicate route in DEBUG mode', () => {
    process.env.DEBUG = 'true';
    const clonedRoute = { ...testRoute };
    addRoute(testRoute);
    expect(() => addRoute(clonedRoute)).toThrow(
      `Route with pathname "${testRoute.pathname}" already exists.`,
    );
  });

  it('does not throw if adding a duplicate route when DEBUG is not set', () => {
    addRoute(testRoute);
    expect(() => addRoute(testRoute)).not.toThrow();
    expect(routes.get('/test')).toBe(testRoute);
  });
});
