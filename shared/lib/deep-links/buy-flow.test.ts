import { buy } from './routes/buy';
import { swap } from './routes/swap';
import { resolveBuyDeepLinkDestination } from './buy-flow';

describe('resolveBuyDeepLinkDestination', () => {
  it('returns the destination unchanged when the unified buy flag is off', () => {
    const buyDestination = {
      redirectTo: new URL(
        'https://app.metamask.io/buy?address=0xabc&chainId=1&amount=100',
      ),
    };
    const destination = resolveBuyDeepLinkDestination({
      route: buy,
      destination: buyDestination,
      isUnifiedBuyEnabled: false,
    });

    expect(destination).toStrictEqual(buyDestination);
  });

  const internalCases: [string, URL][] = [
    [
      'forwards token and amount params',
      new URL(
        'https://app.metamask.io/buy?address=0xabc&chainId=137&amount=50',
      ),
    ],
    [
      'handles a redirect with no params',
      new URL('https://app.metamask.io/buy'),
    ],
  ];
  for (const [label, portfolioUrl] of internalCases) {
    it(`routes to the internal entry destination ${label}`, () => {
      const destination = resolveBuyDeepLinkDestination({
        route: buy,
        destination: { redirectTo: portfolioUrl },
        isUnifiedBuyEnabled: true,
      });

      const internal = destination as {
        path: string;
        query: URLSearchParams;
      };
      expect(internal.path).toBe('/ramps/buy-deeplink-entry');
      expect(Object.fromEntries(internal.query)).toStrictEqual(
        Object.fromEntries(portfolioUrl.searchParams),
      );
    });
  }

  const passthroughCases: [
    string,
    typeof buy,
    { path: string; query: URLSearchParams },
  ][] = [
    [
      'passes through destinations for routes other than buy',
      swap,
      { path: swap.pathname, query: new URLSearchParams({ amount: '1' }) },
    ],
    [
      'passes through non-redirect buy destinations untouched',
      buy,
      { path: '/somewhere', query: new URLSearchParams({ foo: 'bar' }) },
    ],
  ];
  for (const [label, route, internalDestination] of passthroughCases) {
    it(`${label} when the flag is on`, () => {
      const destination = resolveBuyDeepLinkDestination({
        route,
        destination: internalDestination,
        isUnifiedBuyEnabled: true,
      });

      expect(destination).toStrictEqual(internalDestination);
    });
  }
});
