import { buy } from './routes/buy';
import { swap } from './routes/swap';
import { resolveBuyDeepLinkDestination } from './buy-flow';
import type { Destination } from './routes/route';

function buildParams(entries: Record<string, string>): URLSearchParams {
  return new URLSearchParams(entries);
}

/**
 * Asserts the destination is internal (path + query) and returns it, so tests
 * can assert on its fields without conditional expects.
 * @param destination
 */
function getInternalDestination(destination: Destination): {
  path: string;
  query: URLSearchParams;
} {
  expect('redirectTo' in destination).toBe(false);
  return destination as { path: string; query: URLSearchParams };
}

describe('resolveBuyDeepLinkDestination', () => {
  const buyDestination = {
    redirectTo: new URL(
      'https://app.metamask.io/buy?address=0xabc&chainId=1&amount=100',
    ),
  };

  it('returns the destination unchanged when the unified buy flag is off', () => {
    const destination = resolveBuyDeepLinkDestination({
      route: buy,
      destination: buyDestination,
      isUnifiedBuyEnabled: false,
    });

    expect(destination).toStrictEqual(buyDestination);
  });

  it('returns the internal buy deep link entry destination when the flag is on', () => {
    const destination = resolveBuyDeepLinkDestination({
      route: buy,
      destination: buyDestination,
      isUnifiedBuyEnabled: true,
    });

    expect(getInternalDestination(destination).path).toBe(
      '/ramps/buy-deeplink-entry',
    );
  });

  it('forwards the portfolio redirect params to the entry destination query', () => {
    const destination = resolveBuyDeepLinkDestination({
      route: buy,
      destination: {
        redirectTo: new URL(
          'https://app.metamask.io/buy?address=0xabc&chainId=137&amount=50',
        ),
      },
      isUnifiedBuyEnabled: true,
    });

    const { query } = getInternalDestination(destination);
    expect(query.get('address')).toBe('0xabc');
    expect(query.get('chainId')).toBe('137');
    expect(query.get('amount')).toBe('50');
  });

  it('returns an empty query when the redirect destination has no params', () => {
    const destination = resolveBuyDeepLinkDestination({
      route: buy,
      destination: { redirectTo: new URL('https://app.metamask.io/buy') },
      isUnifiedBuyEnabled: true,
    });

    expect(getInternalDestination(destination).query.size).toBe(0);
  });

  it('passes through destinations for routes other than buy', () => {
    const internalDestination = {
      path: swap.pathname,
      query: buildParams({ amount: '1' }),
    };
    const destination = resolveBuyDeepLinkDestination({
      route: swap,
      destination: internalDestination,
      isUnifiedBuyEnabled: true,
    });

    expect(destination).toStrictEqual(internalDestination);
  });

  it('passes through non-redirect buy destinations untouched', () => {
    const internalDestination = {
      path: '/somewhere',
      query: buildParams({ foo: 'bar' }),
    };
    const destination = resolveBuyDeepLinkDestination({
      route: buy,
      destination: internalDestination,
      isUnifiedBuyEnabled: true,
    });

    expect(destination).toStrictEqual(internalDestination);
  });
});
