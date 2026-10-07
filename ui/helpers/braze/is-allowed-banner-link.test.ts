/* eslint-disable no-script-url -- Exercises rejection of unsafe campaign URLs. */
import { it } from '@jest/globals';
import { isAllowedBrazeBannerLink } from './is-allowed-banner-link';

describe('isAllowedBrazeBannerLink', () => {
  it.each([
    'https://link.metamask.io/perps',
    'https://link.metamask.com/swap?chainId=1',
  ])('accepts MetaMask universal link %s', (href) => {
    expect(isAllowedBrazeBannerLink(href)).toBe(true);
  });

  it.each([
    '/send',
    '//link.metamask.io/send',
    'metamask://connect/mwp',
    'http://link.metamask.io/send',
    'https://link.metamask.io.evil.com/send',
    'https://evil.link.metamask.io/send',
    'https://evil.com/send',
    'https://user:password@link.metamask.io/send',
    'https://link.metamask.io:8080/send',
    'javascript:alert(1)',
    'data:text/html,test',
    'not a URL',
  ])('rejects unapproved link %s', (href) => {
    expect(isAllowedBrazeBannerLink(href)).toBe(false);
  });
});
