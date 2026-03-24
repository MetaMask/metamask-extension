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
      new URLSearchParams({ [PerpsMarketQueryParams.Symbol]: 'BTC-USD' }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(`${PERPS_MARKET_DETAIL_ROUTE}/BTC-USD`);
    expect(result.query.toString()).toBe('');
  });

  it('navigates to the market detail page for a HIP-3 symbol', () => {
    const result = perpsMarket.handler(
      new URLSearchParams({ [PerpsMarketQueryParams.Symbol]: 'AAPL-USD' }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(`${PERPS_MARKET_DETAIL_ROUTE}/AAPL-USD`);
  });

  it('URL-encodes symbols with special characters', () => {
    const result = perpsMarket.handler(
      new URLSearchParams({
        [PerpsMarketQueryParams.Symbol]: 'EUR/USD',
      }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(
      `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent('EUR/USD')}`,
    );
  });

  it('throws when symbol param is missing', () => {
    expect(() => perpsMarket.handler(new URLSearchParams())).toThrow(
      'Missing symbol parameter',
    );
  });
});
