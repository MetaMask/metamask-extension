import { it as jestIt } from '@jest/globals';
import {
  CANONICAL_DEEP_LINK_HOST,
  DEEP_LINK_HOSTS,
  isDeepLinkHost,
} from './constants';

describe('deep-link host constants', () => {
  it('configures metamask.io as the primary host and metamask.com as an alternate host', () => {
    expect(CANONICAL_DEEP_LINK_HOST).toBe('link.metamask.io');
    expect(DEEP_LINK_HOSTS).toStrictEqual([
      'link.metamask.io',
      'link.metamask.com',
    ]);
  });
});

describe('isDeepLinkHost', () => {
  jestIt.each([
    'link.metamask.io',
    'links.link.metamask.io',
    'link.metamask.com',
    'links.link.metamask.com',
  ])('accepts configured host %s', (hostname) => {
    expect(isDeepLinkHost(hostname)).toBe(true);
  });

  jestIt.each([
    'metamask.com',
    'link.metamask.com.evil.com',
    'link.metamask.io.evil.com',
  ])('rejects unconfigured host %s', (hostname) => {
    expect(isDeepLinkHost(hostname)).toBe(false);
  });
});
