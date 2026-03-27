import { perpsMarket, PerpsMarketQueryParams } from './perps-market';
import { PERPS_MARKET_DETAIL_ROUTE, Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsMarketRoute', () => {
  it('navigates to the market detail page for a crypto symbol', () => {
    const result = perpsMarket.handler(
      new URLSearchParams({ [PerpsMarketQueryParams.MarketSymbol]: 'BTC' }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(`${PERPS_MARKET_DETAIL_ROUTE}/BTC`);
    expect(result.query.toString()).toBe('');
  });

  it('navigates to the market detail page for a HIP-3 equity symbol', () => {
    const result = perpsMarket.handler(
      new URLSearchParams({
        [PerpsMarketQueryParams.MarketSymbol]: 'xyz:TSLA',
      }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(
      `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent('xyz:TSLA')}`,
    );
  });

  it('navigates to the market detail page for a HIP-3 forex symbol', () => {
    const result = perpsMarket.handler(
      new URLSearchParams({
        [PerpsMarketQueryParams.MarketSymbol]: 'xyz:EUR',
      }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(
      `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent('xyz:EUR')}`,
    );
  });

  it('navigates to the market detail page for a HIP-3 commodity symbol', () => {
    const result = perpsMarket.handler(
      new URLSearchParams({
        [PerpsMarketQueryParams.MarketSymbol]: 'xyz:GOLD',
      }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(
      `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent('xyz:GOLD')}`,
    );
  });

  it('throws when symbol param is missing', () => {
    expect(() => perpsMarket.handler(new URLSearchParams())).toThrow(
      'Missing symbol parameter',
    );
  });
});
