import { it } from '@jest/globals';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
  SWAP_PATH,
} from '../../../helpers/constants/routes';
import {
  getActiveBottomNavTabs,
  isBottomNavRoute,
} from './bottom-nav-bar.utils';

describe('getActiveBottomNavTabs', () => {
  it('marks isHome active on the default route', () => {
    expect(getActiveBottomNavTabs(DEFAULT_ROUTE)).toStrictEqual({
      isHome: true,
      isPerps: false,
      isMoney: false,
      isSwaps: false,
      isActivity: false,
    });
  });

  it('marks isPerps active on the perps home route', () => {
    expect(getActiveBottomNavTabs(PERPS_HOME_PAGE_ROUTE)).toStrictEqual({
      isHome: false,
      isPerps: true,
      isMoney: false,
      isSwaps: false,
      isActivity: false,
    });
  });

  it('marks isSwaps active on the swap path', () => {
    expect(getActiveBottomNavTabs(SWAP_PATH)).toStrictEqual({
      isHome: false,
      isPerps: false,
      isMoney: false,
      isSwaps: true,
      isActivity: false,
    });
  });

  it('marks isActivity active on the activity route', () => {
    expect(getActiveBottomNavTabs(ACTIVITY_ROUTE)).toStrictEqual({
      isHome: false,
      isPerps: false,
      isMoney: false,
      isSwaps: false,
      isActivity: true,
    });
  });

  it('marks isMoney active on the Money home route', () => {
    expect(getActiveBottomNavTabs(MONEY_HOME_ROUTE)).toStrictEqual({
      isHome: false,
      isPerps: false,
      isMoney: true,
      isSwaps: false,
      isActivity: false,
    });
  });

  it('returns all false for an unrelated route', () => {
    expect(getActiveBottomNavTabs('/settings')).toStrictEqual({
      isHome: false,
      isPerps: false,
      isMoney: false,
      isSwaps: false,
      isActivity: false,
    });
  });
});

describe('isBottomNavRoute', () => {
  it.each([
    ['default route', DEFAULT_ROUTE],
    ['perps home route', PERPS_HOME_PAGE_ROUTE],
    ['Money home route', MONEY_HOME_ROUTE],
    ['swap path', SWAP_PATH],
    ['activity route', ACTIVITY_ROUTE],
  ])('returns true for the %s', (_label, route) => {
    expect(isBottomNavRoute(route)).toBe(true);
  });

  it.each([['/settings'], ['/send'], ['/confirm-transaction'], ['/unknown']])(
    'returns false for %s',
    (route) => {
      expect(isBottomNavRoute(route)).toBe(false);
    },
  );
});
