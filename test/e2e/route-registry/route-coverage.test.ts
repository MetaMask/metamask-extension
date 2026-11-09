import { getRouteCoverage } from './route-coverage';
import type { RoutePageObjectRegistry } from './route-registry';

class HomePage {}

class SendPage {}

const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/send', label: 'Send Page' },
  { path: '/activity', label: 'Activity' },
  { path: '/lock', label: 'Lock Page' },
];

describe('getRouteCoverage', () => {
  const registry: RoutePageObjectRegistry = {
    '/': HomePage,
    '/send': SendPage,
    '/activity': null,
    '/removed-route': HomePage,
  };

  it('reports each route with its page object, none yet, or unregistered', () => {
    const { routes } = getRouteCoverage(ROUTES, registry);

    expect(routes).toStrictEqual([
      {
        path: '/',
        label: 'Home',
        status: 'page-object',
        pageObject: 'HomePage',
      },
      {
        path: '/send',
        label: 'Send Page',
        status: 'page-object',
        pageObject: 'SendPage',
      },
      { path: '/activity', label: 'Activity', status: 'no-page-object' },
      { path: '/lock', label: 'Lock Page', status: 'unregistered' },
    ]);
  });

  it('lists registry entries for routes that no longer exist', () => {
    const { staleEntries } = getRouteCoverage(ROUTES, registry);

    expect(staleEntries).toStrictEqual(['/removed-route']);
  });

  it('summarizes the counts and the share of routes with a page object', () => {
    const { summary } = getRouteCoverage(ROUTES, registry);

    expect(summary).toStrictEqual({
      totalRoutes: 4,
      withPageObject: 2,
      withoutPageObject: 1,
      unregistered: 1,
      staleEntries: 1,
      coveragePercentage: 50,
    });
  });

  it('reports 0% coverage when there are no routes', () => {
    const { summary } = getRouteCoverage([], {});

    expect(summary.coveragePercentage).toBe(0);
  });
});
