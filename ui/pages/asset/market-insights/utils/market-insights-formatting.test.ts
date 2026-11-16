import type { MarketInsightsSource } from '@metamask/ai-controllers';
import {
  getFaviconUrl,
  getNormalizedHandle,
  getUniqueSourcesByFavicon,
  isSafeUrl,
  isXSourceUrl,
} from './market-insights-formatting';

describe('market-insights-formatting', () => {
  describe('getFaviconUrl', () => {
    it('builds a favicon URL from a full URL', () => {
      expect(getFaviconUrl('https://www.coindesk.com/article')).toBe(
        'https://www.google.com/s2/favicons?domain=www.coindesk.com&sz=32',
      );
    });

    it('builds a favicon URL from a bare domain', () => {
      expect(getFaviconUrl('coindesk.com/article')).toBe(
        'https://www.google.com/s2/favicons?domain=coindesk.com&sz=32',
      );
    });

    it('falls back to the text before the first slash for unparseable sources', () => {
      expect(getFaviconUrl('The Block/')).toBe(
        'https://www.google.com/s2/favicons?domain=The%20Block&sz=32',
      );
    });
  });

  describe('getNormalizedHandle', () => {
    it('prefixes a bare handle with @', () => {
      expect(getNormalizedHandle('ethanalyst')).toBe('@ethanalyst');
    });

    it('collapses leading @s into a single prefix', () => {
      expect(getNormalizedHandle('@@ethanalyst')).toBe('@ethanalyst');
    });
  });

  describe('isXSourceUrl', () => {
    it('matches the literal source names x and twitter', () => {
      expect(isXSourceUrl('x')).toBe(true);
      expect(isXSourceUrl('Twitter')).toBe(true);
    });

    it('matches x.com and twitter.com URLs', () => {
      expect(isXSourceUrl('https://x.com/a/status/1')).toBe(true);
      expect(isXSourceUrl('https://www.twitter.com/a')).toBe(true);
    });

    it('matches subdomains of x.com', () => {
      expect(isXSourceUrl('https://api.x.com')).toBe(true);
    });

    it('does not match other domains', () => {
      expect(isXSourceUrl('https://example.com')).toBe(false);
      expect(isXSourceUrl('https://notx.com')).toBe(false);
      expect(isXSourceUrl('https://twitter.evil.com')).toBe(false);
    });

    it('does not match unparseable sources', () => {
      expect(isXSourceUrl('not a url')).toBe(false);
    });
  });

  describe('isSafeUrl', () => {
    it('accepts https URLs and rejects http URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('http://example.com')).toBe(false);
    });

    it('rejects other schemes and unparseable URLs', () => {
      expect(isSafeUrl(['java', 'script:alert(1)'].join(''))).toBe(false);
      expect(isSafeUrl('chrome-extension://abc')).toBe(false);
      expect(isSafeUrl('not a url')).toBe(false);
    });
  });

  describe('getUniqueSourcesByFavicon', () => {
    it('keeps one source per domain in original order', () => {
      const sources: MarketInsightsSource[] = [
        { name: 'CoinDesk', type: 'news', url: 'https://coindesk.com/a' },
        { name: 'The Block', type: 'news', url: 'theblock.co' },
        { name: 'CoinDesk again', type: 'news', url: 'coindesk.com/b' },
      ];

      expect(getUniqueSourcesByFavicon(sources)).toEqual([
        { name: 'CoinDesk', type: 'news', url: 'https://coindesk.com/a' },
        { name: 'The Block', type: 'news', url: 'theblock.co' },
      ]);
    });

    it('returns an empty array for no sources', () => {
      expect(getUniqueSourcesByFavicon([])).toEqual([]);
    });
  });
});
