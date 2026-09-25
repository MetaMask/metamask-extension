import { NavigationOrigin, parse } from '../../../shared/lib/deep-links/parse';
import { resolveTrustedDeepLinkHref } from './resolve-deep-link-href';

jest.mock('../../../shared/lib/deep-links/parse', () => ({
  ...jest.requireActual('../../../shared/lib/deep-links/parse'),
  parse: jest.fn(),
}));

const parseMock = parse as jest.MockedFunction<typeof parse>;

const arrangeParsed = (destination: object) =>
  ({
    signature: 'valid',
    route: { pathname: '/buy', getTitle: () => 'Buy' },
    destination,
  }) as Awaited<ReturnType<typeof parse>>;

describe('resolveTrustedDeepLinkHref', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns internal route hrefs unchanged', async () => {
    expect(await resolveTrustedDeepLinkHref('/buy?chainId=1')).toBe(
      '/buy?chainId=1',
    );
    expect(parseMock).not.toHaveBeenCalled();
  });

  it('returns non-deep-link-host hrefs unchanged', async () => {
    const href = 'https://example.com/buy';
    expect(await resolveTrustedDeepLinkHref(href)).toBe(href);
    expect(parseMock).not.toHaveBeenCalled();
  });

  it('resolves an internal destination to an internal href', async () => {
    parseMock.mockResolvedValue(
      arrangeParsed({
        path: '/asset/eip155:1/erc20:0xabc',
        query: new URLSearchParams([['one', 'two']]),
      }),
    );

    expect(
      await resolveTrustedDeepLinkHref('https://link.metamask.io/asset?…'),
    ).toBe('/asset/eip155:1/erc20:0xabc?one=two');
  });

  it('resolves an external redirect destination with the unified buy flag off', async () => {
    parseMock.mockResolvedValue(
      arrangeParsed({
        redirectTo: new URL('https://app.metamask.io/buy?chainId=1'),
      }),
    );

    expect(
      await resolveTrustedDeepLinkHref('https://link.metamask.io/buy'),
    ).toBe('https://app.metamask.io/buy?chainId=1');
  });

  it('routes /buy into the in-app entry route with the unified buy flag on', async () => {
    parseMock.mockResolvedValue(
      arrangeParsed({
        redirectTo: new URL('https://app.metamask.io/buy?chainId=1'),
      }),
    );

    expect(
      await resolveTrustedDeepLinkHref('https://link.metamask.io/buy', true),
    ).toBe('/ramps/buy-deeplink-entry?chainId=1');
    expect(parseMock).toHaveBeenCalledWith(expect.any(URL), {
      navigationOrigin: NavigationOrigin.INTERNAL,
    });
  });

  it('falls back to the original href when the link cannot be parsed', async () => {
    parseMock.mockResolvedValue(
      false as unknown as Awaited<ReturnType<typeof parse>>,
    );

    const href = 'https://link.metamask.io/unknown';
    expect(await resolveTrustedDeepLinkHref(href)).toBe(href);
  });

  it('falls back to the original href for an invalid URL', async () => {
    const href = 'not a url';
    expect(await resolveTrustedDeepLinkHref(href)).toBe(href);
  });
});
