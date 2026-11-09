import { ROUTES } from '../../../ui/helpers/constants/routes';
import { getRouteCoverage } from './route-coverage';
import { ROUTE_PAGE_OBJECT_REGISTRY } from './route-registry';

describe('ROUTE_PAGE_OBJECT_REGISTRY', () => {
  it('maps every path to a page object class or null', () => {
    for (const [path, pageObject] of Object.entries(
      ROUTE_PAGE_OBJECT_REGISTRY,
    )) {
      expect([path, pageObject === null || typeof pageObject]).toStrictEqual([
        path,
        pageObject === null ? true : 'function',
      ]);
    }
  });

  it('keys entries by route path', () => {
    for (const path of Object.keys(ROUTE_PAGE_OBJECT_REGISTRY)) {
      expect(path === '' || path.startsWith('/')).toBe(true);
    }
  });

  // Add any path listed here to route-registry.ts, using `null` when the
  // route has no page object yet.
  it('lists every route in ROUTES', () => {
    const unregistered = getRouteCoverage(ROUTES, ROUTE_PAGE_OBJECT_REGISTRY)
      .routes.filter((route) => route.status === 'unregistered')
      .map((route) => route.path);

    expect(unregistered).toStrictEqual([]);
  });

  // Remove or rename any path listed here in route-registry.ts so it matches
  // ROUTES.
  it('has no entries for routes that are no longer in ROUTES', () => {
    const { staleEntries } = getRouteCoverage(
      ROUTES,
      ROUTE_PAGE_OBJECT_REGISTRY,
    );

    expect(staleEntries).toStrictEqual([]);
  });
});
