import { parse } from '../parse';
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
      expect(result.query.get('source')).toBe('deeplink');
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
      [
        'all',
        'crypto',
        'stock',
        'pre-ipo',
        'index',
        'etf',
        'commodity',
        'forex',
        'new',
      ] as const
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

    (
      [
        ['stocks', 'stock'],
        ['commodities', 'commodity'],
      ] as const
    ).forEach(([legacyTab, canonicalFilter]) => {
      it(`maps legacy tab=${legacyTab} to filter=${canonicalFilter}`, () => {
        const result = perps.handler(
          new URLSearchParams({ screen: 'market-list', tab: legacyTab }),
        );

        assertPathDestination(result);
        expect(result.path).toBe(PERPS_MARKET_LIST_ROUTE);
        expect(result.query.get('filter')).toBe(canonicalFilter);
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

  describe('signed deeplink attribution', () => {
    it('forwards allowlisted canonical UTM values', () => {
      const destination = perps.handler(
        new URLSearchParams(
          'screen=asset&symbol=ETH' +
            '&utm_source=partner-1&utm_medium=push&utm_campaign=q3_launch' +
            '&utm_content=not-allowlisted&redirectTo=https://evil.example',
        ),
      );

      assertPathDestination(destination);
      expect(destination.path).toBe(`${PERPS_MARKET_DETAIL_ROUTE}/ETH`);
      expect(destination.query.get('source')).toBe('deeplink');
      expect(destination.query.get('utm_source')).toBe('partner-1');
      expect(destination.query.get('utm_medium')).toBe('push');
      expect(destination.query.get('utm_campaign')).toBe('q3_launch');
      expect(destination.query.get('redirectTo')).toBeNull();
      expect(destination.query.get('utm_content')).toBeNull();
    });

    it('does not forward UTM values when verification is skipped', async () => {
      const parsed = await parse(
        new URL(
          'https://link.metamask.io/perps?screen=asset&symbol=ETH' +
            '&utm_source=unverified&utm_medium=unverified&utm_campaign=unverified' +
            '&sig_params=screen,symbol,utm_source,utm_medium,utm_campaign' +
            '&sig=signature',
        ),
        { verify: false },
      );

      expect(parsed).not.toBe(false);
      const { destination } = parsed as Exclude<typeof parsed, false>;
      assertPathDestination(destination);
      expect(destination.path).toBe(`${PERPS_MARKET_DETAIL_ROUTE}/ETH`);
      expect(destination.query.get('source')).toBe('deeplink');
      expect(destination.query.get('utm_source')).toBeNull();
      expect(destination.query.get('utm_medium')).toBeNull();
      expect(destination.query.get('utm_campaign')).toBeNull();
    });

    it('does not forward unsigned UTM values', async () => {
      const parsed = await parse(
        new URL(
          'https://link.metamask.io/perps?screen=asset&symbol=ETH' +
            '&utm_source=unsigned&utm_medium=unsigned&utm_campaign=unsigned' +
            '&sig_params=screen,symbol&sig=signature',
        ),
        { verify: false },
      );

      expect(parsed).not.toBe(false);
      const { destination } = parsed as Exclude<typeof parsed, false>;
      assertPathDestination(destination);
      expect(destination.query.get('source')).toBe('deeplink');
      expect(destination.query.get('utm_source')).toBeNull();
      expect(destination.query.get('utm_medium')).toBeNull();
      expect(destination.query.get('utm_campaign')).toBeNull();
    });

    it('does not forward signed UTM values with invalid formats', async () => {
      const oversizedValue = 'a'.repeat(129);
      const url = new URL('https://link.metamask.io/perps');
      url.searchParams.set('utm_source', 'partner/value');
      url.searchParams.set('utm_medium', 'push notification');
      url.searchParams.set('utm_campaign', oversizedValue);
      const destination = perps.handler(url.searchParams);

      assertPathDestination(destination);
      expect(destination.query.get('source')).toBe('deeplink');
      expect(destination.query.get('utm_source')).toBeNull();
      expect(destination.query.get('utm_medium')).toBeNull();
      expect(destination.query.get('utm_campaign')).toBeNull();
    });
  });
});
