/* eslint-disable @typescript-eslint/naming-convention -- deeplink URL query params use snake_case */
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
    // Every deeplink entry is marked source=deeplink for attribution.
    expect(result.query.get('source')).toBe('deeplink');
    expect(result.query.get('utm_source')).toBeNull();
  });

  it('marks source=deeplink and forwards utm_* on the destination', () => {
    const result = perpsAsset.handler(
      new URLSearchParams({
        symbol: 'ETH',
        utm_source: 'ads',
        utm_campaign: 'summer',
      }),
    );

    assertPathDestination(result);
    expect(result.query.get('source')).toBe('deeplink');
    expect(result.query.get('utm_source')).toBe('ads');
    expect(result.query.get('utm_campaign')).toBe('summer');
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
