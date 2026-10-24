import { RAMPS_BUY_DEEP_LINK_ENTRY_PATH } from '../common';
import { buy } from './buy';
import type { Destination } from './route';

function assertRedirectDestination(
  result: Destination,
): asserts result is Extract<Destination, { redirectTo: URL }> {
  expect('redirectTo' in result).toBe(true);
}

function assertPathDestination(
  result: Destination,
): asserts result is Extract<Destination, { path: string }> {
  expect('path' in result).toBe(true);
}

describe('buyRoute', () => {
  const params = new URLSearchParams({ address: '0xabc', chainId: '137' });

  it('redirects to the Portfolio page when the ramps flag is off', () => {
    const result = buy.handler(params, { getIsRampsEnabled: () => false });

    assertRedirectDestination(result);
    expect(result.redirectTo.toString()).toBe(
      'https://app.metamask.io/buy?address=0xabc&chainId=137',
    );
  });

  it('redirects to the Portfolio page when no flag getter is provided', () => {
    const result = buy.handler(params);

    assertRedirectDestination(result);
    expect(result.redirectTo.toString()).toBe(
      'https://app.metamask.io/buy?address=0xabc&chainId=137',
    );
  });

  it('routes to the in-app entry page with the params forwarded when the ramps flag is on', () => {
    const result = buy.handler(params, { getIsRampsEnabled: () => true });

    assertPathDestination(result);
    expect(result.path).toBe(RAMPS_BUY_DEEP_LINK_ENTRY_PATH);
    expect(Object.fromEntries(result.query)).toStrictEqual(
      Object.fromEntries(params),
    );
  });

  it('routes to the in-app entry page with an empty query when the link has no params', () => {
    const result = buy.handler(new URLSearchParams(), {
      getIsRampsEnabled: () => true,
    });

    assertPathDestination(result);
    expect(result.path).toBe(RAMPS_BUY_DEEP_LINK_ENTRY_PATH);
    expect(result.query.toString()).toBe('');
  });
});
