import { it as jestIt } from '@jest/globals';
import { resolveTrustedDeepLinkHref } from './resolve-deep-link-href';

describe('resolveTrustedDeepLinkHref', () => {
  jestIt.each(['link.metamask.io', 'link.metamask.com'])(
    'resolves a supported deep link from %s',
    async (host) => {
      await expect(
        resolveTrustedDeepLinkHref(
          `https://${host}/home?openNetworkSelector=true`,
        ),
      ).resolves.toBe('/?openNetworkSelector=true');
    },
  );

  it('resolves a supported deep link from a configured subdomain', async () => {
    await expect(
      resolveTrustedDeepLinkHref(
        'https://links.link.metamask.com/home?openNetworkSelector=true',
      ),
    ).resolves.toBe('/?openNetworkSelector=true');
  });

  it('leaves a lookalike hostname unchanged', async () => {
    const href =
      'https://link.metamask.com.evil.com/home?openNetworkSelector=true';

    await expect(resolveTrustedDeepLinkHref(href)).resolves.toBe(href);
  });

  it('returns internal route hrefs unchanged', async () => {
    await expect(resolveTrustedDeepLinkHref('/buy?chainId=1')).resolves.toBe(
      '/buy?chainId=1',
    );
  });

  it('resolves /buy to the Portfolio redirect with the unified buy flag off', async () => {
    await expect(
      resolveTrustedDeepLinkHref('https://link.metamask.io/buy?chainId=1'),
    ).resolves.toBe('https://app.metamask.io/buy?chainId=1');
  });

  it('routes /buy into the in-app entry route with the unified buy flag on', async () => {
    await expect(
      resolveTrustedDeepLinkHref('https://link.metamask.io/buy?chainId=1', true),
    ).resolves.toBe('/ramps/buy-deeplink-entry?chainId=1');
  });

  it('falls back to the original href when the link cannot be parsed', async () => {
    const href = 'https://link.metamask.io/unknown';
    await expect(resolveTrustedDeepLinkHref(href)).resolves.toBe(href);
  });

  it('falls back to the original href for an invalid URL', async () => {
    const href = 'not a url';
    await expect(resolveTrustedDeepLinkHref(href)).resolves.toBe(href);
  });
});
