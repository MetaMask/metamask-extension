import { perpsAsset } from './perps-asset';
import { PERPS_MARKET_DETAIL_ROUTE, type Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsAssetRoute', () => {
  it('navigates to the market detail route for a crypto symbol', () => {
    const result = perpsAsset.handler(new URLSearchParams({ symbol: 'BTC' }));

    assertPathDestination(result);
    expect(result.path).toBe(`${PERPS_MARKET_DETAIL_ROUTE}/BTC`);
    expect(result.query.toString()).toBe('');
  });

  it('navigates to the market detail route for a HIP-3 symbol', () => {
    const result = perpsAsset.handler(
      new URLSearchParams({ symbol: 'xyz:TSLA' }),
    );

    assertPathDestination(result);
    expect(result.path).toBe(
      `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent('xyz:TSLA')}`,
    );
  });

  it('throws when symbol is missing', () => {
    expect(() => perpsAsset.handler(new URLSearchParams())).toThrow(
      'Missing symbol parameter',
    );
  });
});
