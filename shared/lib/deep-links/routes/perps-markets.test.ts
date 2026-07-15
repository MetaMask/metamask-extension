/* eslint-disable @typescript-eslint/naming-convention -- deeplink URL query params use snake_case */
import { perpsMarkets } from './perps-markets';
import { DEFAULT_ROUTE, type Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('perpsMarketsRoute', () => {
  it('navigates to the home route with the perps tab selected', () => {
    const result = perpsMarkets.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(DEFAULT_ROUTE);
    expect(result.query.get('tab')).toBe('perps');
  });

  it('ignores any params', () => {
    const result = perpsMarkets.handler(new URLSearchParams({ foo: 'bar' }));

    assertPathDestination(result);
    expect(result.path).toBe(DEFAULT_ROUTE);
    expect(result.query.get('tab')).toBe('perps');
  });

  it('marks source=deeplink and forwards utm_* on the destination', () => {
    const result = perpsMarkets.handler(
      new URLSearchParams({ utm_source: 'ads', utm_medium: 'cpc' }),
    );

    assertPathDestination(result);
    expect(result.query.get('tab')).toBe('perps');
    expect(result.query.get('source')).toBe('deeplink');
    expect(result.query.get('utm_source')).toBe('ads');
    expect(result.query.get('utm_medium')).toBe('cpc');
  });
});
