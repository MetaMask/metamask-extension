import { it as jestIt } from '@jest/globals';
import { resolveTrustedDeepLinkHref } from './resolve-deep-link-href';

describe('resolveTrustedDeepLinkHref', () => {
  jestIt.each(['link.metamask.io', 'link.metamask.com'])(
    'resolves a supported deep link from %s',
    async (host) => {
      await expect(
        resolveTrustedDeepLinkHref(
          `https://${host}/home?openNetworkSelector=true`,
          false,
        ),
      ).resolves.toBe('/?openNetworkSelector=true');
    },
  );

  it('resolves a supported deep link from a configured subdomain', async () => {
    await expect(
      resolveTrustedDeepLinkHref(
        'https://links.link.metamask.com/home?openNetworkSelector=true',
        false,
      ),
    ).resolves.toBe('/?openNetworkSelector=true');
  });

  jestIt.each([
    [
      'a lookalike hostname',
      'https://link.metamask.com.evil.com/home?openNetworkSelector=true',
    ],
    ['an unsupported deep link', 'https://link.metamask.io/unknown'],
    ['an invalid URL', 'not a url'],
  ])('falls back to the original href for %s', async (_description, href) => {
    await expect(resolveTrustedDeepLinkHref(href, false)).resolves.toBe(href);
  });

  it('returns internal route hrefs unchanged', async () => {
    await expect(
      resolveTrustedDeepLinkHref('/buy?chainId=1', false),
    ).resolves.toBe('/buy?chainId=1');
  });

  it('resolves /buy to the Portfolio redirect with the unified buy flag off', async () => {
    await expect(
      resolveTrustedDeepLinkHref(
        'https://link.metamask.io/buy?chainId=1',
        false,
      ),
    ).resolves.toBe('https://app.metamask.io/buy?chainId=1');
  });

  it('routes /buy into the in-app entry route with the unified buy flag on', async () => {
    await expect(
      resolveTrustedDeepLinkHref(
        'https://link.metamask.io/buy?chainId=1',
        true,
      ),
    ).resolves.toBe('/ramps/buy-deeplink-entry?chainId=1');
  });
});
