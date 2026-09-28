import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  getNearestMatchedRoute,
  normalizeRoutePathname,
} from './nearest-route';

const routes = [
  { path: DEFAULT_ROUTE },
  { path: '/unlock' },
  { path: '/snaps' },
  { path: '/snaps/view' },
  { path: '/settings/*' },
  { path: '/money-home' },
  { path: '/money-home/activity' },
  { path: '/money-home/activity/:transactionId' },
  { path: '/perps/activity' },
  { path: '/account-list' },
  { path: '/send/:page?' },
  { path: '*' },
];

describe('normalizeRoutePathname', () => {
  it('returns home for an empty pathname', () => {
    expect(normalizeRoutePathname('')).toBe(DEFAULT_ROUTE);
  });

  it('strips a trailing slash', () => {
    expect(normalizeRoutePathname('/snaps/')).toBe('/snaps');
  });

  it('strips a query string', () => {
    expect(normalizeRoutePathname('/snaps/missing?tab=activity')).toBe(
      '/snaps/missing',
    );
  });
});

describe('getNearestMatchedRoute', () => {
  it('sends an unknown top-level path to home', () => {
    expect(getNearestMatchedRoute('/multichain-account-list', routes)).toBe(
      DEFAULT_ROUTE,
    );
  });

  it('keeps an already matched path', () => {
    expect(getNearestMatchedRoute('/account-list', routes)).toBe(
      '/account-list',
    );
    expect(getNearestMatchedRoute(DEFAULT_ROUTE, routes)).toBe(DEFAULT_ROUTE);
  });

  it('walks up to the nearest static ancestor', () => {
    expect(getNearestMatchedRoute('/snaps/not-a-page', routes)).toBe('/snaps');
    expect(getNearestMatchedRoute('/snaps/view/extra', routes)).toBe(
      '/snaps/view',
    );
    expect(getNearestMatchedRoute('/unlock/not-a-page', routes)).toBe(
      '/unlock',
    );
  });

  it('keeps a dynamic ancestor when that path is a real route', () => {
    expect(
      getNearestMatchedRoute('/money-home/activity/tx-1/extra', routes),
    ).toBe('/money-home/activity/tx-1');
  });

  it('skips path prefixes that are not registered routes', () => {
    expect(getNearestMatchedRoute('/perps/not-a-page', routes)).toBe(
      DEFAULT_ROUTE,
    );
    expect(getNearestMatchedRoute('/perps/activity/extra', routes)).toBe(
      '/perps/activity',
    );
  });

  it('leaves section trees that match a parent splat on that path', () => {
    expect(getNearestMatchedRoute('/settings/not-a-page', routes)).toBe(
      '/settings/not-a-page',
    );
  });

  it('uses the longest optional-param ancestor', () => {
    expect(getNearestMatchedRoute('/send/amount/extra', routes)).toBe(
      '/send/amount',
    );
  });
});
