import { getRouteCoverage } from './route-coverage';
import { NOT_A_SCREEN, type RoutePageObjectRegistry } from './route-registry';

class HomePage {}

class SendPage {}

const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/send', label: 'Send Page' },
  { path: '/activity', label: 'Activity' },
  { path: '/lock', label: 'Lock Page' },
  { path: '/unlock', label: 'Unlock Page' },
];

describe('getRouteCoverage', () => {
  const registry: RoutePageObjectRegistry = {
    '/': HomePage,
    '/send': SendPage,
    '/activity': null,
    '/lock': NOT_A_SCREEN,
    '/removed-route': HomePage,
  };

  it('reports each route with its page object, none yet, not a screen, or unregistered', () => {
    const { routes } = getRouteCoverage(ROUTES, registry);

    expect(routes).toStrictEqual([
      {
        path: '/',
        label: 'Home',
        status: 'page-object',
        pageObject: 'HomePage',
      },
      { path: '/activity', label: 'Activity', status: 'no-page-object' },
      { path: '/lock', label: 'Lock Page', status: 'not-a-screen' },
      {
        path: '/send',
        label: 'Send Page',
        status: 'page-object',
        pageObject: 'SendPage',
      },
      { path: '/unlock', label: 'Unlock Page', status: 'unregistered' },
    ]);
  });

  it('lists registry entries for routes that no longer exist', () => {
    const { staleEntries } = getRouteCoverage(ROUTES, registry);

    expect(staleEntries).toStrictEqual(['/removed-route']);
  });

  it('sorts routes and stale entries by path', () => {
    const { routes, staleEntries } = getRouteCoverage(
      [
        { path: '/settings/b', label: 'B' },
        { path: '', label: 'Empty' },
        { path: '/settings', label: 'Settings' },
        { path: '/settings/a', label: 'A' },
      ],
      { '/zeta': null, '/alpha': null },
    );

    expect(routes.map(({ path }) => path)).toStrictEqual([
      '',
      '/settings',
      '/settings/a',
      '/settings/b',
    ]);
    expect(staleEntries).toStrictEqual(['/alpha', '/zeta']);
  });

  it('summarizes the counts and the share of screen routes with a page object', () => {
    const { summary } = getRouteCoverage(ROUTES, registry);

    expect(summary).toStrictEqual({
      totalRoutes: 5,
      withPageObject: 2,
      withoutPageObject: 1,
      notAScreen: 1,
      unregistered: 1,
      staleEntries: 1,
      coveragePercentage: 50,
    });
  });

  it('reports 0% coverage when there are no routes', () => {
    const { summary } = getRouteCoverage([], {});

    expect(summary.coveragePercentage).toBe(0);
  });

  it('reports 0% coverage when no route is a screen', () => {
    const { summary } = getRouteCoverage([{ path: '/lock', label: 'Lock' }], {
      '/lock': NOT_A_SCREEN,
    });

    expect(summary.coveragePercentage).toBe(0);
  });
});
