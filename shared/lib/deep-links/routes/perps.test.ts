import { perps } from './perps';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
  type Destination,
} from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsRoute', () => {
  describe('default / no screen param', () => {
    it('navigates to the home route with the perps tab selected', () => {
      const result = perps.handler(new URLSearchParams());

      assertPathDestination(result);
      expect(result.path).toBe(DEFAULT_ROUTE);
      expect(result.query.get('tab')).toBe('perps');
    });

    it('ignores unknown params', () => {
      const result = perps.handler(new URLSearchParams({ foo: 'bar' }));

      assertPathDestination(result);
      expect(result.path).toBe(DEFAULT_ROUTE);
      expect(result.query.get('tab')).toBe('perps');
    });
  });

  describe('screen=tabs', () => {
    it('navigates to the home route with the perps tab selected', () => {
      const result = perps.handler(new URLSearchParams({ screen: 'tabs' }));

      assertPathDestination(result);
      expect(result.path).toBe(DEFAULT_ROUTE);
      expect(result.query.get('tab')).toBe('perps');
    });
  });

  describe('screen=home', () => {
    it('navigates to the home route with the perps tab selected', () => {
      const result = perps.handler(new URLSearchParams({ screen: 'home' }));

      assertPathDestination(result);
      expect(result.path).toBe(DEFAULT_ROUTE);
      expect(result.query.get('tab')).toBe('perps');
    });
  });

  describe('screen=markets', () => {
    it('navigates to the home route with the perps tab selected (backwards compat)', () => {
      const result = perps.handler(new URLSearchParams({ screen: 'markets' }));

      assertPathDestination(result);
      expect(result.path).toBe(DEFAULT_ROUTE);
      expect(result.query.get('tab')).toBe('perps');
    });
  });

  describe('screen=asset', () => {
    it('navigates to the market detail route for a crypto symbol', () => {
      const result = perps.handler(
        new URLSearchParams({ screen: 'asset', symbol: 'ETH' }),
      );

      assertPathDestination(result);
      expect(result.path).toBe(`${PERPS_MARKET_DETAIL_ROUTE}/ETH`);
      expect(result.query.toString()).toBe('');
    });

    it('navigates to the market detail route for a HIP-3 symbol', () => {
      const result = perps.handler(
        new URLSearchParams({ screen: 'asset', symbol: 'xyz:TSLA' }),
      );

      assertPathDestination(result);
      expect(result.path).toBe(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent('xyz:TSLA')}`,
      );
    });

    it('throws when symbol is missing', () => {
      expect(() =>
        perps.handler(new URLSearchParams({ screen: 'asset' })),
      ).toThrow('Missing symbol parameter');
    });
  });

  describe('screen=market-list', () => {
    it('navigates to the market list with no filter when tab is absent', () => {
      const result = perps.handler(
        new URLSearchParams({ screen: 'market-list' }),
      );

      assertPathDestination(result);
      expect(result.path).toBe(PERPS_MARKET_LIST_ROUTE);
      expect(result.query.get('filter')).toBeNull();
    });

    (
      ['all', 'crypto', 'stocks', 'commodities', 'forex', 'new'] as const
    ).forEach((tab) => {
      it(`maps tab=${tab} to filter=${tab}`, () => {
        const result = perps.handler(
          new URLSearchParams({ screen: 'market-list', tab }),
        );

        assertPathDestination(result);
        expect(result.path).toBe(PERPS_MARKET_LIST_ROUTE);
        expect(result.query.get('filter')).toBe(tab);
      });
    });

    it('ignores an invalid tab value', () => {
      const result = perps.handler(
        new URLSearchParams({ screen: 'market-list', tab: 'invalid' }),
      );

      assertPathDestination(result);
      expect(result.path).toBe(PERPS_MARKET_LIST_ROUTE);
      expect(result.query.get('filter')).toBeNull();
    });
  });
});
