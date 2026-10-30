import { RAMPS_BUY_DEEP_LINK_ENTRY_PATH } from '../common';
import { buy, getBuyPortfolioRedirectDestination } from './buy';
import type { Destination } from './route';

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('buyRoute', () => {
  const params = new URLSearchParams({ address: '0xabc', chainId: '137' });

  it('routes to the in-app entry page with the link params forwarded', () => {
    const result = buy.handler(params);

    assertPathDestination(result);
    expect(result.path).toBe(RAMPS_BUY_DEEP_LINK_ENTRY_PATH);
    expect(Object.fromEntries(result.query)).toStrictEqual(
      Object.fromEntries(params),
    );
  });

  it('routes to the in-app entry page with an empty query when the link has no params', () => {
    const result = buy.handler(new URLSearchParams());

    assertPathDestination(result);
    expect(result.path).toBe(RAMPS_BUY_DEEP_LINK_ENTRY_PATH);
    expect(result.query.toString()).toBe('');
  });

  it('builds the Portfolio fallback URL with the link params forwarded', () => {
    const result = getBuyPortfolioRedirectDestination(params);

    expect(result.redirectTo.toString()).toBe(
      'https://app.metamask.io/buy?address=0xabc&chainId=137',
    );
  });
});
