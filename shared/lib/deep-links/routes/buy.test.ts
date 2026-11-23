import { buy } from './buy';
import { RAMPS_BUY_INTERSTITIAL_ROUTE } from './route';
import type { Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('buyRoute', () => {
  const params = new URLSearchParams({ address: '0xabc', chainId: '137' });

  it('routes to the buy interstitial with the link params forwarded', () => {
    const result = buy.handler(params);

    assertPathDestination(result);
    expect(result.path).toBe(RAMPS_BUY_INTERSTITIAL_ROUTE);
    expect(Object.fromEntries(result.query)).toStrictEqual(
      Object.fromEntries(params),
    );
  });

  it('routes to the buy interstitial with an empty query when the link has no params', () => {
    const result = buy.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(RAMPS_BUY_INTERSTITIAL_ROUTE);
    expect(result.query.toString()).toBe('');
  });
});
