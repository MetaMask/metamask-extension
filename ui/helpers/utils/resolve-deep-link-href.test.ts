import { it as jestIt } from '@jest/globals';
import { RAMPS_BUY_DEEP_LINK_ENTRY_PATH } from '../../../shared/lib/deep-links/common';
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

  jestIt.each(['invalid.link.metamask.io', 'invalid.link.metamask.com'])(
    'leaves a supported deep link from subdomain %s unchanged',
    async (host) => {
      const href = `https://${host}/home?openNetworkSelector=true`;
      await expect(resolveTrustedDeepLinkHref(href)).resolves.toBe(href);
    },
  );

  jestIt.each([
    {
      description: 'a lookalike hostname',
      href: 'https://link.metamask.com.evil.com/home?openNetworkSelector=true',
      expected:
        'https://link.metamask.com.evil.com/home?openNetworkSelector=true',
    },
    {
      description: 'an internal route href',
      href: '/buy?chainId=1',
      expected: '/buy?chainId=1',
    },
    {
      description: 'a /buy deep link',
      href: 'https://link.metamask.io/buy?chainId=1',
      expected: `${RAMPS_BUY_DEEP_LINK_ENTRY_PATH}?chainId=1`,
    },
    {
      description: 'an unparseable deep link',
      href: 'https://link.metamask.io/unknown',
      expected: 'https://link.metamask.io/unknown',
    },
    {
      description: 'an invalid URL',
      href: 'not a url',
      expected: 'not a url',
    },
  ])(
    'returns the expected href for $description',
    async ({ href, expected }) => {
      await expect(resolveTrustedDeepLinkHref(href)).resolves.toBe(expected);
    },
  );
});
