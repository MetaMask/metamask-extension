import {
  CONFIRMATION_V_NEXT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  UNLOCK_ROUTE,
} from '../../helpers/constants/routes';
import { lazyRouteLoaders } from './lazy-route-loaders';
import {
  getLikelyPreloadLoadersFromLocation,
  getPathnameFromHash,
  PRELOAD_ROUTE_PATHS,
} from './preload-route-config';

describe('preload route config', () => {
  it('keeps preload route paths aligned with the router constants', () => {
    expect(PRELOAD_ROUTE_PATHS).toStrictEqual({
      default: DEFAULT_ROUTE,
      unlock: UNLOCK_ROUTE,
      confirmTransaction: CONFIRM_TRANSACTION_ROUTE,
      confirmation: CONFIRMATION_V_NEXT_ROUTE,
    });
  });

  describe('getPathnameFromHash', () => {
    it.each([
      ['', '/'],
      ['#', '/'],
      ['#/', '/'],
      ['#/unlock', '/unlock'],
      ['unlock', '/unlock'],
      ['#/confirm-transaction/123?foo=bar', '/confirm-transaction/123'],
      ['#/confirmation/123#section', '/confirmation/123'],
    ])('returns %s as %s', (hash, expectedPathname) => {
      expect(getPathnameFromHash(hash)).toBe(expectedPathname);
    });
  });

  describe('getLikelyPreloadLoadersFromLocation', () => {
    it('returns home and unlock loaders for the default home route', () => {
      expect(
        getLikelyPreloadLoadersFromLocation({
          hash: '',
          pathname: '/home.html',
        }),
      ).toStrictEqual([lazyRouteLoaders.home, lazyRouteLoaders.unlock]);
    });

    it('returns unlock loader for the unlock route', () => {
      expect(
        getLikelyPreloadLoadersFromLocation({
          hash: '#/unlock',
          pathname: '/home.html',
        }),
      ).toStrictEqual([lazyRouteLoaders.unlock]);
    });

    it('returns confirmation loaders for the default notification route', () => {
      expect(
        getLikelyPreloadLoadersFromLocation({
          hash: '',
          pathname: '/notification.html',
        }),
      ).toStrictEqual([
        lazyRouteLoaders.confirmTransaction,
        lazyRouteLoaders.confirmation,
        lazyRouteLoaders.unlock,
      ]);
    });

    it('returns confirm transaction loader for confirm transaction routes', () => {
      expect(
        getLikelyPreloadLoadersFromLocation({
          hash: '#/confirm-transaction/123',
          pathname: '/notification.html',
        }),
      ).toStrictEqual([lazyRouteLoaders.confirmTransaction]);
    });

    it('returns confirmation loader for confirmation routes', () => {
      expect(
        getLikelyPreloadLoadersFromLocation({
          hash: '#/confirmation/123',
          pathname: '/notification.html',
        }),
      ).toStrictEqual([lazyRouteLoaders.confirmation]);
    });

    it('returns no loaders for unknown routes', () => {
      expect(
        getLikelyPreloadLoadersFromLocation({
          hash: '#/settings',
          pathname: '/home.html',
        }),
      ).toStrictEqual([]);
    });
  });
});
