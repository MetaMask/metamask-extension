import { it } from '@jest/globals';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../constants/routes';
import { isMainNavRoute } from './main-nav';

describe('isMainNavRoute', () => {
  it.each([
    ['default route', DEFAULT_ROUTE],
    ['perps home route', PERPS_HOME_PAGE_ROUTE],
    ['Money home route', MONEY_HOME_ROUTE],
    ['activity route', ACTIVITY_ROUTE],
  ])('returns true for the %s', (_label, route) => {
    expect(isMainNavRoute(route)).toBe(true);
  });

  it.each([['/settings'], ['/send'], ['/confirm-transaction'], ['/unknown']])(
    'returns false for %s',
    (route) => {
      expect(isMainNavRoute(route)).toBe(false);
    },
  );
});
